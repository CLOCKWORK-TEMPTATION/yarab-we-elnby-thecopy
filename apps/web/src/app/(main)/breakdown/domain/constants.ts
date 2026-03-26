import type { AgentKey, SceneBreakdown } from "./models";

export const GEMINI_MODELS = {
  segmentation: "gemini-3-pro-preview",
  chat: "gemini-3-pro-preview",
  scenario: "gemini-3-pro-preview",
  analysis: "gemini-3-pro-preview",
  cast: "gemini-3-pro-preview",
} as const;

export const REPORT_STORAGE_KEY = "stationAnalysisResults";
export const STATIC_REPORT_PATH = "/analysis_output/final-report.json";
export const DEFAULT_TOAST_DURATION = 5000;

export type TechnicalAgentKey = keyof Omit<SceneBreakdown, "cast">;

export interface AgentPresentationMeta {
  key: AgentKey;
  label: string;
  color: string;
  description: string;
  type: "breakdown" | "strategic";
}

export const TECHNICAL_AGENT_KEYS: TechnicalAgentKey[] = [
  "locations",
  "setDressing",
  "costumes",
  "makeup",
  "props",
  "sound",
  "equipment",
  "vehicles",
  "stunts",
  "extras",
  "spfx",
  "vfx",
  "animals",
  "graphics",
  "continuity",
];

export const AGENT_PRESENTATION: AgentPresentationMeta[] = [
  { key: "locations", label: "المواقع", description: "أماكن التصوير والديكورات", color: "bg-green-600", type: "breakdown" },
  { key: "setDressing", label: "فرش الديكور", description: "عناصر الخلفية والتجهيزات غير المحمولة", color: "bg-violet-600", type: "breakdown" },
  { key: "costumes", label: "الأزياء", description: "ملابس واكسسوارات", color: "bg-purple-600", type: "breakdown" },
  { key: "makeup", label: "المكياج", description: "مكياج وجروح وشعر", color: "bg-pink-500", type: "breakdown" },
  { key: "props", label: "الإكسسوارات", description: "أدوات محمولة", color: "bg-yellow-600", type: "breakdown" },
  { key: "sound", label: "الصوت", description: "بلاي باك، مؤثرات صوتية، ومتطلبات التسجيل", color: "bg-sky-600", type: "breakdown" },
  { key: "equipment", label: "المعدات الخاصة", description: "معدات تصوير أو تشغيل خاصة بالمشهد", color: "bg-slate-600", type: "breakdown" },
  { key: "vehicles", label: "المركبات", description: "سيارات وطائرات", color: "bg-red-500", type: "breakdown" },
  { key: "stunts", label: "المشاهد الخطرة", description: "أكشن، قتال، أسلحة", color: "bg-red-700", type: "breakdown" },
  { key: "extras", label: "الكومبارس", description: "حشود وخلفية بشرية", color: "bg-orange-500", type: "breakdown" },
  { key: "spfx", label: "مؤثرات خاصة (SPFX)", description: "مطر، نار، دخان حقيقي", color: "bg-orange-700", type: "breakdown" },
  { key: "vfx", label: "VFX & CGI", description: "مؤثرات بصرية وشاشات خضراء", color: "bg-indigo-500", type: "breakdown" },
  { key: "animals", label: "الحيوانات", description: "حيوانات حية", color: "bg-amber-800", type: "breakdown" },
  { key: "graphics", label: "الشاشات", description: "محتوى الشاشات", color: "bg-cyan-600", type: "breakdown" },
  { key: "continuity", label: "الراكور", description: "تفاصيل يجب تتبعها عبر المشاهد", color: "bg-rose-700", type: "breakdown" },
  { key: "creative", label: "Creative Impact Agent (CIA)", description: "مهندس السيناريو التكيفي: يقيم التأثير الفني والبدائل الإبداعية.", color: "bg-yellow-500", type: "strategic" },
  { key: "budget", label: "Budget & Finance Agent (BFA)", description: "المدير المالي: تقدير التكاليف الفورية وفرص التوفير.", color: "bg-emerald-600", type: "strategic" },
  { key: "risk", label: "Risk Assessment Agent (RAA)", description: "مقيم المخاطر: التنبؤ بالمشاكل اللوجستية والسلامة.", color: "bg-rose-600", type: "strategic" },
  { key: "schedule", label: "Scheduling Optimizer (SOA)", description: "محسن الجدولة: حساب الزمن وتضارب الموارد.", color: "bg-cyan-600", type: "strategic" },
  { key: "logistics", label: "Production Logistics (PLA)", description: "المنسق اللوجستي: المعدات، المواقع، والتصاريح.", color: "bg-slate-500", type: "strategic" },
];

export const MOCK_SCRIPT = `
مشهد داخلي. غرفة المعيشة - نهار

يجلس أحمد (30) متوترًا على الأريكة، يحدق في شاشة الهاتف المكسورة. الغرفة فوضوية.
صوت سيارة شرطة يقترب من الخارج.

أحمد
(بهمس)
لا يمكن أن يحدث هذا الآن.

يدخل خالد (35) مسرعًا، يرتدي معطفًا جلديًا ملطخًا بالطين، ويحمل حقيبة معدنية فضية.

خالد
هل جهزت السيارة؟ نحتاج للمغادرة فورًا.

أحمد
المحرك يسخن، لكننا نحتاج إلى مفك براغي لإصلاح الباب الخلفي.

خالد يرمي الحقيبة على الطاولة الزجاجية، مما يحدث صوت ارتطام قوي.

خالد
انس الباب. الكلبة "لاسي" تنبح في الخارج، الشرطة هنا.

مشهد خارجي. الشارع أمام المنزل - نهار

تتوقف سيارة الدورية. يخرج ضابطان. تمطر السماء بغزارة (مطر صناعي).
`;
