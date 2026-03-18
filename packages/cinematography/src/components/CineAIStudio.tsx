/**
 * @fileoverview استوديو السينما الذكي (CineAI Vision)
 *
 * هذا المكون يمثل الواجهة الرئيسية لاستوديو التصوير السينمائي.
 * يوفر مجموعة متكاملة من الأدوات لمديري التصوير تشمل:
 * - أدوات ما قبل الإنتاج: توليد الرؤية البصرية والكادرات
 * - أدوات أثناء التصوير: تحليل اللقطات والإعدادات التقنية
 * - أدوات ما بعد الإنتاج: تدريج الألوان والتصدير
 *
 * السبب وراء هذا التصميم:
 * - توفير تجربة متكاملة لمدير التصوير
 * - فصل كل مرحلة إنتاجية في تبويب مستقل
 * - تحسين الأداء عبر التحميل الديناميكي للأدوات الثقيلة
 *
 * @module cinematography-studio/components/CineAIStudio
 */

"use client";

import React, { useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Clapperboard,
  Film,
  Wand2,
  Palette,
  Focus,
  Aperture,
  Sparkles,
  LayoutGrid,
  ArrowLeft,
  Play,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import PreProductionTools from "./tools/PreProductionTools";
import ProductionTools from "./tools/ProductionTools";
import PostProductionTools from "./tools/PostProductionTools";
import { useCinematographyStudio } from "../hooks";
import type { Phase, ToolStatus, VisualMood } from "../types";
import { isValidTabValue, TAB_VALUE_BY_PHASE } from "../types";

// ============================================
// مكونات التحميل الديناميكي
// ============================================

/**
 * مكون حالة التحميل للأدوات
 *
 * السبب وراء فصله كمكون مستقل:
 * - إعادة استخدامه في عدة أماكن
 * - تجنب تكرار الكود في كل dynamic import
 */
const ToolLoadingState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-96 bg-zinc-900 rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
      <p className="text-zinc-400">{message}</p>
    </div>
  </div>
);

/**
 * محاكي العدسات - محمل ديناميكياً
 *
 * السبب وراء التحميل الديناميكي:
 * - يحتوي على رسومات WebGL ثقيلة
 * - غير مطلوب في التحميل الأولي
 */
const LensSimulator = dynamic(
  () => import("@/components/ui/lens-simulator"),
  {
    loading: () => <ToolLoadingState message="جاري تحميل محاكي العدسات..." />,
    ssr: false,
  }
);

/**
 * معاينة التدرج اللوني - محمل ديناميكياً
 */
const ColorGradingPreview = dynamic(
  () => import("@/components/ui/color-grading-preview"),
  {
    loading: () => <ToolLoadingState message="جاري تحميل معاينة الألوان..." />,
    ssr: false,
  }
);

/**
 * حاسبة عمق الميدان - محمل ديناميكياً
 */
const DOFCalculator = dynamic(
  () => import("@/components/ui/dof-calculator"),
  {
    loading: () => (
      <ToolLoadingState message="جاري تحميل حاسبة عمق الميدان..." />
    ),
    ssr: false,
  }
);

// ============================================
// الأنواع والواجهات
// ============================================

/**
 * واجهة تعريف الأداة
 */
interface ToolDefinition {
  /** معرف فريد للأداة */
  id: string;
  /** الاسم بالعربية */
  name: string;
  /** الاسم بالإنجليزية */
  nameEn: string;
  /** أيقونة Lucide */
  icon: LucideIcon;
  /** وصف الأداة */
  description: string;
  /** تدرج لوني للخلفية */
  color: string;
  /** حالة التوفر */
  status: ToolStatus;
}

/**
 * واجهة الإحصائية
 */
interface StatItem {
  /** العنوان */
  label: string;
  /** القيمة */
  value: string;
  /** الأيقونة */
  icon: LucideIcon;
}

/**
 * واجهة بطاقة المرحلة
 */
interface PhaseCard {
  /** معرف المرحلة */
  phase: Phase;
  /** العنوان بالعربية */
  title: string;
  /** العنوان بالإنجليزية */
  titleEn: string;
  /** الأيقونة */
  icon: LucideIcon;
  /** الوصف */
  description: string;
}

// ============================================
// الثوابت
// ============================================

/**
 * قائمة الأدوات المتاحة في الاستوديو
 *
 * السبب وراء تعريفها كثابت:
 * - تجنب إعادة إنشاء المصفوفة في كل render
 * - سهولة الصيانة والإضافة
 */
