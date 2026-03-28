import { randomUUID } from "node:crypto";

import type { PluginInfo, PluginOutput } from "../types";
import { toolConfigs } from "../core/toolConfigs";
import { BudgetOptimizer } from "../plugins/budget-optimizer";
import { CinemaSkillsTrainer } from "../plugins/cinema-skills-trainer";
import { CreativeInspirationAssistant } from "../plugins/creative-inspiration";
import { AutomaticDocumentationGenerator } from "../plugins/documentation-generator";
import { ImmersiveConceptArt } from "../plugins/immersive-concept-art";
import { LightingSimulator } from "../plugins/lighting-simulator";
import { LocationSetCoordinator } from "../plugins/location-coordinator";
import { MRPrevizStudio } from "../plugins/mr-previz-studio";
import { ProductionReadinessReportPromptBuilder } from "../plugins/production-readiness-report";
import { PerformanceProductivityAnalyzer } from "../plugins/productivity-analyzer";
import { RiskAnalyzer } from "../plugins/risk-analyzer";
import { SetReusabilityOptimizer } from "../plugins/set-reusability";
import { TerminologyTranslator } from "../plugins/terminology-translator";
import { VirtualProductionEngine } from "../plugins/virtual-production-engine";
import { VirtualSetEditor } from "../plugins/virtual-set-editor";
import { VisualConsistencyAnalyzer } from "../plugins/visual-analyzer";
import { runPlugin } from "./plugin-executor";
import {
  readStore,
  updateStore,
  type ArtDirectorStore,
  type RawEntity,
  type StoredDecision,
  type StoredDelay,
  type StoredLocation,
  type StoredProductionBook,
  type StoredSetPiece,
  type StoredStyleGuide,
  type StoredTimeEntry,
} from "./store";

export interface ArtDirectorHandlerResponse {
  status: number;
  body: Record<string, unknown>;
}

const DEFAULT_PRODUCTION_ID = "art-director-default";

type PluginMetadataFactory = {
  new (): {
    id: string;
    name: string;
    nameAr: string;
    version: string;
    category: string;
  };
};

const PLUGIN_METADATA_FACTORIES: PluginMetadataFactory[] = [
  VisualConsistencyAnalyzer,
  TerminologyTranslator,
  BudgetOptimizer,
  LightingSimulator,
  RiskAnalyzer,
  ProductionReadinessReportPromptBuilder,
  CreativeInspirationAssistant,
  LocationSetCoordinator,
  SetReusabilityOptimizer,
  PerformanceProductivityAnalyzer,
  AutomaticDocumentationGenerator,
  MRPrevizStudio,
  VirtualSetEditor,
  CinemaSkillsTrainer,
  ImmersiveConceptArt,
  VirtualProductionEngine,
];

function success(
  data: Record<string, unknown> = {},
  status = 200
): ArtDirectorHandlerResponse {
  return {
    status,
    body: {
      success: true,
      ...data,
    },
  };
}

function failure(
  error: string,
  status = 400,
  extra: Record<string, unknown> = {}
): ArtDirectorHandlerResponse {
  return {
    status,
    body: {
      success: false,
      error,
      ...extra,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "") || DEFAULT_PRODUCTION_ID
  );
}

function uniqueById<T extends { id?: string }>(items: T[], nextItem: T): T[] {
  if (!nextItem.id) {
    return [...items, nextItem];
  }

  const nextItems = items.filter((item) => item.id !== nextItem.id);
  nextItems.push(nextItem);
  return nextItems;
}

function getPluginCatalog(): PluginInfo[] {
  return PLUGIN_METADATA_FACTORIES.map((Factory) => {
    const plugin = new Factory();
    return {
      id: plugin.id,
      name: plugin.name,
      nameAr: plugin.nameAr,
      version: plugin.version,
      category: plugin.category,
    };
  });
}

function extractNestedRecord(
  result: PluginOutput,
  key: string
): Record<string, unknown> | null {
  const data = asRecord(result.data);
  const nested = data[key];
  return isRecord(nested) ? nested : null;
}

function mapLocationType(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized === "natural") return "outdoor";
  return normalized || "interior";
}

function mapLocationTypeLabel(type: string): string {
  const normalized = mapLocationType(type);
  if (normalized === "outdoor") return "خارجي";
  if (normalized === "studio") return "استوديو";
  if (normalized === "exterior") return "خارجي";
  return "داخلي";
}

function parseDimensions(value: unknown): {
  width: number;
  height: number;
  depth: number;
} {
  const raw = asString(value);
  const matches = raw.match(/(\d+(?:\.\d+)?)/g) ?? [];
  const [width = "1", height = "1", depth = "1"] = matches;

  return {
    width: Number(width),
    height: Number(height),
    depth: Number(depth),
  };
}

function mapSetCategory(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("أثاث") || normalized.includes("furniture")) return "furniture";
  if (normalized.includes("إكسسوارات") || normalized.includes("prop")) return "prop";
  if (normalized.includes("إضاءة") || normalized.includes("lighting")) return "lighting-rig";
  if (normalized.includes("هياكل") || normalized.includes("structure")) return "structure";
  if (normalized.includes("أرض") || normalized.includes("floor")) return "floor";
  if (normalized.includes("خلف") || normalized.includes("backdrop")) return "backdrop";
  return "furniture";
}

function estimateSetValue(
  category: string,
  dimensions: { width: number; height: number; depth: number }
): number {
  const volume = Math.max(dimensions.width * dimensions.height * dimensions.depth, 1);
  const baseline =
    category === "lighting-rig"
      ? 750
      : category === "structure"
        ? 1200
        : category === "backdrop"
          ? 600
          : 450;

  return Math.round(baseline + volume * 12);
}

function buildMoodThemeLabel(mood: string): string {
  const moodMap: Record<string, string> = {
    romantic: "رومانسي",
    dramatic: "درامي",
    mysterious: "غامض",
    cheerful: "مرح",
    melancholic: "حزين",
    tense: "متوتر",
    dark: "داكن",
    neutral: "محايد",
  };

  return moodMap[mood] || "محايد";
}

