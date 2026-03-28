import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import {
  breakdownExports,
  breakdownJobs,
  breakdownReports,
  projects,
  sceneBreakdowns,
  sceneHeaderMetadata,
  scenes,
  shootingSchedules,
} from '@/db/schema';
import { geminiService } from '@/services/gemini.service';
import { logger } from '@/utils/logger';
import { parseScreenplay } from './parser';
import type {
  BreakdownChatResponse,
  BreakdownElement,
  BreakdownReport,
  BreakdownReportScene,
  BreakdownSceneAnalysis,
  CastMember,
  ExtrasGroup,
  ParsedScene,
  ParsedScreenplay,
  ScenarioAnalysis,
  SceneHeader,
  ShootingScheduleDay,
} from './types';
import {
  buildElementsByCategory,
  buildSceneStats,
  buildSummaryText,
  clampMetric,
  ELEMENT_COLORS,
  estimateShootingDays,
  formatSceneHeader,
  generateId,
  generateShootingSchedule,
} from './utils';

const impactMetricsSchema = z.object({
  budget: z.number().default(0),
  schedule: z.number().default(0),
  risk: z.number().default(0),
  creative: z.number().default(0),
});

const scenarioAnalysisSchema = z.object({
  scenarios: z
    .array(
      z.object({
        id: z.string().default('scenario'),
        name: z.string().default('خيار إنتاجي'),
        description: z.string().default(''),
        metrics: impactMetricsSchema,
        agentInsights: z.object({
          logistics: z.string().default(''),
          budget: z.string().default(''),
          schedule: z.string().default(''),
          creative: z.string().default(''),
          risk: z.string().default(''),
        }),
        recommended: z.boolean().default(false),
      })
    )
    .default([]),
});

const aiCastSchema = z.object({
  name: z.string().default('شخصية غير مسماة'),
  role: z.string().default('Bit Part'),
  age: z.string().default('Unknown'),
  gender: z.string().default('Unknown'),
  description: z.string().default(''),
  motivation: z.string().default(''),
});

const extrasGroupSchema = z.object({
  description: z.string().default(''),
  count: z.number().int().default(0),
});