const TOOLS: ToolDefinition[] = [
  {
    id: "lens-simulator",
    name: "محاكي العدسات",
    nameEn: "Lens Simulator",
    icon: Aperture,
    description: "محاكاة عدسات سينمائية شهيرة",
    color: "from-amber-500 to-orange-600",
    status: "available",
  },
  {
    id: "color-grading",
    name: "التدرج اللوني",
    nameEn: "Color Grading",
    icon: Palette,
    description: "معاينة LUTs وتأثيرات الألوان",
    color: "from-purple-500 to-pink-600",
    status: "available",
  },
  {
    id: "dof-calculator",
    name: "حاسبة عمق الميدان",
    nameEn: "DOF Calculator",
    icon: Focus,
    description: "حساب عمق الميدان للقطاتك",
    color: "from-blue-500 to-cyan-600",
    status: "available",
  },
  {
    id: "shot-analyzer",
    name: "محلل اللقطات",
    nameEn: "Shot Analyzer",
    icon: Camera,
    description: "تحليل اللقطات بالذكاء الاصطناعي",
    color: "from-green-500 to-emerald-600",
    status: "coming-soon",
  },
];

/**
 * إحصائيات الشريط العلوي
 */
const STATS: StatItem[] = [
  { label: "المشاريع", value: "5", icon: Film },
  { label: "اللقطات", value: "248", icon: Camera },
  { label: "الأدوات", value: "3", icon: Sparkles },
];

/**
 * بطاقات مراحل الإنتاج
 */
const PHASE_CARDS: PhaseCard[] = [
  {
    phase: "pre",
    title: "ما قبل الإنتاج",
    titleEn: "Pre-Production",
    icon: Clapperboard,
    description: "تخطيط الرؤية البصرية والكادرات",
  },
  {
    phase: "production",
    title: "أثناء التصوير",
    titleEn: "Production",
    icon: Camera,
    description: "تحليل اللقطات والإعدادات التقنية",
  },
  {
    phase: "post",
    title: "ما بعد الإنتاج",
    titleEn: "Post-Production",
    icon: Film,
    description: "تصحيح الألوان والمعالجة النهائية",
  },
];

// ============================================
// المكون الرئيسي
// ============================================

/**
 * مكون استوديو السينما الذكي
 *
 * هذا المكون يمثل الواجهة الرئيسية للاستوديو ويتضمن:
 * - شريط علوي مع الإحصائيات والإعدادات
 * - لوحة تحكم للأدوات (Dashboard View)
 * - عرض المراحل مع التبويبات (Phases View)
 * - عرض الأداة المختارة بشكل كامل
 *
 * السبب وراء استخدام useReducer (عبر الـ hook):
 * - الحالة معقدة ومترابطة
 * - تسهيل اختبار منطق تغيير الحالة
 * - تجنب race conditions في التحديثات المتعددة
 *
 * @returns مكون الاستوديو الكامل
 */
