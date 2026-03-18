/**
 * @module brain-storm-content
 * @description المكون الرئيسي لمنصة العصف الذهني الذكي
 * 
 * يوفر هذا المكون واجهة متكاملة لنظام العصف الذهني متعدد الوكلاء
 * يتيح للمستخدمين إدخال أفكار إبداعية وتحليلها عبر مراحل متعددة
 * باستخدام وكلاء ذكاء اصطناعي متخصصين
 * 
 * ## المميزات الرئيسية:
 * - نظام نقاش متعدد الوكلاء (Constitutional AI)
 * - خمس مراحل للعصف الذهني (تحليل، توسع، تحقق، نقاش، تقييم)
 * - دعم رفع الملفات (PDF, DOCX, TXT)
 * - واجهة RTL بالعربية
 * 
 * ## الهيكل المعماري:
 * - يستخدم useMemo و useCallback للأداء الأمثل
 * - يفصل المنطق عن العرض باستخدام معالجات أحداث واضحة
 * - يتبع نمط Shadcn UI للمكونات
 */

"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  FileText,
  Users,
  Brain,
  Sparkles,
  Settings,
  BookOpen,
  Target,
  Trophy,
  MessageSquare,
  Zap,
  Shield,
  Cpu,
  Layers,
  Rocket,
  Globe,
  Film,
  BarChart,
  Lightbulb,
  Compass,
  Fingerprint,
  PenTool,
  Music,
  Search,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FileUpload from "@/components/file-upload";

import {
  getAllAgents,
  getAgentsForPhase,
  getAgentStats,
  getCollaborators,
  BRAINSTORM_PHASES,
  type BrainstormAgentDefinition,
  type BrainstormPhase,
  type AgentIcon,
  type AgentCategory,
} from "@/lib/drama-analyst/services/brainstormAgentRegistry";

import {
  type UncertaintyMetrics,
} from "@/lib/ai/constitutional";

// ============================================================================
// تعريف الأنواع
// ============================================================================

/**
 * @type AgentStatus
 * @description حالات الوكيل الممكنة أثناء جلسة العصف الذهني
 */
type AgentStatus = "idle" | "working" | "completed" | "error";

/**
 * @interface AgentState
 * @description حالة وكيل فردي أثناء جلسة العصف الذهني
 */
interface AgentState {
  /** المعرف الفريد للوكيل */
  id: string;
  /** الحالة الحالية للوكيل */
  status: AgentStatus;
  /** آخر رسالة صادرة من الوكيل */
  lastMessage?: string;
  /** نسبة تقدم العمل (0-100) */
  progress?: number;
}

/**
 * @interface Session
 * @description بيانات جلسة العصف الذهني
 */
interface Session {
  /** المعرف الفريد للجلسة */
  id: string;
  /** ملخص الفكرة الإبداعية */
  brief: string;
  /** المرحلة الحالية من العصف الذهني */
  phase: BrainstormPhase;
  /** حالة الجلسة */
  status: "active" | "completed" | "paused" | "error";
  /** وقت بدء الجلسة */
  startTime: Date;
  /** قائمة معرفات الوكلاء النشطين */
  activeAgents: string[];
  /** نتائج الجلسة */
  results?: Record<string, unknown>;
}

/**
 * @interface DebateMessage
 * @description رسالة في نقاش العصف الذهني بين الوكلاء
 */
interface DebateMessage {
  /** معرف الوكيل المرسل */
  agentId: string;
  /** اسم الوكيل بالعربية */
  agentName: string;
  /** نص الرسالة */
  message: string;
  /** وقت الإرسال */
  timestamp: Date;
  /** نوع الرسالة */
  type: "proposal" | "critique" | "agreement" | "decision";
  /** مقاييس عدم اليقين (اختياري) */
  uncertainty?: UncertaintyMetrics;
}

// ============================================================================
// الثوابت
// ============================================================================

/**
 * رسائل الأخطاء المعروضة للمستخدم حسب كود الحالة HTTP
 * نستخدم رسائل عربية واضحة لتحسين تجربة المستخدم
 */