function buildProductionId(name: string): string {
  return slugify(name || DEFAULT_PRODUCTION_ID);
}

function summarizeBook(book: Record<string, unknown>): Record<string, unknown> {
  const sections = Array.isArray(book.sections)
    ? book.sections.filter(isRecord).map((section) => asString(section.titleAr))
    : [];

  return {
    id: asString(book.id),
    title: asString(book.title),
    titleAr: asString(book.titleAr),
    sections,
    createdAt: asString(book.createdAt),
  };
}

function summarizeStyleGuide(guide: Record<string, unknown>): Record<string, unknown> {
  const colorPalettes = Array.isArray(guide.colorPalettes)
    ? guide.colorPalettes.filter(isRecord)
    : [];
  const paletteNames = colorPalettes
    .map((palette) => asString(palette.nameAr) || asString(palette.name))
    .filter(Boolean);

  const typography = asRecord(guide.typography);
  const typographyValues = [
    asString(typography.primaryFont),
    asString(typography.secondaryFont),
  ].filter(Boolean);

  return {
    id: asString(guide.id),
    name: asString(guide.title),
    nameAr: asString(guide.titleAr) || asString(guide.title),
    elements: [...paletteNames, ...typographyValues],
  };
}

function computeDashboardSummary(store: ArtDirectorStore): Record<string, unknown> {
  const uniqueProjects = new Set<string>();

  store.productionBooks.forEach((book) => uniqueProjects.add(book.productionId));
  store.styleGuides.forEach((guide) => uniqueProjects.add(guide.productionId));
  store.decisions.forEach((decision) => uniqueProjects.add(decision.productionId));
  store.conceptProjects.forEach((project) => {
    const id = asString(project.id);
    if (id) uniqueProjects.add(id);
  });
  store.virtualProductions.forEach((production) => {
    const id = asString(production.id);
    if (id) uniqueProjects.add(id);
  });

  return {
    projectsActive: uniqueProjects.size,
    locationsCount: store.locations.length,
    setsCount: store.setPieces.length,
    completedTasks: store.timeEntries.filter((entry) => entry.status === "completed").length,
    pluginsCount: getPluginCatalog().length,
    lastUpdated: store.updatedAt,
  };
}

async function handleHealth(): Promise<ArtDirectorHandlerResponse> {
  const store = await readStore();

  return success({
    status: "ok",
    storage: {
      available: true,
      updatedAt: store.updatedAt,
    },
    summary: computeDashboardSummary(store),
  });
}

async function handlePlugins(): Promise<ArtDirectorHandlerResponse> {
  const plugins = getPluginCatalog();

  return success({
    plugins,
    count: plugins.length,
  });
}

async function handleDashboardSummary(): Promise<ArtDirectorHandlerResponse> {
  const store = await readStore();
  return success({
    summary: computeDashboardSummary(store),
  });
}

async function handleProductivitySummary(): Promise<ArtDirectorHandlerResponse> {
  const store = await readStore();
  const hoursByDepartment = store.timeEntries.reduce<Record<string, number>>(
    (accumulator, entry) => {
      accumulator[entry.department] =
        (accumulator[entry.department] || 0) + entry.actualHours;
      return accumulator;
    },
    {}
  );

  const chartData = Object.entries(hoursByDepartment).map(([name, hours], index) => ({
    name,
    hours,
    color: ["#e94560", "#4ade80", "#fbbf24", "#60a5fa", "#a78bfa"][index % 5],
  }));

  const completed = store.timeEntries.filter(
    (entry) => entry.status === "completed"
  ).length;
  const delayed = store.delays.length;
  const inProgress = Math.max(store.timeEntries.length - completed, 0);
  const total = completed + delayed + inProgress;

  const pieData =
    total === 0
      ? []
      : [
          {
            name: "مكتمل",
            value: Math.round((completed / total) * 100),
            color: "#4ade80",
          },
          {
            name: "قيد التنفيذ",
            value: Math.round((inProgress / total) * 100),
            color: "#fbbf24",
          },
          {
            name: "متأخر",
            value: Math.round((delayed / total) * 100),
            color: "#ef4444",
          },
        ];

  return success({
    data: {
      chartData,
      pieData,
    },
  });
}

async function handleDocumentationState(): Promise<ArtDirectorHandlerResponse> {
  const store = await readStore();
  const lastBook = store.productionBooks.find((book) => book.id === store.lastBookId);
  const lastStyleGuide = store.styleGuides.find(
    (guide) => guide.id === store.lastStyleGuideId
  );

  return success({
    data: {
      productionBook: lastBook ? summarizeBook(lastBook) : null,
      styleGuide: lastStyleGuide ? summarizeStyleGuide(lastStyleGuide) : null,
      decisionsCount: store.decisions.length,
    },
  });
}