export const CineAIStudio: React.FC = () => {
  // استخدام الـ hook المخصص لإدارة الحالة
  const {
    currentPhase,
    visualMood,
    activeTool,
    activeView,
    currentTabValue,
    hasActiveTool,
    isDashboardView,
    setVisualMood,
    openTool,
    closeTool,
    setActiveView,
    navigateToPhase,
    handleTabChange,
  } = useCinematographyStudio();

  // ============================================
  // دوال مُحسنة للأداء (Memoized Callbacks)
  // ============================================

  /**
   * عرض مكون الأداة النشطة
   *
   * السبب وراء useMemo:
   * - تجنب إعادة حساب المكون في كل render
   * - المكونات الديناميكية ثقيلة على الأداء
   */
  const activeToolComponent = useMemo(() => {
    switch (activeTool) {
      case "lens-simulator":
        return <LensSimulator />;
      case "color-grading":
        return <ColorGradingPreview />;
      case "dof-calculator":
        return <DOFCalculator />;
      default:
        return null;
    }
  }, [activeTool]);

  /**
   * بيانات الأداة النشطة
   */
  const activeToolData = useMemo(() => {
    return TOOLS.find((t) => t.id === activeTool);
  }, [activeTool]);

  /**
   * معالج النقر على بطاقة الأداة
   */
  const handleToolClick = useCallback(
    (toolId: string, status: ToolStatus) => {
      if (status === "available") {
        openTool(toolId);
      }
    },
    [openTool]
  );

  /**
   * معالج النقر على بطاقة المرحلة
   */
  const handlePhaseCardClick = useCallback(
    (phase: Phase) => {
      navigateToPhase(phase);
    },
    [navigateToPhase]
  );

  // ============================================
  // عرض الأداة بشكل كامل
  // ============================================

  if (hasActiveTool && activeToolData) {
    const Icon = activeToolData.icon;

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        {/* إشعارات Toast */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#fff",
              border: "1px solid #27272a",
            },
          }}
        />

        {/* شريط الأداة العلوي */}
        <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeTool}
                className="text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
              <div className="h-6 w-px bg-zinc-700" />
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${activeToolData.color}`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-white">
                    {activeToolData.name}
                  </h1>
                  <p className="text-xs text-zinc-400">
                    {activeToolData.nameEn}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* محتوى الأداة */}
        <main className="container mx-auto px-6 py-8">
          {activeToolComponent}
        </main>
      </div>
    );
  }

  // ============================================
  // العرض الرئيسي (لوحة التحكم / المراحل)
  // ============================================

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/30">
      {/* إشعارات Toast */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #27272a",
          },
        }}
      />

      {/* الشريط العلوي */}
      <StudioHeader
        stats={STATS}
        activeView={activeView}
        visualMood={visualMood}
        onViewChange={setActiveView}
        onMoodChange={setVisualMood}
      />

      <main className="container mx-auto px-6 py-8">
        {isDashboardView ? (
          // عرض لوحة التحكم
          <DashboardView
            tools={TOOLS}
            phaseCards={PHASE_CARDS}
            onToolClick={handleToolClick}
            onPhaseClick={handlePhaseCardClick}
          />
        ) : (
          // عرض المراحل
          <PhasesView
            currentTabValue={currentTabValue}
            visualMood={visualMood}
            onTabChange={handleTabChange}
          />
        )}
      </main>
    </div>
  );
};

// ============================================
// مكونات فرعية
// ============================================

/**
 * خصائص الشريط العلوي
 */
interface StudioHeaderProps {
  stats: StatItem[];
  activeView: "dashboard" | "phases";
  visualMood: VisualMood;
  onViewChange: (view: "dashboard" | "phases") => void;
  onMoodChange: (mood: string) => void;
}

/**
 * مكون الشريط العلوي للاستوديو
 *
 * السبب وراء فصله كمكون مستقل:
 * - تحسين قابلية القراءة والصيانة
 * - تسهيل إعادة الاستخدام
 * - تحسين الأداء عبر React.memo
 */
const StudioHeader = React.memo<StudioHeaderProps>(function StudioHeader({
  stats,
  activeView,
  visualMood,
  onViewChange,
  onMoodChange,
}) {
  return (
    <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* الشعار والعنوان */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 p-2 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            <Camera className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
              CineAI <span className="text-amber-600">Vision</span>
            </h1>
            <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
              Director of Photography OS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* الإحصائيات السريعة */}
          <div className="hidden md:flex items-center gap-4 mr-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-bold text-amber-500">{stat.value}</p>
                <p className="text-xs text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* تبديل العرض */}
          <div className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg">
            <Button
              variant={activeView === "dashboard" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewChange("dashboard")}
              className="h-7"
            >
              <LayoutGrid className="h-4 w-4 ml-1" />
              الأدوات
            </Button>
            <Button
              variant={activeView === "phases" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewChange("phases")}
              className="h-7"
            >
              <Film className="h-4 w-4 ml-1" />
              المراحل
            </Button>
          </div>

          {/* اختيار المود البصري */}
          <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-white/5">
            <Wand2 className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-zinc-300">مود المشروع:</span>
            <Select value={visualMood} onValueChange={onMoodChange}>
              <SelectTrigger className="h-6 w-[140px] border-none bg-transparent text-xs focus:ring-0 p-0 text-amber-500 font-bold">
                <SelectValue placeholder="اختر المود" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                <SelectItem value="noir">Noir / كابوسي</SelectItem>
                <SelectItem value="realistic">Realistic / واقعي</SelectItem>
                <SelectItem value="surreal">Surreal / غرائبي</SelectItem>
                <SelectItem value="vintage">Vintage / كلاسيكي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  );
});

/**
 * خصائص عرض لوحة التحكم
 */
interface DashboardViewProps {
  tools: ToolDefinition[];
  phaseCards: PhaseCard[];
  onToolClick: (toolId: string, status: ToolStatus) => void;
  onPhaseClick: (phase: Phase) => void;
}

/**
 * مكون عرض لوحة التحكم
 *
 * يعرض شبكة الأدوات وبطاقات المراحل
 */
const DashboardView = React.memo<DashboardViewProps>(function DashboardView({
  tools,
  phaseCards,
  onToolClick,
  onPhaseClick,
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* شبكة الأدوات */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          أدوات التصوير السينمائي
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onClick={() => onToolClick(tool.id, tool.status)}
            />
          ))}
        </div>
      </section>

      {/* بطاقات المراحل */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Film className="h-5 w-5 text-amber-500" />
          مراحل الإنتاج
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phaseCards.map((card) => (
            <PhaseCardComponent
              key={card.phase}
              card={card}
              onClick={() => onPhaseClick(card.phase)}
            />
          ))}
        </div>
      </section>
    </div>
  );
});

/**
 * خصائص بطاقة الأداة
 */
interface ToolCardProps {
  tool: ToolDefinition;
  onClick: () => void;
}

/**
 * مكون بطاقة الأداة
 */
const ToolCard = React.memo<ToolCardProps>(function ToolCard({ tool, onClick }) {
  const Icon = tool.icon;
  const isAvailable = tool.status === "available";

  return (
    <Card
      className={`bg-zinc-900 border-zinc-800 overflow-hidden cursor-pointer group transition-all duration-300 ${
        isAvailable
          ? "hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10"
          : "opacity-60"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          {isAvailable ? (
            <Badge className="bg-green-500/20 text-green-400 border-0">
              <Play className="h-3 w-3 ml-1" />
              متاح
            </Badge>
          ) : (
            <Badge variant="outline" className="text-zinc-500 border-zinc-700">
              <Clock className="h-3 w-3 ml-1" />
              قريباً
            </Badge>
          )}
        </div>
        <h3 className="font-bold text-white mb-1">{tool.name}</h3>
        <p className="text-xs text-zinc-500 mb-2">{tool.nameEn}</p>
        <p className="text-sm text-zinc-400">{tool.description}</p>
      </CardContent>
    </Card>
  );
});