const aiBreakdownSchema = z.object({
  summary: z.string().default(''),
  warnings: z.array(z.string()).default([]),
  cast: z.array(aiCastSchema).default([]),
  costumes: z.array(z.string()).default([]),
  makeup: z.array(z.string()).default([]),
  setDressing: z.array(z.string()).default([]),
  graphics: z.array(z.string()).default([]),
  sound: z.array(z.string()).default([]),
  soundRequirements: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  specialEquipment: z.array(z.string()).default([]),
  vehicles: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  extras: z.array(z.string()).default([]),
  extrasGroups: z.array(extrasGroupSchema).default([]),
  props: z.array(z.string()).default([]),
  handProps: z.array(z.string()).default([]),
  silentBits: z.array(z.string()).default([]),
  stunts: z.array(z.string()).default([]),
  animals: z.array(z.string()).default([]),
  spfx: z.array(z.string()).default([]),
  vfx: z.array(z.string()).default([]),
  continuity: z.array(z.string()).default([]),
  continuityNotes: z.array(z.string()).default([]),
  scenarios: scenarioAnalysisSchema.default({ scenarios: [] }),
});

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return JSON.parse(trimmed);
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return JSON.parse(fencedMatch[1]);
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  throw new Error('لم يتم العثور على كائن JSON صالح');
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildBreakdownElements(
  analysis: Omit<BreakdownSceneAnalysis, 'elements' | 'stats'>
): BreakdownElement[] {
  const elements: BreakdownElement[] = [];

  const pushItems = (
    items: string[],
    type: string,
    category: string,
    color: string,
    notes?: string
  ): void => {
    items.forEach((item) => {
      elements.push({
        id: generateId(type.toLowerCase()),
        type,
        category,
        description: item,
        color,
        ...(notes ? { notes } : {}),
      });
    });
  };

  analysis.cast.forEach((member) => {
    elements.push({
      id: generateId('cast'),
      type: 'CAST',
      category: 'الشخصيات',
      description: `${member.name} - ${member.role}`,
      color: ELEMENT_COLORS.CAST,
      notes: member.description || undefined,
    });
  });

  analysis.extrasGroups.forEach((group) => {
    elements.push({
      id: generateId('extras_group'),
      type: 'EXTRAS',
      category: 'المجاميع',
      description: `${group.count} - ${group.description}`,
      color: ELEMENT_COLORS.EXTRAS,
    });
  });

  pushItems(analysis.silentBits, 'CAST', 'الصامتون', ELEMENT_COLORS.CAST);
  pushItems(analysis.props, 'PROPS', 'الإكسسوارات', ELEMENT_COLORS.PROPS);
  pushItems(analysis.handProps, 'PROPS', 'الهاند بروبس', ELEMENT_COLORS.PROPS);
  pushItems(
    analysis.setDressing,
    'SET_DRESSING',
    'فرش الديكور',
    ELEMENT_COLORS.SET_DRESSING
  );
  pushItems(analysis.costumes, 'WARDROBE', 'الأزياء', ELEMENT_COLORS.WARDROBE);
  pushItems(analysis.makeup, 'MAKEUP', 'المكياج', ELEMENT_COLORS.MAKEUP);
  pushItems(analysis.sound, 'SOUND', 'الصوت', ELEMENT_COLORS.SOUND);
  pushItems(
    analysis.soundRequirements,
    'SOUND',
    'متطلبات الصوت',
    ELEMENT_COLORS.SOUND
  );
  pushItems(
    analysis.equipment,
    'EQUIPMENT',
    'المعدات الخاصة',
    ELEMENT_COLORS.EQUIPMENT
  );
  pushItems(
    analysis.specialEquipment,
    'EQUIPMENT',
    'تجهيزات خاصة',
    ELEMENT_COLORS.EQUIPMENT
  );
  pushItems(analysis.vehicles, 'VEHICLES', 'المركبات', ELEMENT_COLORS.VEHICLES);
  pushItems(analysis.animals, 'ANIMALS', 'الحيوانات', ELEMENT_COLORS.ANIMALS);
  pushItems(analysis.stunts, 'STUNTS', 'المشاهد الخطرة', ELEMENT_COLORS.STUNTS);
  pushItems(analysis.spfx, 'SFX', 'المؤثرات الخاصة', ELEMENT_COLORS.SFX);
  pushItems(analysis.vfx, 'VFX', 'المؤثرات البصرية', ELEMENT_COLORS.VFX);
  pushItems(analysis.graphics, 'GRAPHICS', 'الجرافيكس', ELEMENT_COLORS.GRAPHICS);
  pushItems(analysis.continuity, 'CONTINUITY', 'الراكور', ELEMENT_COLORS.CONTINUITY);
  pushItems(
    analysis.continuityNotes,
    'CONTINUITY',
    'ملاحظات الراكور',
    ELEMENT_COLORS.CONTINUITY
  );

  return elements;
}

function detectCharacters(content: string): CastMember[] {
  const lines = content.split(/\r?\n/);
  const names = uniqueStrings(
    lines
      .map((line) => line.trim())
      .filter((line) => /^.{1,40}\s*:\s*$/.test(line))
      .map((line) => line.replace(/\s*:\s*$/, ''))
  );

  return names.map((name, index) => ({
    name,
    role: index === 0 ? 'Lead' : index < 3 ? 'Supporting' : 'Bit Part',
    age: 'Unknown',
    gender: 'Unknown',
    description: '',
    motivation: '',
  }));
}

function keywordMatches(content: string, keywords: string[]): string[] {
  const normalized = content.toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
}

function inferExtrasGroups(extras: string[]): ExtrasGroup[] {
  return extras.map((description) => {
    const countMatch = description.match(/(\d+)/);
    return {
      description,
      count: countMatch ? Number(countMatch[1]) : 3,
    };
  });
}