async function handleVisualConsistency(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const sceneId = asString(payload.sceneId) || randomUUID();
  const lightingCondition = asString(payload.lightingCondition) || "daylight";
  const colors = parseList(payload.referenceColors);
  const palette = colors.length > 0 ? colors : ["#2E3A59", "#C58A4B", "#E6D7C3"];
  const colorTemperatureMap: Record<string, number> = {
    daylight: 5600,
    sunset: 3400,
    night: 4200,
    artificial: 3200,
  };

  const result = await runPlugin(VisualConsistencyAnalyzer, {
    type: "analyze",
    data: {
      scenes: [
        {
          id: `${sceneId}-reference`,
          name: "Reference Scene",
          colorPalette: {
            primary: palette.slice(0, 2),
            secondary: palette.slice(2),
          },
          lighting: {
            type: lightingCondition,
            colorTemperature: colorTemperatureMap[lightingCondition] ?? 5600,
            intensity: 95,
          },
        },
        {
          id: sceneId,
          name: "Candidate Scene",
          colorPalette: {
            primary: palette.slice().reverse().slice(0, 2),
            secondary: palette.slice(1),
          },
          lighting: {
            type: lightingCondition,
            colorTemperature: (colorTemperatureMap[lightingCondition] ?? 5600) + 600,
            intensity: 80,
          },
        },
      ],
      referenceScene: `${sceneId}-reference`,
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر تحليل الاتساق البصري");
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleTerminologyTranslation(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const term = asString(payload.term);
  const sourceLang = asString(payload.sourceLang) || "en";
  const targetLang = asString(payload.targetLang) || "ar";

  if (!term) {
    return failure("المصطلح مطلوب");
  }

  const result = await runPlugin(TerminologyTranslator, {
    type: "translate",
    data: {
      text: term,
      from: sourceLang,
      to: targetLang,
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر ترجمة المصطلح");
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleBudgetOptimization(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const totalBudget = Math.max(asNumber(payload.totalBudget), 1);
  const categories = parseList(payload.categories);
  const priority = asString(payload.priority) || "balanced";
  const categoryWeight =
    priority === "quality" ? 1.08 : priority === "cost" ? 0.92 : 1;
  const baseCategories =
    categories.length > 0 ? categories : ["الديكور", "الإضاءة", "الإكسسوارات"];
  const requestPerCategory = Math.round((totalBudget / baseCategories.length) * categoryWeight);

  const result = await runPlugin(BudgetOptimizer, {
    type: "optimize",
    data: {
      totalBudget,
      currency: "USD",
      categories: baseCategories.map((category, index) => ({
        name: slugify(category),
        nameAr: category,
        requested: requestPerCategory + index * 250,
        priority:
          priority === "quality"
            ? "high"
            : priority === "cost"
              ? "medium"
              : index === 0
                ? "critical"
                : "high",
        flexibility: priority === "cost" ? 0.5 : 0.2,
      })),
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر تحسين الميزانية");
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleLightingSimulation(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const timeOfDayMap: Record<string, string> = {
    dawn: "dawn",
    morning: "morning",
    noon: "midday",
    afternoon: "afternoon",
    sunset: "sunset",
    night: "night",
  };

  const location = asString(payload.location) || "interior";
  const timeOfDay = asString(payload.timeOfDay) || "morning";
  const mood = asString(payload.mood) || "dramatic";

  const result = await runPlugin(LightingSimulator, {
    type: "simulate",
    data: {
      scene: {
        location,
        timeOfDay: timeOfDayMap[timeOfDay] ?? "morning",
        mood,
      },
      style: mood.includes("رومان") ? "romantic" : "dramatic",
      budget: "medium",
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر محاكاة الإضاءة");
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleRiskAnalysis(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const budget = Math.max(asNumber(payload.budget), 1000);
  const timeline = Math.max(asNumber(payload.timeline), 1);
  const projectPhase = asString(payload.projectPhase) || "production";

  const result = await runPlugin(RiskAnalyzer, {
    type: "analyze",
    data: {
      project: {
        name: `Art Director ${projectPhase}`,
        budget,
        duration: timeline,
        locations: [
          {
            name: "Primary Set",
            type: projectPhase === "pre-production" ? "indoor" : "outdoor",
          },
        ],
        crew: {
          size: 12,
          departments: ["art", "props", "locations"],
        },
        specialRequirements: projectPhase === "production" ? ["night-shoot"] : [],
      },
      production: {
        hasStunts: false,
        hasSpecialEffects: projectPhase === "production",
        hasAnimals: false,
        hasChildren: false,
        hasWaterScenes: false,
        hasNightShoots: projectPhase === "production",
      },
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر تحليل المخاطر");
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleProductionReadinessPrompt(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const projectName = asString(payload.projectName) || "art-director";
  const department = asString(payload.department) || "art";
  const checklistType = asString(payload.checklistType) || "full";
  const store = await readStore();

  const result = await runPlugin(ProductionReadinessReportPromptBuilder, {
    type: "build-prompt",
    data: {
      owner: "the-copy",
      repo: projectName,
      analysisData: {
        languages: ["TypeScript", "CSS"],
        hasPackageJson: true,
        hasTests: true,
        hasCI: true,
        hasReadme: true,
        hasGitignore: true,
        fileStructure: [
          "app/(main)/art-director",
          "app/api/art-director/[...path]/route.ts",
          `stored-locations=${store.locations.length}`,
          `stored-set-pieces=${store.setPieces.length}`,
          `department=${department}`,
          `checklist=${checklistType}`,
        ],
      },
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر توليد موجه الجاهزية");
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleInspirationAnalyze(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const sceneDescription = asString(payload.sceneDescription);
  const mood = asString(payload.mood);
  const era = asString(payload.era);

  if (!sceneDescription) {
    return failure("وصف المشهد مطلوب");
  }

  const result = await runPlugin(CreativeInspirationAssistant, {
    type: "analyze",
    data: {
      description: sceneDescription,
      mood: mood || undefined,
      era: era || undefined,
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر تحليل الإلهام البصري");
  }

  const analysis = asRecord(result.data);
  const moodValue = asString(analysis.mood) || mood || "neutral";
  const palette = Array.isArray(analysis.colorPalette)
    ? analysis.colorPalette.map((item) => asString(item)).filter(Boolean)
    : [];
  const styleReferences = Array.isArray(analysis.styleReferences)
    ? analysis.styleReferences.map((item) => asString(item)).filter(Boolean)
    : [];

  return success({
    data: {
      theme: moodValue,
      themeAr: buildMoodThemeLabel(moodValue),
      keywords: [asString(analysis.era) || era || "contemporary", ...styleReferences].slice(0, 6),
      suggestedPalette: {
        name: `${moodValue}-palette`,
        nameAr: `باليت ${buildMoodThemeLabel(moodValue)}`,
        colors: palette,
      },
    },
  });
}

async function handleInspirationPalette(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const mood = asString(payload.mood) || "neutral";
  const era = asString(payload.era) || "contemporary";

  const result = await runPlugin(CreativeInspirationAssistant, {
    type: "suggest-palette",
    data: {
      mood,
      era,
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر توليد الباليت");
  }

  const data = asRecord(result.data);
  const palette = Array.isArray(data.palette)
    ? data.palette.map((item) => asString(item)).filter(Boolean)
    : [];

  const palettes = [
    {
      name: `${mood}-primary`,
      nameAr: `أساسي ${buildMoodThemeLabel(mood)}`,
      colors: palette,
    },
    {
      name: `${mood}-contrast`,
      nameAr: `تباين ${buildMoodThemeLabel(mood)}`,
      colors: palette.slice().reverse(),
    },
    {
      name: `${mood}-accent`,
      nameAr: `إبراز ${buildMoodThemeLabel(mood)}`,
      colors: palette.map((color, index) => (index % 2 === 0 ? color : "#F5F1E8")),
    },
  ];

  return success({
    data: {
      palettes,
    },
  });
}

async function handleLocationSearch(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const query = asString(payload.query).toLowerCase();
  const type = mapLocationType(asString(payload.type));
  const store = await readStore();

  const filtered = store.locations.filter((location) => {
    const matchesQuery =
      !query ||
      location.name.toLowerCase().includes(query) ||
      location.nameAr.toLowerCase().includes(query) ||
      location.address.toLowerCase().includes(query) ||
      location.features.some((feature) => feature.toLowerCase().includes(query));

    const matchesType = !type || !asString(payload.type) || location.type === type;
    return matchesQuery && matchesType;
  });

  return success({
    data: {
      locations: filtered,
      count: filtered.length,
    },
  });
}

async function handleLocationAdd(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const nameAr = asString(payload.nameAr);
  const name = asString(payload.name) || nameAr;

  if (!name) {
    return failure("اسم الموقع مطلوب");
  }

  const features = parseList(payload.features);
  const pluginResult = await runPlugin(LocationSetCoordinator, {
    type: "add-location",
    data: {
      name,
      nameAr: nameAr || name,
      type: mapLocationType(asString(payload.type) || "interior"),
      address: asString(payload.address),
      amenities: features,
      tags: features,
    },
  });

  if (!pluginResult.success) {
    return failure(pluginResult.error ?? "تعذر إضافة الموقع");
  }

  const rawLocation = extractNestedRecord(pluginResult, "location");
  if (!rawLocation) {
    return failure("تعذر قراءة بيانات الموقع المُضاف", 500);
  }

  const now = new Date().toISOString();
  const storedLocation: StoredLocation = {
    id: asString(rawLocation.id) || randomUUID(),
    name: asString(rawLocation.name) || name,
    nameAr: asString(rawLocation.nameAr) || nameAr || name,
    type: mapLocationType(asString(rawLocation.type) || asString(payload.type) || "interior"),
    address: asString(rawLocation.address) || asString(payload.address),
    features,
    createdAt: now,
    updatedAt: now,
  };

  await updateStore((store) => {
    store.locations = uniqueById<StoredLocation>(store.locations, storedLocation);
  });

  return success({
    data: {
      location: storedLocation,
      message: "تمت إضافة الموقع بنجاح",
    },
  });
}

async function handleSetReusabilityAnalyze(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const setName = asString(payload.setName);
  const category = mapSetCategory(asString(payload.category));
  const condition = asString(payload.condition) || "good";

  if (!setName) {
    return failure("اسم الديكور مطلوب");
  }

  const result = await runPlugin(SetReusabilityOptimizer, {
    type: "analyze",
    data: {
      name: setName,
      category,
      dimensions: { width: 2, height: 2, depth: 2 },
      materials: ["wood", "fabric"],
      style: "neutral",
      currentCondition: condition,
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر تحليل قابلية إعادة الاستخدام");
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleSetPieceAdd(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const nameAr = asString(payload.nameAr);
  const name = asString(payload.name) || nameAr;

  if (!name) {
    return failure("اسم القطعة مطلوب");
  }

  const dimensions = parseDimensions(payload.dimensions);
  const category = mapSetCategory(asString(payload.category));
  const estimatedValue = estimateSetValue(category, dimensions);

  const result = await runPlugin(SetReusabilityOptimizer, {
    type: "add-piece",
    data: {
      name,
      nameAr: nameAr || name,
      category,
      condition: asString(payload.condition) || "good",
      dimensions,
      estimatedValue,
      materials: ["wood"],
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر إضافة قطعة الديكور");
  }

  const rawPiece = extractNestedRecord(result, "piece");
  if (!rawPiece) {
    return failure("تعذر قراءة بيانات القطعة المُضافة", 500);
  }

  const storedPiece: StoredSetPiece = {
    id: asString(rawPiece.id) || randomUUID(),
    name: asString(rawPiece.name) || name,
    nameAr: asString(rawPiece.nameAr) || nameAr || name,
    category: asString(payload.category) || mapLocationTypeLabel(category),
    condition: asString(rawPiece.condition) || asString(payload.condition) || "good",
    reusabilityScore: asNumber(rawPiece.reusabilityScore, 50),
    estimatedValue,
    dimensions,
    createdAt: new Date().toISOString(),
  };

  await updateStore((store) => {
    store.setPieces = uniqueById<StoredSetPiece>(store.setPieces, storedPiece);
  });

  return success({
    data: {
      piece: storedPiece,
      message: "تمت إضافة القطعة بنجاح",
    },
  });
}

async function handleSetInventory(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const category = asString(payload.category);
  const store = await readStore();

  const pieces = category
    ? store.setPieces.filter((piece) => piece.category === category)
    : store.setPieces;

  return success({
    data: {
      pieces,
      count: pieces.length,
    },
  });
}

async function handleSustainabilityReport(): Promise<ArtDirectorHandlerResponse> {
  const store = await readStore();
  const totalPieces = store.setPieces.length;
  const reusablePieces = store.setPieces.filter(
    (piece) => piece.reusabilityScore >= 70
  ).length;
  const reusablePercentage =
    totalPieces === 0 ? 0 : Math.round((reusablePieces / totalPieces) * 100);
  const estimatedSavings = Math.round(
    store.setPieces.reduce(
      (sum, piece) => sum + piece.estimatedValue * (piece.reusabilityScore / 100),
      0
    )
  );

  return success({
    data: {
      totalPieces,
      reusablePercentage,
      estimatedSavings,
      environmentalImpact:
        totalPieces === 0
          ? "أضف قطع ديكور لبدء حساب الأثر البيئي."
          : `يمكن خفض الهدر عبر إعادة استخدام ${reusablePieces} من أصل ${totalPieces} قطعة خلال الدورة القادمة.`,
    },
  });
}

async function handleProductivityAnalyze(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const department = asString(payload.department);
  const period = asString(payload.period) || "weekly";
  const store = await readStore();
  const entries = department
    ? store.timeEntries.filter((entry) => entry.department === department)
    : store.timeEntries;
  const totalHours = entries.reduce((sum, entry) => sum + entry.actualHours, 0);
  const delayHours = store.delays.reduce((sum, delay) => sum + delay.hoursLost, 0);

  return success({
    data: {
      period,
      department: department || "all",
      totalHours,
      taskCount: entries.length,
      delayHours,
      completionRate:
        entries.length === 0
          ? 0
          : Math.round(
              (entries.filter((entry) => entry.status === "completed").length /
                entries.length) *
                100
            ),
    },
  });
}

async function handleProductivityLogTime(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const task = asString(payload.task);
  const hours = asNumber(payload.hours);
  const category = asString(payload.category) || "design";

  if (!task) {
    return failure("وصف المهمة مطلوب");
  }

  if (!Number.isFinite(hours) || hours <= 0) {
    return failure("عدد الساعات يجب أن يكون أكبر من صفر");
  }

  const taskId = slugify(`${task}-${Date.now()}`);
  const result = await runPlugin(PerformanceProductivityAnalyzer, {
    type: "log-time",
    data: {
      taskId,
      taskName: task,
      department: category,
      assignee: "Art Director",
      plannedHours: hours,
      actualHours: hours,
      status: "completed",
      notes: "",
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر تسجيل الوقت");
  }

  const rawEntry = extractNestedRecord(result, "entry");
  if (!rawEntry) {
    return failure("تعذر قراءة بيانات الوقت المسجل", 500);
  }

  const storedEntry: StoredTimeEntry = {
    id: asString(rawEntry.id) || randomUUID(),
    taskId,
    taskName: task,
    department: category,
    assignee: "Art Director",
    plannedHours: hours,
    actualHours: hours,
    status: "completed",
    notes: "",
    createdAt: new Date().toISOString(),
  };

  await updateStore((store) => {
    store.timeEntries = uniqueById<StoredTimeEntry>(store.timeEntries, storedEntry);
  });

  return success({
    data: {
      entry: storedEntry,
      message: "تم تسجيل الوقت بنجاح",
    },
  });
}

async function handleProductivityDelay(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const reason = asString(payload.reason);
  const hoursLost = asNumber(payload.hoursLost);
  const impact = asString(payload.impact) || "low";

  if (!reason) {
    return failure("سبب التأخير مطلوب");
  }

  if (!Number.isFinite(hoursLost) || hoursLost <= 0) {
    return failure("الساعات المفقودة يجب أن تكون أكبر من صفر");
  }

  const result = await runPlugin(PerformanceProductivityAnalyzer, {
    type: "report-delay",
    data: {
      taskId: slugify(`${reason}-${Date.now()}`),
      reason,
      reasonAr: reason,
      hoursLost,
      category:
        impact === "critical"
          ? "technical"
          : impact === "high"
            ? "logistics"
            : "other",
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر تسجيل التأخير");
  }

  const rawDelay = extractNestedRecord(result, "delay");
  if (!rawDelay) {
    return failure("تعذر قراءة بيانات التأخير", 500);
  }

  const storedDelay: StoredDelay = {
    id: asString(rawDelay.id) || randomUUID(),
    taskId: asString(rawDelay.taskId) || randomUUID(),
    reason,
    reasonAr: reason,
    hoursLost,
    category: asString(rawDelay.category) || "other",
    createdAt: new Date().toISOString(),
  };

  await updateStore((store) => {
    store.delays = uniqueById<StoredDelay>(store.delays, storedDelay);
  });

  return success({
    data: {
      delay: storedDelay,
      message: "تم تسجيل التأخير بنجاح",
    },
  });
}

async function handleProductivityRecommendations(): Promise<ArtDirectorHandlerResponse> {
  const store = await readStore();
  const recommendations: string[] = [];

  if (store.timeEntries.length === 0) {
    recommendations.push("ابدأ بتسجيل الوقت الفعلي للمهام حتى تظهر توصيات مبنية على بيانات حقيقية.");
  }

  const totalDelayHours = store.delays.reduce((sum, delay) => sum + delay.hoursLost, 0);
  if (totalDelayHours > 0) {
    recommendations.push(`يوجد ${totalDelayHours} ساعة مهدرة؛ راجع أسباب التأخير الأعلى تكرارًا هذا الأسبوع.`);
  }

  const byDepartment = store.timeEntries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.department] = (acc[entry.department] || 0) + entry.actualHours;
    return acc;
  }, {});

  const mostLoadedDepartment = Object.entries(byDepartment).sort((a, b) => b[1] - a[1])[0];
  if (mostLoadedDepartment) {
    recommendations.push(
      `القسم الأكثر ضغطًا حاليًا هو ${mostLoadedDepartment[0]}؛ فكّر في توزيع الحمل أو تفويض المهام المتكررة.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("الإيقاع الحالي جيد؛ استمر في تسجيل الوقت ومراجعة الانحرافات أسبوعيًا.");
  }

  return success({
    data: {
      recommendations,
    },
  });
}

async function handleDocumentationGenerate(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const projectNameAr = asString(payload.projectNameAr);
  const projectName = asString(payload.projectName) || projectNameAr;
  const director = asString(payload.director);
  const productionCompany = asString(payload.productionCompany);

  if (!projectName) {
    return failure("اسم المشروع مطلوب");
  }

  const productionId = buildProductionId(projectName);
  const result = await runPlugin(AutomaticDocumentationGenerator, {
    type: "generate-book",
    data: {
      productionId,
      title: projectName,
      titleAr: projectNameAr || projectName,
      includeSections: [
        "overview",
        "locations",
        "props",
        "schedule",
        "technical",
      ],
      projectData: {
        name: projectName,
        director,
        productionCompany,
        artDirector: "CineArchitect",
        status: "Ready for review",
      },
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر إنشاء كتاب الإنتاج");
  }

  const rawBook = extractNestedRecord(result, "book");
  if (!rawBook) {
    return failure("تعذر قراءة كتاب الإنتاج الناتج", 500);
  }

  const storedBook: StoredProductionBook = {
    id: asString(rawBook.id) || randomUUID(),
    title: asString(rawBook.title) || projectName,
    titleAr: asString(rawBook.titleAr) || projectNameAr || projectName,
    productionId,
    createdAt: asString(rawBook.createdAt) || new Date().toISOString(),
    updatedAt: asString(rawBook.updatedAt) || new Date().toISOString(),
    sections: Array.isArray(rawBook.sections)
      ? rawBook.sections.filter(isRecord).map((section) => ({
          id: asString(section.id) || randomUUID(),
          title: asString(section.title),
          titleAr: asString(section.titleAr) || asString(section.title),
          type: asString(section.type),
          content: asString(section.content),
          contentAr: asString(section.contentAr) || asString(section.content),
          images: Array.isArray(section.images)
            ? section.images.map((item) => asString(item)).filter(Boolean)
            : [],
          order: asNumber(section.order),
        }))
      : [],
    metadata: asRecord(rawBook.metadata),
  };

  await updateStore((store) => {
    store.productionBooks = uniqueById<StoredProductionBook>(
      store.productionBooks,
      storedBook
    );
    store.lastProductionId = productionId;
    store.lastBookId = storedBook.id;
  });

  return success({
    data: summarizeBook(storedBook),
  });
}

async function handleDocumentationStyleGuide(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const projectName = asString(payload.projectName) || "مشروع جديد";
  const productionId = buildProductionId(projectName);

  const result = await runPlugin(AutomaticDocumentationGenerator, {
    type: "generate-style-guide",
    data: {
      productionId,
      title: projectName,
      colorPalettes: [
        {
          name: "Hero Palette",
          nameAr: "لوحة الهوية",
          colors: [
            { hex: "#2E3A59", name: "Midnight Blue", usage: "primary" },
            { hex: "#C58A4B", name: "Burnished Copper", usage: "accent" },
            { hex: "#F2E9DD", name: "Paper White", usage: "background" },
          ],
          mood: "cinematic",
        },
      ],
      moodDescriptions: [
        {
          sceneName: "Default Workspace",
          mood: "focused",
          moodAr: "مركز",
          visualNotes: "Warm key art direction with structured contrast",
          visualNotesAr: "هوية دافئة مع تباين منضبط ووضوح بصري",
        },
      ],
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر إنشاء دليل الأسلوب");
  }

  const rawGuide = extractNestedRecord(result, "styleGuide");
  if (!rawGuide) {
    return failure("تعذر قراءة دليل الأسلوب الناتج", 500);
  }

  const storedGuide: StoredStyleGuide = {
    id: asString(rawGuide.id) || randomUUID(),
    productionId,
    title: asString(rawGuide.title) || projectName,
    titleAr: asString(rawGuide.titleAr) || projectName,
    colorPalettes: Array.isArray(rawGuide.colorPalettes)
      ? rawGuide.colorPalettes.filter(isRecord)
      : [],
    typography: asRecord(rawGuide.typography),
    visualReferences: Array.isArray(rawGuide.visualReferences)
      ? rawGuide.visualReferences.filter(isRecord)
      : [],
    moodDescriptions: Array.isArray(rawGuide.moodDescriptions)
      ? rawGuide.moodDescriptions.filter(isRecord)
      : [],
    createdAt: asString(rawGuide.createdAt) || new Date().toISOString(),
  };

  await updateStore((store) => {
    store.styleGuides = uniqueById<StoredStyleGuide>(store.styleGuides, storedGuide);
    store.lastProductionId = productionId;
    store.lastStyleGuideId = storedGuide.id;
  });

  return success({
    data: summarizeStyleGuide(storedGuide),
  });
}

async function handleDocumentationDecision(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const title = asString(payload.title);
  const description = asString(payload.description);

  if (!title || !description) {
    return failure("عنوان القرار ووصفه مطلوبان");
  }

  const productionId = buildProductionId(
    asString(payload.projectName) || DEFAULT_PRODUCTION_ID
  );
  const result = await runPlugin(AutomaticDocumentationGenerator, {
    type: "log-decision",
    data: {
      productionId,
      decision: title,
      decisionAr: title,
      rationale: asString(payload.rationale),
      rationaleAr: asString(payload.rationale),
      madeBy: "Art Director",
      category: asString(payload.category) || "creative",
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر توثيق القرار");
  }

  const rawDecision = extractNestedRecord(result, "decision");
  if (!rawDecision) {
    return failure("تعذر قراءة القرار الموثق", 500);
  }

  const storedDecision: StoredDecision = {
    id: asString(rawDecision.id) || randomUUID(),
    productionId,
    decision: title,
    decisionAr: title,
    rationale: asString(rawDecision.rationale) || asString(payload.rationale),
    rationaleAr: asString(rawDecision.rationaleAr) || asString(payload.rationale),
    madeBy: asString(rawDecision.madeBy) || "Art Director",
    madeAt: asString(rawDecision.madeAt) || new Date().toISOString(),
    category: asString(rawDecision.category) || "creative",
    status: asString(rawDecision.status) || "proposed",
    relatedDecisions: Array.isArray(rawDecision.relatedDecisions)
      ? rawDecision.relatedDecisions
          .map((item) => asString(item))
          .filter(Boolean)
      : [],
  };

  await updateStore((store) => {
    store.decisions = uniqueById<StoredDecision>(store.decisions, storedDecision);
    store.lastProductionId = productionId;
  });

  return success({
    data: {
      decision: storedDecision,
    },
  });
}

async function handleDocumentationExport(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const format = asString(payload.format) || "markdown";
  const normalizedFormat =
    format === "json" || format === "markdown" || format === "md"
      ? format
      : "markdown";
  const store = await readStore();
  const bookId = asString(payload.bookId) || store.lastBookId || "";
  const book = store.productionBooks.find((item) => item.id === bookId);

  if (!book) {
    return failure("لا يوجد كتاب إنتاج جاهز للتصدير");
  }

  const content =
    normalizedFormat === "json"
      ? JSON.stringify(book, null, 2)
      : [
          `# ${book.titleAr}`,
          "",
          `الاسم الإنجليزي: ${book.title}`,
          `تاريخ الإنشاء: ${book.createdAt}`,
          "",
          ...book.sections
            .sort((left, right) => left.order - right.order)
            .flatMap((section) => [
              `## ${section.titleAr}`,
              "",
              section.contentAr || section.content,
              "",
            ]),
        ].join("\n");

  return success({
    data: {
      content,
      filename: `${slugify(book.title || book.titleAr)}.${normalizedFormat === "json" ? "json" : "md"}`,
      mimeType:
        normalizedFormat === "json"
          ? "application/json;charset=utf-8"
          : "text/markdown;charset=utf-8",
      format: normalizedFormat,
    },
  });
}

async function handlePrevizCreateScene(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const name = asString(payload.name);
  const description = asString(payload.description);

  if (!name || !description) {
    return failure("اسم المشهد والوصف مطلوبان");
  }

  const result = await runPlugin(MRPrevizStudio, {
    type: "create-scene",
    data: {
      name,
      description,
      environment: asString(payload.environment) || "studio",
      dimensions: {
        width: Math.max(asNumber(payload.width), 1),
        height: Math.max(asNumber(payload.height), 1),
        depth: Math.max(asNumber(payload.depth), 1),
      },
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر إنشاء مشهد ما قبل التصوير");
  }

  const rawScene = extractNestedRecord(result, "scene");
  if (rawScene && typeof rawScene.id === "string") {
    const storedScene: RawEntity & { id: string } = {
      ...rawScene,
      id: rawScene.id,
    };

    await updateStore((store) => {
      store.previzScenes = uniqueById<RawEntity & { id: string }>(
        store.previzScenes.filter(
          (item): item is RawEntity & { id: string } =>
            isRecord(item) && typeof item.id === "string"
        ),
        storedScene
      );
    });
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleVirtualSetCreate(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const name = asString(payload.name);
  const description = asString(payload.description);

  if (!name || !description) {
    return failure("اسم الديكور والوصف مطلوبان");
  }

  const result = await runPlugin(VirtualSetEditor, {
    type: "create-set",
    data: {
      name,
      description,
      realTimeRendering: asBoolean(payload.realTimeRendering, true),
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر إنشاء الديكور الافتراضي");
  }

  const rawSet = extractNestedRecord(result, "set");
  if (rawSet && typeof rawSet.id === "string") {
    const storedSet: RawEntity & { id: string } = {
      ...rawSet,
      id: rawSet.id,
    };

    await updateStore((store) => {
      store.virtualSets = uniqueById<RawEntity & { id: string }>(
        store.virtualSets.filter(
          (item): item is RawEntity & { id: string } =>
            isRecord(item) && typeof item.id === "string"
        ),
        storedSet
      );
    });
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleTrainingScenarios(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const category = asString(payload.category);
  const difficulty = asString(payload.difficulty);

  const result = await runPlugin(CinemaSkillsTrainer, {
    type: "list-scenarios",
    data: {
      category: category && category !== "all" ? category : undefined,
      difficulty: difficulty && difficulty !== "all" ? difficulty : undefined,
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر جلب سيناريوهات التدريب");
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleConceptArtCreate(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const name = asString(payload.name);
  const description = asString(payload.description);
  const style = asString(payload.style) || "realistic";

  if (!name || !description) {
    return failure("اسم المشروع والوصف مطلوبان");
  }

  const result = await runPlugin(ImmersiveConceptArt, {
    type: "create-project",
    data: {
      name,
      description,
      style,
    },
  });

  if (!result.success) {
    return failure(result.error ?? "تعذر إنشاء مشروع الفن المفاهيمي");
  }

  const rawProject = extractNestedRecord(result, "project");
  if (rawProject && typeof rawProject.id === "string") {
    const storedProject: RawEntity & { id: string } = {
      ...rawProject,
      id: rawProject.id,
      targetPlatform: asString(payload.targetPlatform) || "desktop",
    };

    await updateStore((store) => {
      store.conceptProjects = uniqueById<RawEntity & { id: string }>(
        store.conceptProjects.filter(
          (item): item is RawEntity & { id: string } =>
            isRecord(item) && typeof item.id === "string"
        ),
        storedProject
      );
    });
  }

  return success({
    data: result.data ?? {},
  });
}

async function handleVirtualProductionCreate(
  payload: Record<string, unknown>
): Promise<ArtDirectorHandlerResponse> {
  const name = asString(payload.name);
  const description = asString(payload.description);

  if (!name || !description) {
    return failure("اسم الإنتاج والوصف مطلوبان");
  }

  const createResult = await runPlugin(VirtualProductionEngine, {
    type: "create-production",
    data: {
      name,
      description,
    },
  });

  if (!createResult.success) {
    return failure(createResult.error ?? "تعذر إنشاء الإنتاج الافتراضي");
  }

  const production = extractNestedRecord(createResult, "production");
  if (!production) {
    return failure("تعذر قراءة بيانات الإنتاج الافتراضي", 500);
  }

  const productionId = asString(production.id);
  const ledResult = await runPlugin(VirtualProductionEngine, {
    type: "setup-led-wall",
    data: {
      productionId,
      name: `${name} LED Wall`,
      dimensions: {
        width: Math.max(asNumber(payload.ledWallWidth), 1),
        height: Math.max(asNumber(payload.ledWallHeight), 1),
      },
      pixelPitch: 2.6,
    },
  });

  const cameraResult = await runPlugin(VirtualProductionEngine, {
    type: "configure-camera",
    data: {
      productionId,
      name: `${name} Camera`,
      type: "cinema",
      lens: {
        focalLength:
          asString(payload.cameraType).toLowerCase() === "broadcast" ? 24 : 35,
      },
      trackingSystem: "inside-out",
    },
  });

  const storedProduction: RawEntity & { id: string } = {
    ...production,
    id: productionId || randomUUID(),
    requestedSetup: {
      ledWallWidth: asNumber(payload.ledWallWidth),
      ledWallHeight: asNumber(payload.ledWallHeight),
      cameraType: asString(payload.cameraType),
    },
  };

  await updateStore((store) => {
    store.virtualProductions = uniqueById<RawEntity & { id: string }>(
      store.virtualProductions.filter(
        (item): item is RawEntity & { id: string } =>
          isRecord(item) && typeof item.id === "string"
      ),
      storedProduction
    );
  });

  return success({
    data: {
      production: createResult.data,
      ledWall: ledResult.success ? ledResult.data : undefined,
      camera: cameraResult.success ? cameraResult.data : undefined,
    },
  });
}

type RouteKey = `${"GET" | "POST"} ${string}`;

const ROUTES: Record<
  RouteKey,
  (payload: Record<string, unknown>) => Promise<ArtDirectorHandlerResponse>
> = {
  "GET health": async () => handleHealth(),
  "GET plugins": async () => handlePlugins(),
  "GET dashboard/summary": async () => handleDashboardSummary(),
  "GET productivity/summary": async () => handleProductivitySummary(),
  "GET documentation/state": async () => handleDocumentationState(),
  "GET training/scenarios": async (payload) => handleTrainingScenarios(payload),
  "POST analyze/visual-consistency": async (payload) =>
    handleVisualConsistency(payload),
  "POST translate/cinema-terms": async (payload) =>
    handleTerminologyTranslation(payload),
  "POST optimize/budget": async (payload) => handleBudgetOptimization(payload),
  "POST simulate/lighting": async (payload) => handleLightingSimulation(payload),
  "POST analyze/risks": async (payload) => handleRiskAnalysis(payload),
  "POST analyze/production-readiness": async (payload) =>
    handleProductionReadinessPrompt(payload),
  "POST inspiration/analyze": async (payload) => handleInspirationAnalyze(payload),
  "POST inspiration/palette": async (payload) => handleInspirationPalette(payload),
  "POST locations/search": async (payload) => handleLocationSearch(payload),
  "POST locations/add": async (payload) => handleLocationAdd(payload),
  "POST sets/reusability": async (payload) => handleSetReusabilityAnalyze(payload),
  "POST sets/add-piece": async (payload) => handleSetPieceAdd(payload),
  "POST sets/inventory": async (payload) => handleSetInventory(payload),
  "POST sets/sustainability-report": async () => handleSustainabilityReport(),
  "POST analyze/productivity": async (payload) =>
    handleProductivityAnalyze(payload),
  "POST productivity/log-time": async (payload) =>
    handleProductivityLogTime(payload),
  "POST productivity/report-delay": async (payload) =>
    handleProductivityDelay(payload),
  "POST productivity/recommendations": async () =>
    handleProductivityRecommendations(),
  "POST documentation/generate": async (payload) =>
    handleDocumentationGenerate(payload),
  "POST documentation/style-guide": async (payload) =>
    handleDocumentationStyleGuide(payload),
  "POST documentation/log-decision": async (payload) =>
    handleDocumentationDecision(payload),
  "POST documentation/export": async (payload) =>
    handleDocumentationExport(payload),
  "POST xr/previz/create-scene": async (payload) =>
    handlePrevizCreateScene(payload),
  "POST xr/set-editor/create": async (payload) => handleVirtualSetCreate(payload),
  "POST training/scenarios": async (payload) => handleTrainingScenarios(payload),
  "POST concept-art/create-project": async (payload) =>
    handleConceptArtCreate(payload),
  "POST virtual-production/create": async (payload) =>
    handleVirtualProductionCreate(payload),
};

export async function handleArtDirectorRequest(params: {
  method: "GET" | "POST";
  path: string[];
  body?: unknown;
  searchParams?: URLSearchParams;
}): Promise<ArtDirectorHandlerResponse> {
  const routePath = params.path.join("/");
  const routeKey = `${params.method} ${routePath}` as RouteKey;
  const handler = ROUTES[routeKey];

  if (!handler) {
    return failure(`المسار غير مدعوم: ${routePath}`, 404);
  }

  const payload = {
    ...Object.fromEntries(params.searchParams?.entries() ?? []),
    ...asRecord(params.body),
  };

  return handler(payload);
}

export async function listArtDirectorTools(): Promise<Record<string, unknown>> {
  const catalog = getPluginCatalog();
  return {
    plugins: catalog,
    tools: Object.entries(toolConfigs).map(([id, config]) => ({
      id,
      endpoint: config.endpoint,
      requestType: config.requestType,
    })),
  };
}