/**
 * خصائص بطاقة المرحلة
 */
interface PhaseCardComponentProps {
  card: PhaseCard;
  onClick: () => void;
}

/**
 * مكون بطاقة المرحلة
 */
const PhaseCardComponent = React.memo<PhaseCardComponentProps>(
  function PhaseCardComponent({ card, onClick }) {
    const Icon = card.icon;

    return (
      <Card
        className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-amber-500/50 transition-all"
        onClick={onClick}
      >
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-600/20">
            <Icon className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-white">{card.title}</h3>
            <p className="text-xs text-zinc-500">{card.titleEn}</p>
            <p className="text-sm text-zinc-400 mt-1">{card.description}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
);

/**
 * خصائص عرض المراحل
 */
interface PhasesViewProps {
  currentTabValue: string;
  visualMood: VisualMood;
  onTabChange: (value: string) => void;
}

/**
 * مكون عرض المراحل
 *
 * يعرض التبويبات الثلاثة لمراحل الإنتاج
 */
const PhasesView = React.memo<PhasesViewProps>(function PhasesView({
  currentTabValue,
  visualMood,
  onTabChange,
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Tabs value={currentTabValue} onValueChange={onTabChange} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="bg-zinc-900/80 border border-white/10 p-1 rounded-2xl h-auto">
            <TabsTrigger
              value="pre-production"
              className="px-8 py-3 rounded-xl text-zinc-400 data-[state=active]:bg-amber-600 data-[state=active]:text-black transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-1">
                <Clapperboard className="h-5 w-5" />
                <span className="font-bold">ما قبل الإنتاج</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="production"
              className="px-8 py-3 rounded-xl text-zinc-400 data-[state=active]:bg-amber-600 data-[state=active]:text-black transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-1">
                <Camera className="h-5 w-5" />
                <span className="font-bold">أثناء التصوير</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="post-production"
              className="px-8 py-3 rounded-xl text-zinc-400 data-[state=active]:bg-amber-600 data-[state=active]:text-black transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-1">
                <Film className="h-5 w-5" />
                <span className="font-bold">ما بعد الإنتاج</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="relative min-h-[600px]">
          <TabsContent
            value="pre-production"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <PreProductionTools mood={visualMood} />
          </TabsContent>

          <TabsContent
            value="production"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <ProductionTools mood={visualMood} />
          </TabsContent>

          <TabsContent
            value="post-production"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <PostProductionTools mood={visualMood} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
});

export default CineAIStudio;