function buildFallbackScenarios(scene: ParsedScene): ScenarioAnalysis {
  const location = scene.headerData.location;
  return {
    scenarios: [
      {
        id: generateId('scenario'),
        name: 'الخيار المحافظ',
        description: `تنفيذ المشهد في ${location} بأقل تعقيد إنتاجي ممكن مع تقليل المخاطر.`,
        metrics: {
          budget: 30,
          schedule: 35,
          risk: 20,
          creative: 55,
        },
        agentInsights: {
          logistics: 'اعتماد الموقع كما هو وتقليل النقل بين الوحدات.',
          budget: 'أقل تكلفة عبر تقليص الكومبارس والتجهيزات الخاصة.',
          schedule: 'يسهل ضغط زمن التنفيذ في يوم تصوير واحد.',
          creative: 'يحتفظ بالمعنى لكنه أقل طموحاً بصرياً.',
          risk: 'مخاطر السلامة والطقس أقل من الخيارات الأخرى.',
        },
        recommended: true,
      },
      {
        id: generateId('scenario'),
        name: 'الخيار المتوازن',
        description: `تنفيذ متوازن للمشهد يجمع بين الأثر الفني والانضباط اللوجستي في ${location}.`,
        metrics: {
          budget: 55,
          schedule: 50,
          risk: 40,
          creative: 75,
        },
        agentInsights: {
          logistics: 'يحتاج تجهيزاً متوسطاً وتنسيقاً واضحاً بين الأقسام.',
          budget: 'تكلفة متوسطة مقابل جودة بصرية أفضل.',
          schedule: 'مناسب إذا كانت العناصر الخاصة متاحة في نفس اليوم.',
          creative: 'يوفر مكاسب بصرية واضحة من دون تضخم كبير.',
          risk: 'مخاطر قابلة للإدارة بشرط مراجعة الراكور والسلامة.',
        },
        recommended: false,
      },
      {
        id: generateId('scenario'),
        name: 'الخيار الإبداعي العالي',
        description: `رفع قيمة المشهد بصرياً وإنتاجياً عبر استخدام كامل العناصر الخاصة في ${location}.`,
        metrics: {
          budget: 80,
          schedule: 75,
          risk: 65,
          creative: 95,
        },
        agentInsights: {
          logistics: 'يتطلب تنسيقاً متقدماً بين الأقسام ومراجعة مسبقة للموقع.',
          budget: 'الأعلى تكلفة بسبب العناصر الخاصة والكثافة التشغيلية.',
          schedule: 'قد يحتاج وقت تصوير إضافياً أو بروفة منفصلة.',
          creative: 'الأقوى من حيث الأثر البصري والإحساس الدرامي.',
          risk: 'يرتفع معه خطر التأخير وتعارض الموارد إذا لم تضبط الخطة جيداً.',
        },
        recommended: false,
      },
    ],
  };
}

function buildFallbackAnalysis(scene: ParsedScene): {
  analysis: BreakdownSceneAnalysis;
  scenarios: ScenarioAnalysis;
} {
  const content = scene.content;
  const header = scene.headerData;
  const cast = detectCharacters(content);
  const soundKeywords = uniqueStrings(
    keywordMatches(content, ['شرطة', 'siren', 'radio', 'هاتف', 'موسيقى', 'صوت', 'صرخة'])
  );
  const propKeywords = uniqueStrings(
    keywordMatches(content, ['هاتف', 'حقيبة', 'مفك', 'سلاح', 'سكين', 'مفتاح', 'كوب'])
  );
  const setDressing = uniqueStrings(
    keywordMatches(content, ['أريكة', 'طاولة', 'نافذة', 'كرسي', 'غرفة', 'مطبخ', 'سرير'])
  );
  const vehicles = uniqueStrings(
    keywordMatches(content, ['سيارة', 'دورية', 'motorcycle', 'truck', 'boat'])
  );
  const animals = uniqueStrings(
    keywordMatches(content, ['كلب', 'قطة', 'حصان', 'dog', 'cat'])
  );
  const stunts = uniqueStrings(
    keywordMatches(content, ['قتال', 'هرب', 'مطاردة', 'سقط', 'jump', 'fight'])
  );
  const spfx = uniqueStrings(
    keywordMatches(content, ['مطر صناعي', 'دخان', 'نار', 'rain rig', 'smoke'])
  );
  const graphics = uniqueStrings(
    keywordMatches(content, ['شاشة', 'هاتف', 'monitor', 'screen'])
  );
  const continuity = uniqueStrings(
    keywordMatches(content, ['مكسور', 'ملطخ', 'wet', 'bloody', 'dirty'])
  );
  const warnings = [
    header.timeOfDay === 'UNKNOWN' ? 'وقت اليوم غير محسوم في رأس المشهد.' : '',
    continuity.length > 0 ? 'هناك عناصر راكور تحتاج متابعة بين المشاهد.' : '',
  ].filter(Boolean);

  const baseAnalysis = {
    headerData: header,
    cast,
    costumes: [],
    makeup: [],
    setDressing,
    graphics,
    sound: soundKeywords,
    soundRequirements: soundKeywords,
    equipment: [],
    specialEquipment: [],
    vehicles,
    locations: [header.location],
    extras: [],
    extrasGroups: [] as ExtrasGroup[],
    props: propKeywords,
    handProps: propKeywords,
    silentBits: [],
    stunts,
    animals,
    spfx,
    vfx: [],
    continuity,
    continuityNotes: continuity,
    warnings,
    summary: `تحليل احتياطي للمشهد ${header.sceneNumber} في ${header.location}.`,
    source: 'fallback' as const,
  };

  const analysis: BreakdownSceneAnalysis = {
    ...baseAnalysis,
    elements: buildBreakdownElements(baseAnalysis),
    stats: buildSceneStats(baseAnalysis),
  };

  return {
    analysis,
    scenarios: buildFallbackScenarios(scene),
  };
}

