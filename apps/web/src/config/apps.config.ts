/**
 * السجل المركزي للتطبيقات المعروضة داخل المنصة.
 *
 * يجب أن يبقى هذا الملف هو المصدر المرجعي للمسارات المفعّلة ووصفها المختصر،
 * لأن مشغّل التطبيقات وصفحة الاستعراض العامة يعتمدان عليه مباشرة.
 */
export interface PlatformApp {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  path: string;
  color: string;
  category: "production" | "creative" | "analysis" | "management";
  enabled: boolean;
  badge?: string;
}

/**
 * قائمة التطبيقات التي تعرضها المنصة للمستخدم النهائي.
 *
 * أي إضافة أو إزالة هنا تؤثر مباشرة على:
 * - صفحة مشغّل التطبيقات
 * - صفحة الاستعراض العام
 * - وثائق السطح العام للمستودع
 */
export const platformApps: PlatformApp[] = [
  {
    id: "breakdown",
    name: "ScriptBreakdown AI",
    nameAr: "تحليل السيناريو بالذكاء الاصطناعي",
    description: "تحليل النصوص السينمائية بـ 12 وكيل متخصص (ملابس، مؤثرات، مشاهد خطرة...)",
    icon: "🎬",
    path: "/breakdown",
    color: "from-purple-600 to-pink-600",
    category: "production",
    enabled: true,
    badge: "AI Powered"
  },
  {
    id: "budget",
    name: "FilmBudget AI",
    nameAr: "ميزانية الإنتاج",
    description: "إدارة ميزانية الإنتاج السينمائي بذكاء اصطناعي",
    icon: "💰",
    path: "/BUDGET",
    color: "from-green-600 to-emerald-600",
    category: "management",
    enabled: true
  },
  {
    id: "editor",
    name: "Screenplay Editor",
    nameAr: "محرر السيناريو المتقدم",
    description: "محرر سيناريو احترافي مع دعم العربية والتنسيق الذكي",
    icon: "📝",
    path: "/editor",
    color: "from-blue-600 to-cyan-600",
    category: "creative",
    enabled: true
  },
  {
    id: "directors-studio",
    name: "Director's Studio",
    nameAr: "استوديو المخرج",
    description: "مساحة عمل متكاملة لإدارة المشاريع والمشاهد",
    icon: "🎥",
    path: "/directors-studio",
    color: "from-orange-600 to-red-600",
    category: "management",
    enabled: true
  },
  {
    id: "art-director",
    name: "CineArchitect AI",
    nameAr: "مدير الديكور والفن",
    description: "تصميم ديكورات سينمائية بمساعدة الذكاء الاصطناعي",
    icon: "🎨",
    path: "/art-director",
    color: "from-yellow-600 to-orange-500",
    category: "creative",
    enabled: true
  },
  {
    id: "cinefit",
    name: "CineFit Pro",
    nameAr: "استوديو تصميم الأزياء السينمائية",
    description: "تصميم وتجربة الأزياء ثلاثية الأبعاد مع تحليل السلامة",
    icon: "👔",
    path: "/styleIST",
    color: "from-indigo-600 to-purple-600",
    category: "production",
    enabled: true,
    badge: "3D"
  },
  {
    id: "actor-ai",
    name: "ActorAI Studio",
    nameAr: "استوديو الممثل بالذكاء الاصطناعي",
    description: "أدوات ذكية لتدريب وتطوير أداء الممثلين",
    icon: "🎭",
    path: "/actorai-arabic",
    color: "from-pink-600 to-rose-600",
    category: "creative",
    enabled: true
  },
  {
    id: "analysis",
    name: "Seven Stations Analysis",
    nameAr: "نظام المحطات السبع للتحليل",
    description: "تحليل درامي متقدم للسيناريوهات عبر 7 محطات متتابعة",
    icon: "🧠",
    path: "/analysis",
    color: "from-violet-600 to-purple-600",
    category: "analysis",
    enabled: true
  },
  {
    id: "creative-writing",
    name: "Creative Writing Studio",
    nameAr: "استوديو الكتابة الإبداعية",
    description: "منصة كتابة إبداعية عربية متقدمة",
    icon: "✍️",
    path: "/development",
    color: "from-teal-600 to-cyan-600",
    category: "creative",
    enabled: true
  },
  {
    id: "arabic-creative-writing-studio",
    name: "Arabic Creative Writing Studio",
    nameAr: "استوديو الكتابة العربية",
    description: "بيئة كتابة عربية متخصصة بالتجريب والتحرير وصناعة المسودات الإبداعية",
    icon: "✒️",
    path: "/arabic-creative-writing-studio",
    color: "from-fuchsia-600 to-rose-600",
    category: "creative",
    enabled: true,
    badge: "Arabic"
  },
  {
    id: "arabic-prompt-engineering-studio",
    name: "Arabic Prompt Engineering Studio",
    nameAr: "استوديو هندسة التوجيهات",
    description: "تحليل التوجيهات العربية ومقارنتها وبناء قوالب عملية قابلة لإعادة الاستخدام",
    icon: "🧪",
    path: "/arabic-prompt-engineering-studio",
    color: "from-sky-600 to-indigo-600",
    category: "analysis",
    enabled: true,
    badge: "Prompt Lab"
  },
  {
    id: "brainstorm",
    name: "Brain Storm AI",
    nameAr: "عصف ذهني بالذكاء الاصطناعي",
    description: "توليد أفكار إبداعية باستخدام الذكاء الاصطناعي",
    icon: "💡",
    path: "/brain-storm-ai",
    color: "from-amber-600 to-yellow-500",
    category: "creative",
    enabled: true
  },
  {
    id: "cinematography",
    name: "Cinematography Studio",
    nameAr: "استوديو التصوير السينمائي",
    description: "أدوات تخطيط وتحليل اللقطات السينمائية",
    icon: "📹",
    path: "/cinematography-studio",
    color: "from-slate-600 to-gray-600",
    category: "production",
    enabled: true
  },
  {
    id: "metrics-dashboard",
    name: "Metrics Dashboard",
    nameAr: "لوحة المقاييس",
    description: "مراقبة صحة النظام والأداء والموارد من واجهة تشغيل واحدة",
    icon: "📊",
    path: "/metrics-dashboard",
    color: "from-emerald-600 to-teal-600",
    category: "management",
    enabled: true,
    badge: "Ops"
  },
  {
    id: "breakapp",
    name: "BreakApp - Runner Management",
    nameAr: "إدارة المساعدين والطلبات",
    description: "نظام إدارة طلبات التصوير وتتبع المساعدين بالخرائط",
    icon: "🏃",
    path: "/BREAKAPP",
    color: "from-red-600 to-orange-600",
    category: "management",
    enabled: true,
    badge: "GPS Tracking"
  },
  {
    id: "brainstorm-ai",
    name: "Multi-Agent Brainstorm",
    nameAr: "العصف الذهني بالوكلاء",
    description: "نقاش حقيقي بين وكلاء ذكاء اصطناعي متعددين لتطوير الأفكار الإبداعية عبر 5 مراحل",
    icon: "🤖",
    path: "/brainstorm",
    color: "from-cyan-600 to-blue-600",
    category: "creative",
    enabled: true,
    badge: "Multi-Agent"
  }
];

/**
 * يعيد تعريف تطبيق واحد حسب المعرّف الداخلي.
 */
export function getAppById(id: string): PlatformApp | undefined {
  return platformApps.find(app => app.id === id);
}

/**
 * يعيد جميع التطبيقات المنتمية إلى فئة واحدة دون تصفية حالة التفعيل.
 */
export function getAppsByCategory(category: PlatformApp["category"]): PlatformApp[] {
  return platformApps.filter(app => app.category === category);
}

/**
 * يعيد التطبيقات المفعلة فقط داخل فئة محددة.
 */
export function getEnabledAppsByCategory(category: PlatformApp["category"]): PlatformApp[] {
  return platformApps.filter(app => app.category === category && app.enabled);
}

/**
 * يعيد جميع التطبيقات المفعلة التي يجب أن تظهر للمستخدم حاليًا.
 */
export function getEnabledApps(): PlatformApp[] {
  return platformApps.filter(app => app.enabled);
}
