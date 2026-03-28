import type { AgentKey, TechnicalBreakdownKey } from "./models";

export const GEMINI_MODELS = {
  segmentation: "backend-breakdown",
  chat: "backend-breakdown",
  scenario: "backend-breakdown",
  analysis: "backend-breakdown",
  cast: "backend-breakdown",
} as const;

export const BREAKDOWN_REPORT_STORAGE_KEY = "breakdownReportSnapshot";
export const BREAKDOWN_PROJECT_STORAGE_KEY = "breakdownProjectId";
export const BREAKDOWN_REPORT_ID_STORAGE_KEY = "breakdownReportId";
export const REPORT_STORAGE_KEY = BREAKDOWN_REPORT_STORAGE_KEY;
export const STATIC_REPORT_PATH = "/analysis_output/final-report.json";
export const DEFAULT_TOAST_DURATION = 5000;

export interface AgentPresentationMeta {
  key: AgentKey;
  label: string;
  color: string;
  description: string;
  type: "breakdown" | "strategic";
}

export const TECHNICAL_AGENT_KEYS: TechnicalBreakdownKey[] = [
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
  {
    key: "locations",
    label: "المواقع",
    description: "أماكن التصوير والبيئات الدرامية المعتمدة.",
    color: "bg-green-600",
    type: "breakdown",
  },
  {
    key: "setDressing",
    label: "فرش الديكور",
    description: "عناصر الخلفية والتجهيزات الثابتة داخل المشهد.",
    color: "bg-violet-600",
    type: "breakdown",
  },
  {
    key: "costumes",
    label: "الأزياء",
    description: "الملابس والملحقات المرتبطة بالشخصيات.",
    color: "bg-purple-600",
    type: "breakdown",
  },
  {
    key: "makeup",
    label: "المكياج والشعر",
    description: "متطلبات الشكل الخارجي والآثار الخاصة بالشخصيات.",
    color: "bg-pink-500",
    type: "breakdown",
  },
  {
    key: "props",
    label: "الإكسسوارات",
    description: "الأدوات المحمولة والعناصر التفاعلية داخل المشهد.",
    color: "bg-yellow-600",
    type: "breakdown",
  },
  {
    key: "sound",
    label: "الصوت",
    description: "الصوت المباشر ومتطلبات التشغيل والتسجيل.",
    color: "bg-sky-600",
    type: "breakdown",
  },
  {
    key: "equipment",
    label: "المعدات الخاصة",
    description: "المعدات الإضافية والتجهيزات التشغيلية الخاصة.",
    color: "bg-slate-600",
    type: "breakdown",
  },
  {
    key: "vehicles",
    label: "المركبات",
    description: "السيارات والمركبات والعناصر المتحركة الخاصة.",
    color: "bg-red-500",
    type: "breakdown",
  },
  {
    key: "stunts",
    label: "المشاهد الخطرة",
    description: "السلامة والأكشن والقتال والحركات الحساسة.",
    color: "bg-red-700",
    type: "breakdown",
  },
  {
    key: "extras",
    label: "المجاميع",
    description: "الكومبارس والمجاميع مع الكثافة البشرية المطلوبة.",
    color: "bg-orange-500",
    type: "breakdown",
  },
  {
    key: "spfx",
    label: "المؤثرات الخاصة",
    description: "المؤثرات العملية داخل موقع التصوير.",
    color: "bg-orange-700",
    type: "breakdown",
  },
  {
    key: "vfx",
    label: "المؤثرات البصرية",
    description: "المعالجة البصرية والشاشات والمؤثرات اللاحقة.",
    color: "bg-indigo-500",
    type: "breakdown",
  },
  {
    key: "animals",
    label: "الحيوانات",
    description: "الحيوانات والمتطلبات المرتبطة بسلامتها وإدارتها.",
    color: "bg-amber-800",
    type: "breakdown",
  },
  {
    key: "graphics",
    label: "الجرافيكس",
    description: "الشاشات والمحتوى الرسومي والعناصر المرئية.",
    color: "bg-cyan-600",
    type: "breakdown",
  },
  {
    key: "continuity",
    label: "الراكور",
    description: "العناصر التي تتطلب تتبعًا واستمرارية بين المشاهد.",
    color: "bg-rose-700",
    type: "breakdown",
  },
  {
    key: "creative",
    label: "الأثر الإبداعي",
    description: "تقدير المكاسب الفنية والبدائل الإخراجية.",
    color: "bg-yellow-500",
    type: "strategic",
  },
  {
    key: "budget",
    label: "الميزانية",
    description: "تقدير التكلفة الفورية وفرص الضغط المالي.",
    color: "bg-emerald-600",
    type: "strategic",
  },
  {
    key: "risk",
    label: "المخاطر",
    description: "التأخير والسلامة وتعارض الموارد.",
    color: "bg-rose-600",
    type: "strategic",
  },
  {
    key: "schedule",
    label: "الجدولة",
    description: "تعقيد التنفيذ والزمن المطلوب للتصوير.",
    color: "bg-cyan-600",
    type: "strategic",
  },
  {
    key: "logistics",
    label: "اللوجستيات",
    description: "تنسيق المواقع والحركة والاعتمادات التشغيلية.",
    color: "bg-slate-500",
    type: "strategic",
  },
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