function normalizeAiAnalysis(
  parsedScene: ParsedScene,
  aiData: z.infer<typeof aiBreakdownSchema>
): {
  analysis: BreakdownSceneAnalysis;
  scenarios: ScenarioAnalysis;
} {
  const baseAnalysis = {
    headerData: parsedScene.headerData,
    cast: aiData.cast.map((member) => ({
      ...member,
      role: member.role || 'Bit Part',
      age: member.age || 'Unknown',
      gender: member.gender || 'Unknown',
      description: member.description || '',
      motivation: member.motivation || '',
    })),
    costumes: uniqueStrings(aiData.costumes),
    makeup: uniqueStrings(aiData.makeup),
    setDressing: uniqueStrings(aiData.setDressing),
    graphics: uniqueStrings(aiData.graphics),
    sound: uniqueStrings(aiData.sound),
    soundRequirements: uniqueStrings(aiData.soundRequirements),
    equipment: uniqueStrings(aiData.equipment),
    specialEquipment: uniqueStrings(aiData.specialEquipment),
    vehicles: uniqueStrings(aiData.vehicles),
    locations: uniqueStrings([parsedScene.headerData.location, ...aiData.locations]),
    extras: uniqueStrings(aiData.extras),
    extrasGroups:
      aiData.extrasGroups.length > 0
        ? aiData.extrasGroups.map((group) => ({
            description: group.description,
            count: Math.max(0, group.count),
          }))
        : inferExtrasGroups(aiData.extras),
    props: uniqueStrings(aiData.props),
    handProps: uniqueStrings(aiData.handProps),
    silentBits: uniqueStrings(aiData.silentBits),
    stunts: uniqueStrings(aiData.stunts),
    animals: uniqueStrings(aiData.animals),
    spfx: uniqueStrings(aiData.spfx),
    vfx: uniqueStrings(aiData.vfx),
    continuity: uniqueStrings(aiData.continuity),
    continuityNotes: uniqueStrings(aiData.continuityNotes),
    warnings: uniqueStrings(aiData.warnings),
    summary: aiData.summary || `تفكيك المشهد ${parsedScene.headerData.sceneNumber}`,
    source: 'ai' as const,
  };

  const analysis: BreakdownSceneAnalysis = {
    ...baseAnalysis,
    elements: buildBreakdownElements(baseAnalysis),
    stats: buildSceneStats(baseAnalysis),
  };

  const scenarios: ScenarioAnalysis = {
    scenarios: aiData.scenarios.scenarios.map((scenario) => ({
      ...scenario,
      metrics: {
        budget: clampMetric(scenario.metrics.budget),
        schedule: clampMetric(scenario.metrics.schedule),
        risk: clampMetric(scenario.metrics.risk),
        creative: clampMetric(scenario.metrics.creative),
      },
    })),
  };

  return { analysis, scenarios };
}

function buildAiPrompt(scene: ParsedScene): string {
  return `
أنت مشرف تفكيك إنتاج سينمائي محترف.
حلل المشهد التالي وأعد كائن JSON فقط من دون أي نص إضافي.

أعد الحقول التالية:
- summary
- warnings
- cast: مصفوفة من كائنات تحتوي على name و role و age و gender و description و motivation
- costumes
- makeup
- setDressing
- graphics
- sound
- soundRequirements
- equipment
- specialEquipment
- vehicles
- locations
- extras
- extrasGroups: مصفوفة من كائنات فيها description و count
- props
- handProps
- silentBits
- stunts
- animals
- spfx
- vfx
- continuity
- continuityNotes
- scenarios: ثلاثة بدائل إنتاجية تحتوي على metrics و agentInsights

القواعد:
- لا تكرر العنصر نفسه بصيغ مختلفة.
- ضع العناصر بالعربية إذا كان النص عربياً.
- إذا لم يوجد شيء في فئة ما أعد مصفوفة فارغة.
- التزم بحدود المشهد فقط.

بيانات رأس المشهد:
${formatSceneHeader(scene.headerData)}

محتوى المشهد:
${scene.content}
`;
}