const ERROR_MESSAGES: Record<number, string> = {
  401: "لم يتم العثور على API key - يرجى إضافتها في ملف .env.local",
  429: "تم تجاوز الحد المسموح من الطلبات - يرجى المحاولة لاحقاً",
  503: "فشل الاتصال بخادم AI - تحقق من الاتصال بالإنترنت",
  504: "تم تجاوز الحد الزمني - حاول بنص أقصر",
};

/**
 * ألوان حالات الوكلاء للعرض
 */
const STATUS_COLORS: Record<AgentStatus, string> = {
  working: "bg-blue-400 animate-pulse",
  completed: "bg-green-400",
  error: "bg-red-400",
  idle: "bg-gray-400",
};

/**
 * ألوان فئات الوكلاء للعرض
 */
const CATEGORY_COLORS: Record<AgentCategory, string> = {
  core: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  analysis: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  creative: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  predictive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

/**
 * أسماء فئات الوكلاء بالعربية
 */
const CATEGORY_NAMES: Record<AgentCategory, string> = {
  core: "أساسي",
  analysis: "تحليل",
  creative: "إبداع",
  predictive: "تنبؤ",
  advanced: "متقدم",
};

// ============================================================================
// مكونات فرعية
// ============================================================================

/**
 * @component AgentIconComponent
 * @description مكون عرض أيقونة الوكيل
 * يحول معرف الأيقونة النصي إلى مكون React المناسب
 * مُحسّن باستخدام memo لمنع إعادة الرسم غير الضرورية
 * 
 * @param icon - معرف الأيقونة من قائمة AgentIcon
 * @param className - فئات CSS إضافية للتنسيق
 * @returns عنصر React للأيقونة المطلوبة
 */
const AgentIconComponent = memo(function AgentIconComponent({ 
  icon, 
  className = "w-5 h-5" 
}: { 
  icon: AgentIcon; 
  className?: string;
}) {
  const iconMap: Record<AgentIcon, React.ReactNode> = {
    brain: <Brain className={className} />,
    users: <Users className={className} />,
    "message-square": <MessageSquare className={className} />,
    "book-open": <BookOpen className={className} />,
    target: <Target className={className} />,
    shield: <Shield className={className} />,
    zap: <Zap className={className} />,
    cpu: <Cpu className={className} />,
    layers: <Layers className={className} />,
    rocket: <Rocket className={className} />,
    "file-text": <FileText className={className} />,
    sparkles: <Sparkles className={className} />,
    trophy: <Trophy className={className} />,
    globe: <Globe className={className} />,
    film: <Film className={className} />,
    "chart-bar": <BarChart className={className} />,
    lightbulb: <Lightbulb className={className} />,
    compass: <Compass className={className} />,
    fingerprint: <Fingerprint className={className} />,
    "pen-tool": <PenTool className={className} />,
    music: <Music className={className} />,
    search: <Search className={className} />,
  };
  return iconMap[icon] || <Cpu className={className} />;
});

/**
 * @component AgentCard
 * @description بطاقة عرض معلومات الوكيل
 * تعرض حالة الوكيل وقدراته والمتعاونين معه
 * يمكن توسيعها لعرض المزيد من التفاصيل
 * 
 * @param agent - تعريف الوكيل من قاعدة البيانات
 * @param state - حالة الوكيل الحالية
 * @param isExpanded - هل البطاقة موسعة لعرض التفاصيل
 * @param onToggleExpand - معالج تبديل حالة التوسيع
 */
function AgentCard({
  agent,
  state,
  isExpanded,
  onToggleExpand,
}: {
  agent: BrainstormAgentDefinition;
  state: AgentState;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  /** الحصول على لون حالة الوكيل باستخدام الثوابت المعرفة مسبقاً */
  const statusColor = STATUS_COLORS[state.status];

  /** الحصول على لون فئة الوكيل */
  const categoryColor = CATEGORY_COLORS[agent.category];

  /** الحصول على قائمة المتعاونين مع الوكيل */
  const collaborators = useMemo(
    () => getCollaborators(agent.id),
    [agent.id]
  );

  return (
    <div className={`p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border ${state.status === "working" ? "border-blue-400" : "border-transparent"}`}>
      <div className="flex items-center gap-3">
        <div className="text-blue-500">
          <AgentIconComponent icon={agent.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{agent.nameAr}</p>
            <Badge variant="secondary" className={`text-xs ${categoryColor}`}>
              {CATEGORY_NAMES[agent.category]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
          {state.lastMessage && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{state.lastMessage}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onToggleExpand}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-muted space-y-2">
          <p className="text-xs text-muted-foreground">{agent.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {agent.capabilities.canAnalyze && <Badge variant="outline" className="text-xs">تحليل</Badge>}
            {agent.capabilities.canGenerate && <Badge variant="outline" className="text-xs">توليد</Badge>}
            {agent.capabilities.canPredict && <Badge variant="outline" className="text-xs">تنبؤ</Badge>}
            {agent.capabilities.hasMemory && <Badge variant="outline" className="text-xs">ذاكرة</Badge>}
            {agent.capabilities.supportsRAG && <Badge variant="outline" className="text-xs">RAG</Badge>}
          </div>
          {collaborators.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground">يتعاون مع:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {collaborators.slice(0, 3).map((c) => (
                  <Badge key={c.id} variant="secondary" className="text-xs">{c.nameAr}</Badge>
                ))}
                {collaborators.length > 3 && (
                  <Badge variant="secondary" className="text-xs">+{collaborators.length - 3}</Badge>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>التعقيد: {(agent.complexityScore * 100).toFixed(0)}%</span>
            <span>الاسم: {agent.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// المكون الرئيسي
// ============================================================================

/**
 * @component BrainStormContent
 * @description المكون الرئيسي لمنصة العصف الذهني الذكي
 * 
 * يجمع هذا المكون بين جميع المكونات الفرعية ويدير الحالة العامة
 * للتطبيق. يتعامل مع:
 * - إنشاء وإدارة جلسات العصف الذهني
 * - التواصل مع API النقاش
 * - عرض حالات الوكلاء ورسائل النقاش
 * - التنقل بين المراحل الخمس
 * 
 * @example
 * ```tsx
 * <BrainStormContent />
 * ```
 */
export default function BrainStormContent() {
  // ============================================================================
  // البيانات الثابتة المحسوبة مرة واحدة
  // ============================================================================

  /** قائمة جميع الوكلاء المتاحين */
  const realAgents = useMemo(() => getAllAgents(), []);
  
  /** إحصائيات الوكلاء (العدد، RAG، متوسط التعقيد) */
  const agentStats = useMemo(() => getAgentStats(), []);

  // ============================================================================
  // الحالة
  // ============================================================================

  /** الجلسة الحالية */
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  
  /** خريطة حالات الوكلاء */
  const [agentStates, setAgentStates] = useState<Map<string, AgentState>>(new Map());
  
  /** حالة التحميل */
  const [isLoading, setIsLoading] = useState(false);
  
  /** رسالة الخطأ الحالية */
  const [error, setError] = useState<string | null>(null);
  
  /** المرحلة النشطة */
  const [activePhase, setActivePhase] = useState<BrainstormPhase>(1);
  
  /** نص ملخص الفكرة */
  const [brief, setBrief] = useState("");
  
  /** مجموعة الوكلاء الموسعة (للعرض) */
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  
  /** رسائل النقاش */
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([]);
  
  /** هل نعرض جميع الوكلاء أم وكلاء المرحلة فقط */
  const [showAllAgents, setShowAllAgents] = useState(false);

  // ============================================================================
  // القيم المحسوبة
  // ============================================================================

  /** الوكلاء المتاحين للمرحلة النشطة */
  const phaseAgents = useMemo(() => getAgentsForPhase(activePhase), [activePhase]);
  
  /** الوكلاء المعروضون (حسب الاختيار) */
  const displayedAgents = showAllAgents ? realAgents : phaseAgents;

  // ============================================================================
  // التأثيرات الجانبية
  // ============================================================================

  /**
   * تهيئة حالات الوكلاء عند تحميل المكون
   * يُنشئ حالة ابتدائية (idle) لكل وكيل
   */
  useEffect(() => {
    const initialStates = new Map<string, AgentState>();
    realAgents.forEach((agent) => {
      initialStates.set(agent.id, { id: agent.id, status: "idle" });
    });
    setAgentStates(initialStates);
  }, [realAgents]);

  // ============================================================================
  // معالجات الأحداث
  // ============================================================================

  /**
   * تبديل حالة توسيع بطاقة الوكيل
   * @param agentId - معرف الوكيل المراد تبديل حالته
   */
  const toggleAgentExpand = useCallback((agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  }, []);

  /**
   * تحديث حالة وكيل محدد
   * @param agentId - معرف الوكيل
   * @param updates - التحديثات المطلوبة على الحالة
   */
  const updateAgentState = useCallback((agentId: string, updates: Partial<AgentState>) => {
    setAgentStates((prev) => {
      const next = new Map(prev);
      const current = next.get(agentId);
      if (current) {
        next.set(agentId, { ...current, ...updates });
      }
      return next;
    });
  }, []);

  /**
   * بدء جلسة عصف ذهني جديدة
   * يتحقق من وجود ملخص الفكرة ثم ينشئ جلسة جديدة
   * ويبدأ النقاش مع وكلاء المرحلة الأولى
   */
  const handleStartSession = async () => {
    if (!brief.trim()) {
      setError("⚠️ يرجى إدخال ملخص الفكرة الإبداعية أو رفع ملف (PDF, DOCX, TXT)");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebateMessages([]);

    try {
      const newSession: Session = {
        id: `session-${Date.now()}`,
        brief,
        phase: 1,
        status: "active",
        startTime: new Date(),
        activeAgents: phaseAgents.map((a) => a.id),
      };

      setCurrentSession(newSession);
      setActivePhase(1);
      setBrief("");

      const phase1Agents = getAgentsForPhase(1);
      phase1Agents.forEach((agent) => {
        updateAgentState(agent.id, { status: "working" });
      });

      await executeAgentDebate(phase1Agents, newSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "فشل في إنشاء الجلسة";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * تنفيذ نقاش بين الوكلاء عبر API الخادم
   * يرسل طلب للخادم ويعالج الاستجابة بتحديث حالات الوكلاء وإضافة الرسائل
   * 
   * @param agents - قائمة الوكلاء المشاركين في النقاش
   * @param session - الجلسة الحالية
   * @param task - المهمة المطلوب تنفيذها (اختياري - يستخدم ملخص الجلسة افتراضياً)
   */
  const executeAgentDebate = async (
    agents: readonly BrainstormAgentDefinition[],
    session: Session,
    task?: string
  ) => {
    const agentIds = agents.map((a) => a.id);
    const debateTask = task || `تحليل الفكرة: ${session.brief}`;

    // تحديث حالة الوكلاء إلى "يعمل"
    agents.forEach((agent) => {
      updateAgentState(agent.id, {
        status: "working",
        lastMessage: "جاري المشاركة في النقاش...",
      });
    });

    try {
      const response = await fetch("/api/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: debateTask,
          context: { brief: session.brief, phase: session.phase, sessionId: session.id },
          agentIds,
        }),
      });

      if (!response.ok) {
        // استخدام رسائل الأخطاء المعرفة مسبقاً
        const errorMessage = ERROR_MESSAGES[response.status] ?? `خطأ في الخادم: ${response.status}`;
        throw new Error(errorMessage);
      }

      const { result: debateResult } = await response.json();

      // معالجة اقتراحات الوكلاء
      for (const proposal of debateResult.proposals) {
        const agent = agents.find((a) => a.id === proposal.agentId);
        if (agent) {
          updateAgentState(proposal.agentId, {
            status: "completed",
            lastMessage: `ثقة: ${(proposal.confidence * 100).toFixed(0)}%`,
          });

          setDebateMessages((prev) => [
            ...prev,
            {
              agentId: proposal.agentId,
              agentName: agent.nameAr,
              message: proposal.proposal,
              timestamp: new Date(),
              type: "proposal",
            },
          ]);
        }
      }

      // إضافة القرار النهائي إن وجد
      if (debateResult.finalDecision) {
        setDebateMessages((prev) => [
          ...prev,
          {
            agentId: "judge",
            agentName: "الحكم",
            message: `${debateResult.finalDecision}\n\n${debateResult.judgeReasoning}`,
            timestamp: new Date(),
            type: "decision",
          },
        ]);
      }
    } catch (err) {
      // تحديث رسالة الخطأ الرئيسية وحالات الوكلاء
      const errorMessage = err instanceof Error ? err.message : "فشل في تنفيذ النقاش";
      setError(errorMessage);
      agents.forEach((agent) => {
        updateAgentState(agent.id, { status: "error", lastMessage: "فشل" });
      });
    }
  };

  /**
   * إيقاف الجلسة الحالية وإعادة تعيين الحالة
   * يُعيد جميع الوكلاء لحالة الخمول ويمسح رسائل النقاش
   */
  const handleStopSession = () => {
    setCurrentSession(null);
    setActivePhase(1);
    setDebateMessages([]);
    realAgents.forEach((agent) => {
      updateAgentState(agent.id, { status: "idle" });
    });
  };

  /**
   * الانتقال إلى المرحلة التالية من العصف الذهني
   * يحدث المرحلة ويبدأ النقاش مع وكلاء المرحلة الجديدة
   */
  const handleAdvancePhase = async () => {
    if (!currentSession) return;
    const nextPhase = Math.min(activePhase + 1, 5) as BrainstormPhase;
    setActivePhase(nextPhase);
    const updatedSession = { ...currentSession, phase: nextPhase };
    setCurrentSession(updatedSession);
    const nextPhaseAgents = getAgentsForPhase(nextPhase);
    
    /** مهام كل مرحلة مع ملخص الفكرة */
    const phaseTasks: Record<BrainstormPhase, string> = {
      1: `التحليل الأولي للبريف: ${currentSession.brief}`,
      2: `التوسع الإبداعي: ${currentSession.brief}`,
      3: `التحقق والتدقيق: ${currentSession.brief}`,
      4: `النقاش والتوافق: ${currentSession.brief}`,
      5: `التقييم النهائي: ${currentSession.brief}`,
    };
    
    try {
      await executeAgentDebate(nextPhaseAgents, updatedSession, phaseTasks[nextPhase]);
    } catch (err) {
      setError(`فشل في إتمام المرحلة ${nextPhase}`);
    }
  };

  // ============================================================================
  // القيم المحسوبة للعرض
  // ============================================================================

  /**
   * الحصول على أيقونة المرحلة
   * @param phaseId - رقم المرحلة
   * @returns عنصر React للأيقونة
   */
  const getPhaseIcon = useCallback((phaseId: BrainstormPhase) => {
    const icons: Record<BrainstormPhase, React.ReactNode> = {
      1: <BookOpen className="w-5 h-5" />,
      2: <Sparkles className="w-5 h-5" />,
      3: <Shield className="w-5 h-5" />,
      4: <Trophy className="w-5 h-5" />,
      5: <Target className="w-5 h-5" />,
    };
    return icons[phaseId];
  }, []);

  /**
   * الحصول على لون المرحلة
   * @param phaseId - رقم المرحلة
   * @returns فئة CSS للون
   */
  const getPhaseColor = useCallback((phaseId: BrainstormPhase) => {
    const colors: Record<BrainstormPhase, string> = {
      1: "bg-blue-500 hover:bg-blue-600",
      2: "bg-purple-500 hover:bg-purple-600",
      3: "bg-green-500 hover:bg-green-600",
      4: "bg-yellow-500 hover:bg-yellow-600",
      5: "bg-red-500 hover:bg-red-600",
    };
    return colors[phaseId];
  }, []);

  /** معلومات المراحل للعرض */
  const phases = useMemo(() => 
    BRAINSTORM_PHASES.map((phase) => ({
      id: phase.id,
      name: phase.name,
      nameEn: phase.nameEn,
      description: phase.description,
      icon: getPhaseIcon(phase.id),
      color: getPhaseColor(phase.id),
      agentCount: getAgentsForPhase(phase.id).length,
    })),
    [getPhaseIcon, getPhaseColor]
  );

  // ============================================================================
  // العرض
  // ============================================================================

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* رأس الصفحة */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🧠 منصة العصف الذهني الذكي
        </h1>
        <p className="text-xl text-muted-foreground">
          نظام متعدد الوكلاء للتطوير القصصي
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Badge variant="secondary">{agentStats.total} وكيل</Badge>
          <Badge variant="secondary">{agentStats.withRAG} RAG</Badge>
          <Badge variant="secondary">تعقيد {(agentStats.averageComplexity * 100).toFixed(0)}%</Badge>
        </div>
        
        {/* رسالة الخطأ */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {/* معلومات الجلسة الحالية */}
        {currentSession && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-600">الجلسة: {currentSession.brief}</p>
          </div>
        )}
      </div>

      {/* المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-3"><Cpu className="w-6 h-6" />لوحة التحكم</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">المراحل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {phases.map((phase) => (
                    <TooltipProvider key={phase.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant={activePhase === phase.id ? "default" : "outline"} className="p-4 h-auto" onClick={() => setActivePhase(phase.id as BrainstormPhase)}>
                            <div className="flex items-center gap-3 w-full">
                              {phase.icon}
                              <div className="text-left flex-1">
                                <p className="font-bold text-sm">{phase.name}</p>
                                <p className="text-xs opacity-75">{phase.nameEn}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">{phase.agentCount}</Badge>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{phase.description}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              {!currentSession ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ملخص الفكرة</label>
                    <FileUpload onFileContent={(content) => { setBrief(content); setError(null); }} className="mb-4" />
                    <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="اكتب فكرتك..." className="min-h-[100px]" disabled={isLoading} />
                  </div>
                  <Button onClick={handleStartSession} disabled={isLoading || !brief.trim()} className="w-full" size="lg">
                    {isLoading ? <><Settings className="w-5 h-5 mr-2 animate-spin" />جاري الإنشاء...</> : <><Play className="w-5 h-5 mr-2" />بدء جلسة</>}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">الملخص</h3>
                    <p className="text-sm">{currentSession.brief}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleAdvancePhase} disabled={activePhase >= 5} className="flex-1"><Rocket className="w-5 h-5 mr-2" />التالي</Button>
                    <Button onClick={handleStopSession} variant="destructive"><RotateCcw className="w-5 h-5 mr-2" />إعادة</Button>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">التقدم</span>
                      <span className="text-sm font-medium">{((activePhase / 5) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{ width: `${(activePhase / 5) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {currentSession && debateMessages.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-3"><MessageSquare className="w-6 h-6" />النقاش</CardTitle><CardDescription>{debateMessages.length} رسالة</CardDescription></CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {debateMessages.map((msg, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${msg.type === "proposal" ? "bg-blue-50 border-blue-200" : msg.type === "decision" ? "bg-purple-50 border-purple-200" : "bg-green-50 border-green-200"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{msg.agentName}</span>
                          <div className="flex items-center gap-2">
                            {msg.uncertainty && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className={`text-xs ${msg.uncertainty.confidence > 0.7 ? "bg-green-50" : msg.uncertainty.confidence > 0.4 ? "bg-yellow-50" : "bg-red-50"}`}>
                                      <Shield className="w-3 h-3 mr-1" />
                                      {(msg.uncertainty.confidence * 100).toFixed(0)}%
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>الثقة: {msg.uncertainty.confidence.toFixed(2)}</p>
                                    <p>النوع: {msg.uncertainty.type}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <Badge variant="outline" className="text-xs">{msg.type === "proposal" ? "اقتراح" : msg.type === "decision" ? "قرار" : "موافقة"}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><Users className="w-6 h-6" />الوكلاء</CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>{showAllAgents ? `${realAgents.length} وكيل` : `${phaseAgents.length} للمرحلة ${activePhase}`}</span>
                <Button variant="ghost" size="sm" onClick={() => setShowAllAgents(!showAllAgents)}>{showAllAgents ? "المرحلة" : "الكل"}</Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {displayedAgents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} state={agentStates.get(agent.id) || { id: agent.id, status: "idle" }} isExpanded={expandedAgents.has(agent.id)} onToggleExpand={() => toggleAgentExpand(agent.id)} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