export class BreakdownService {
  async createProjectAndParse(
    scriptContent: string,
    title: string | undefined,
    userId: string
  ): Promise<{
    projectId: string;
    title: string;
    parsed: ParsedScreenplay;
  }> {
    if (!userId) {
      throw new Error('معرف المستخدم مطلوب');
    }

    const projectTitle = title?.trim() || 'مشروع بريك دون';

    const [project] = await db
      .insert(projects)
      .values({
        title: projectTitle,
        scriptContent,
        userId,
      })
      .returning();

    const parsed = await this.parseProject(
      project.id,
      userId,
      scriptContent,
      projectTitle
    );

    return {
      projectId: project.id,
      title: project.title,
      parsed,
    };
  }

  async parseProject(
    projectId: string,
    userId: string,
    scriptContent?: string,
    projectTitle?: string
  ): Promise<ParsedScreenplay> {
    const project = await this.getOwnedProject(projectId, userId);

    if (!project) {
      throw new Error('المشروع غير موجود');
    }

    const nextScript = scriptContent ?? project.scriptContent ?? '';
    if (!nextScript.trim()) {
      throw new Error('لا يوجد نص سيناريو للتحليل');
    }

    if (scriptContent && scriptContent !== project.scriptContent) {
      await db
        .update(projects)
        .set({
          scriptContent,
          updatedAt: new Date(),
          ...(projectTitle ? { title: projectTitle } : {}),
        })
        .where(eq(projects.id, projectId));
    }

    const parsed = parseScreenplay(nextScript, projectTitle ?? project.title);
    await this.syncScenes(projectId, parsed.scenes);
    return parsed;
  }

  async analyzeProject(projectId: string, userId: string): Promise<BreakdownReport> {
    const project = await this.getOwnedProject(projectId, userId);

    if (!project) {
      throw new Error('المشروع غير موجود');
    }

    if (!project.scriptContent?.trim()) {
      throw new Error('لا يوجد نص سيناريو للتحليل');
    }

    const jobId = await this.createJob(projectId, null, 'project-analysis');

    try {
      const parsed = await this.parseProject(
        projectId,
        userId,
        project.scriptContent,
        project.title
      );
      const syncedScenes = await this.getScenesByProject(projectId);
      const analyzedScenes = await this.analyzeParsedScenes(parsed.scenes, syncedScenes);
      const report = await this.persistReport(projectId, project.title, analyzedScenes, jobId);
      await this.completeJob(jobId, 'completed');
      return report;
    } catch (error) {
      await this.completeJob(
        jobId,
        'failed',
        error instanceof Error ? error.message : 'unknown error'
      );
      throw error;
    }
  }

  async reanalyzeScene(sceneId: string, userId: string): Promise<BreakdownReportScene> {
    const ownedScene = await this.getOwnedScene(sceneId, userId);
    const sceneRecord = ownedScene?.scene;

    if (!sceneRecord) {
      throw new Error('المشهد غير موجود');
    }

    const project = ownedScene.project;

    if (!project) {
      throw new Error('المشروع المرتبط بالمشهد غير موجود');
    }

    const jobId = await this.createJob(project.id, sceneId, 'scene-reanalysis');

    try {
      const currentReport = await this.getProjectReport(project.id, userId);
      const parsed = parseScreenplay(project.scriptContent || '', project.title);
      const matchedParsedScene =
        parsed.scenes.find(
          (scene) => scene.headerData.sceneNumber === sceneRecord.sceneNumber
        ) ?? null;

      let parsedScene: ParsedScene | null = matchedParsedScene;

      if (!parsedScene && currentReport) {
        const reportScene = currentReport.scenes.find((scene) => scene.sceneId === sceneId);
        if (reportScene) {
          parsedScene = {
            header: reportScene.header,
            content: reportScene.content,
            headerData: reportScene.headerData,
            warnings: [],
          };
        }
      }

      if (!parsedScene) {
        throw new Error('تعذر إعادة بناء محتوى المشهد من المشروع');
      }

      const analyzed = await this.analyzeSceneRecord(parsedScene, sceneRecord.id);

      if (!currentReport) {
        const report = await this.analyzeProject(project.id, userId);
        await this.completeJob(jobId, 'completed');
        return report.scenes.find((scene) => scene.sceneId === sceneId) ?? report.scenes[0];
      }

      const nextScenes = currentReport.scenes.map((scene) =>
        scene.sceneId === sceneId ? analyzed : scene
      );
      const nextReport = await this.persistReport(project.id, project.title, nextScenes, jobId);
      await this.completeJob(jobId, 'completed');
      return nextReport.scenes.find((scene) => scene.sceneId === sceneId) ?? nextReport.scenes[0];
    } catch (error) {
      await this.completeJob(
        jobId,
        'failed',
        error instanceof Error ? error.message : 'unknown error'
      );
      throw error;
    }
  }

  async getProjectReport(projectId: string, userId: string): Promise<BreakdownReport | null> {
    const project = await this.getOwnedProject(projectId, userId);

    if (!project) {
      throw new Error('المشروع غير موجود');
    }

    const [report] = await db
      .select()
      .from(breakdownReports)
      .where(eq(breakdownReports.projectId, projectId))
      .orderBy(desc(breakdownReports.updatedAt))
      .limit(1);

    if (!report?.reportData) {
      return null;
    }

    return report.reportData as BreakdownReport;
  }

  async getProjectSchedule(projectId: string, userId: string): Promise<ShootingScheduleDay[]> {
    const report = await this.getProjectReport(projectId, userId);
    if (report) {
      return report.schedule;
    }

    const rows = await db
      .select()
      .from(shootingSchedules)
      .where(eq(shootingSchedules.projectId, projectId))
      .orderBy(shootingSchedules.dayNumber);

    return rows.map((row) => row.payload as ShootingScheduleDay);
  }

  async getSceneBreakdown(sceneId: string, userId: string): Promise<BreakdownReportScene | null> {
    const ownedScene = await this.getOwnedScene(sceneId, userId);

    if (!ownedScene) {
      throw new Error('المشهد غير موجود');
    }

    const [row] = await db
      .select()
      .from(sceneBreakdowns)
      .where(eq(sceneBreakdowns.sceneId, sceneId))
      .orderBy(desc(sceneBreakdowns.updatedAt))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      reportSceneId: row.id,
      sceneId: row.sceneId,
      header: row.header,
      content: row.content,
      headerData: row.headerData as SceneHeader,
      analysis: row.analysis as BreakdownSceneAnalysis,
      scenarios: row.scenarios as ScenarioAnalysis,
    };
  }

  async exportReport(
    reportId: string,
    userId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<{
    fileName: string;
    format: 'json' | 'csv';
    content: string;
  }> {
    const row = await this.getOwnedReport(reportId, userId);

    if (!row?.reportData) {
      throw new Error('تقرير البريك دون غير موجود');
    }

    const report = row.reportData as BreakdownReport;
    const fileName = `${report.title.replace(/[^\w\u0600-\u06FF]+/g, '_')}_${report.id}.${format}`;
    const content =
      format === 'json'
        ? JSON.stringify(report, null, 2)
        : this.reportToCsv(report);

    await db.insert(breakdownExports).values({
      reportId,
      format,
      payload: content,
      createdAt: new Date(),
    });

    return {
      fileName,
      format,
      content,
    };
  }

  async chat(
    message: string,
    context?: Record<string, unknown>
  ): Promise<BreakdownChatResponse> {
    const answer = await geminiService.chatWithAI(message, {
      feature: 'breakdown',
      ...context,
    });

    return { answer };
  }

  private async getOwnedProject(
    projectId: string,
    userId: string
  ): Promise<(typeof projects.$inferSelect) | null> {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    return project ?? null;
  }

  private async getOwnedScene(
    sceneId: string,
    userId: string
  ): Promise<{
    scene: typeof scenes.$inferSelect;
    project: typeof projects.$inferSelect;
  } | null> {
    const [result] = await db
      .select({
        scene: scenes,
        project: projects,
      })
      .from(scenes)
      .innerJoin(projects, eq(projects.id, scenes.projectId))
      .where(and(eq(scenes.id, sceneId), eq(projects.userId, userId)))
      .limit(1);

    if (!result) {
      return null;
    }

    return result;
  }

  private async getOwnedReport(
    reportId: string,
    userId: string
  ): Promise<(typeof breakdownReports.$inferSelect) | null> {
    const [result] = await db
      .select({
        report: breakdownReports,
      })
      .from(breakdownReports)
      .innerJoin(projects, eq(projects.id, breakdownReports.projectId))
      .where(and(eq(breakdownReports.id, reportId), eq(projects.userId, userId)))
      .limit(1);

    return result?.report ?? null;
  }

  private async analyzeParsedScenes(
    parsedScenes: ParsedScene[],
    sceneRows: typeof scenes.$inferSelect[]
  ): Promise<BreakdownReportScene[]> {
    const sceneMap = new Map(
      sceneRows.map((scene) => [scene.sceneNumber, scene])
    );

    const results: BreakdownReportScene[] = [];
    for (const parsedScene of parsedScenes) {
      const sceneRow = sceneMap.get(parsedScene.headerData.sceneNumber);
      if (!sceneRow) {
        continue;
      }

      results.push(await this.analyzeSceneRecord(parsedScene, sceneRow.id));
    }

    return results;
  }

  private async analyzeSceneRecord(
    parsedScene: ParsedScene,
    sceneId: string
  ): Promise<BreakdownReportScene> {
    try {
      const prompt = buildAiPrompt(parsedScene);
      const raw = await geminiService.generateContent(prompt);
      const parsedJson = extractJsonObject(raw);
      const aiData = aiBreakdownSchema.parse(parsedJson);
      const normalized = normalizeAiAnalysis(parsedScene, aiData);

      return {
        reportSceneId: generateId('report_scene'),
        sceneId,
        header: parsedScene.header,
        content: parsedScene.content,
        headerData: parsedScene.headerData,
        analysis: normalized.analysis,
        scenarios: normalized.scenarios,
      };
    } catch (error) {
      logger.warn('Breakdown AI fallback used', {
        sceneNumber: parsedScene.headerData.sceneNumber,
        error: error instanceof Error ? error.message : String(error),
      });

      const fallback = buildFallbackAnalysis(parsedScene);
      return {
        reportSceneId: generateId('report_scene'),
        sceneId,
        header: parsedScene.header,
        content: parsedScene.content,
        headerData: parsedScene.headerData,
        analysis: fallback.analysis,
        scenarios: fallback.scenarios,
      };
    }
  }

  private async syncScenes(
    projectId: string,
    parsedScenes: ParsedScene[]
  ): Promise<void> {
    const existingScenes = await this.getScenesByProject(projectId);
    const existingByNumber = new Map(
      existingScenes.map((scene) => [scene.sceneNumber, scene])
    );

    for (const parsedScene of parsedScenes) {
      const sceneNumber = parsedScene.headerData.sceneNumber;
      const existing = existingByNumber.get(sceneNumber);
      const values = {
        projectId,
        sceneNumber,
        title: parsedScene.header,
        location: parsedScene.headerData.location,
        timeOfDay: parsedScene.headerData.timeOfDay,
        characters: existing?.characters ?? [],
        description: parsedScene.content.slice(0, 4000),
        shotCount: existing?.shotCount ?? 0,
        status: existing?.status ?? 'planned',
      };

      if (existing) {
        await db
          .update(scenes)
          .set(values)
          .where(eq(scenes.id, existing.id));
      } else {
        await db.insert(scenes).values(values);
      }
    }
  }

  private async getScenesByProject(
    projectId: string
  ): Promise<(typeof scenes.$inferSelect)[]> {
    return db.select().from(scenes).where(eq(scenes.projectId, projectId));
  }

  private async persistReport(
    projectId: string,
    title: string,
    analyzedScenes: BreakdownReportScene[],
    jobId?: string
  ): Promise<BreakdownReport> {
    const existingReports = await db
      .select()
      .from(breakdownReports)
      .where(eq(breakdownReports.projectId, projectId));

    for (const existing of existingReports) {
      await db.delete(breakdownReports).where(eq(breakdownReports.id, existing.id));
    }

    const totalPages = analyzedScenes.reduce(
      (sum, scene) => sum + scene.headerData.pageCount,
      0
    );
    const schedule = generateShootingSchedule(analyzedScenes);
    const warnings = uniqueStrings(
      analyzedScenes.flatMap((scene) => scene.analysis.warnings)
    );

    const reportBase = {
      projectId,
      title,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'backend-breakdown' as const,
      summary: buildSummaryText(analyzedScenes),
      warnings,
      sceneCount: analyzedScenes.length,
      totalPages,
      totalEstimatedShootDays: estimateShootingDays(totalPages),
      elementsByCategory: buildElementsByCategory(analyzedScenes),
      schedule,
      scenes: analyzedScenes,
    };

    const [reportRow] = await db
      .insert(breakdownReports)
      .values({
        projectId,
        title,
        summary: reportBase.summary,
        warnings,
        totalScenes: reportBase.sceneCount,
        totalPages: Math.max(1, Math.round(reportBase.totalPages * 8)),
        totalEstimatedShootDays: reportBase.totalEstimatedShootDays,
        reportData: {} as Record<string, unknown>,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const report: BreakdownReport = {
      id: reportRow.id,
      ...reportBase,
    };

    await db
      .update(breakdownReports)
      .set({
        reportData: report,
        updatedAt: new Date(),
      })
      .where(eq(breakdownReports.id, reportRow.id));

    for (const scene of analyzedScenes) {
      const [sceneBreakdownRow] = await db
        .insert(sceneBreakdowns)
        .values({
          reportId: report.id,
          projectId,
          sceneId: scene.sceneId,
          sceneNumber: scene.headerData.sceneNumber,
          header: scene.header,
          content: scene.content,
          headerData: scene.headerData,
          analysis: scene.analysis,
          scenarios: scene.scenarios,
          source: scene.analysis.source,
          status: 'completed',
          warnings: scene.analysis.warnings,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await db.insert(sceneHeaderMetadata).values({
        reportId: report.id,
        sceneBreakdownId: sceneBreakdownRow.id,
        sceneId: scene.sceneId,
        rawHeader: scene.headerData.rawHeader,
        sceneType: scene.headerData.sceneType,
        location: scene.headerData.location,
        timeOfDay: scene.headerData.timeOfDay,
        pageCount: Math.max(1, Math.round(scene.headerData.pageCount * 8)),
        storyDay: scene.headerData.storyDay,
        createdAt: new Date(),
      });

      await db
        .update(scenes)
        .set({
          title: scene.header,
          location: scene.headerData.location,
          timeOfDay: scene.headerData.timeOfDay,
          characters: scene.analysis.cast.map((member) => member.name),
          description: scene.content.slice(0, 4000),
        })
        .where(eq(scenes.id, scene.sceneId));
    }

    for (const day of schedule) {
      await db.insert(shootingSchedules).values({
        reportId: report.id,
        projectId,
        dayNumber: day.dayNumber,
        location: day.location,
        timeOfDay: day.timeOfDay,
        sceneIds: day.scenes.map((scene) => scene.sceneId),
        estimatedHours: day.estimatedHours,
        totalPages: Math.max(1, Math.round(day.totalPages * 8)),
        payload: day,
        createdAt: new Date(),
      });
    }

    if (jobId) {
      await db
        .update(breakdownJobs)
        .set({
          status: 'completed',
          reportId: report.id,
          finishedAt: new Date(),
        })
        .where(eq(breakdownJobs.id, jobId));
    }

    return report;
  }

  private reportToCsv(report: BreakdownReport): string {
    const headers = [
      'sceneNumber',
      'sceneType',
      'location',
      'timeOfDay',
      'pageCount',
      'storyDay',
      'cast',
      'extras',
      'props',
      'setDressing',
      'sound',
      'equipment',
      'vehicles',
      'stunts',
      'animals',
      'spfx',
      'vfx',
      'continuity',
    ];

    const rows = report.scenes.map((scene) => [
      scene.headerData.sceneNumber,
      scene.headerData.sceneType,
      `"${scene.headerData.location.replace(/"/g, '""')}"`,
      scene.headerData.timeOfDay,
      scene.headerData.pageCount,
      scene.headerData.storyDay,
      scene.analysis.cast.length,
      scene.analysis.extras.length,
      scene.analysis.props.length,
      scene.analysis.setDressing.length,
      scene.analysis.sound.length,
      scene.analysis.equipment.length,
      scene.analysis.vehicles.length,
      scene.analysis.stunts.length,
      scene.analysis.animals.length,
      scene.analysis.spfx.length,
      scene.analysis.vfx.length,
      scene.analysis.continuity.length + scene.analysis.continuityNotes.length,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private async createJob(
    projectId: string,
    sceneId: string | null,
    jobType: string
  ): Promise<string> {
    const [job] = await db
      .insert(breakdownJobs)
      .values({
        projectId,
        sceneId,
        jobType,
        status: 'running',
        startedAt: new Date(),
      })
      .returning();

    return job.id;
  }

  private async completeJob(
    jobId: string,
    status: 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await db
      .update(breakdownJobs)
      .set({
        status,
        errorMessage: errorMessage ?? null,
        finishedAt: new Date(),
      })
      .where(eq(breakdownJobs.id, jobId));
  }
}

export const breakdownService = new BreakdownService();
