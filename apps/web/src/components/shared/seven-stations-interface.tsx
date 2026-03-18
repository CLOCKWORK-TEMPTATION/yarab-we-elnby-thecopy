"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Play,
  FileText,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Gavel,
  Activity,
  GitMerge,
  Scale,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * Seven Stations Interface - Enhanced Version
 * Based on UI_DESIGN_SUGGESTIONS.md
 *
 * Features:
 * - Interactive Station Flow with scroll-snap
 * - Progress Ring visualization
 * - Cinematic animations
 * - View Transitions API support
 * - Particle effects on completion
 */

const FileUpload = dynamic(() => import("@/components/file-upload"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  ssr: false,
});

// --- Types Definitions ---

export interface CrossStationAlert {
  sourceStation: string;
  targetStation: string;
  issue: string;
  severity: "low" | "medium" | "high";
}

export interface StationMetric {
  label: string;
  value: number;
  trend: "up" | "down" | "stable";
}

export interface DebateSession {
  isOpen: boolean;
  topic: string;
  history: { speaker: "user" | "ai"; text: string }[];
}

export interface StationResult {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  status: "idle" | "analyzing" | "completed" | "error";
  confidence: number;
  findings: string[];
  metrics?: StationMetric[];
  alerts?: CrossStationAlert[];
}

// --- Main Component ---

export default function SevenStationsInterface() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [debateSession, setDebateSession] = useState<DebateSession>({
    isOpen: false,
    topic: "",
    history: [],
  });
  const { toast } = useToast();

  // Initial State of Stations
  const [stations, setStations] = useState<StationResult[]>([
    {
      id: "S0",
      name: "المحطة صفر: المشرحة",
      icon: Activity,
      description: "فحص النبرة، الغلاف الجوي، والحمض النووي للنص.",
      status: "idle",
      confidence: 0,
      findings: [],
    },
    {
      id: "S1",
      name: "البناء الهيكلي",
      icon: BrainCircuit,
      description: "تحليل العظام: الحبكة، نقاط التحول، والإيقاع.",
      status: "idle",
      confidence: 0,
      findings: [],
    },
    {
      id: "S2",
      name: "شبكة الصراعات",
      icon: GitMerge,
      description: "خرائط العلاقات وتشابك المصالح.",
      status: "idle",
      confidence: 0,
      findings: [],
    },
    {
      id: "S3",
      name: "الأبعاد النفسية",
      icon: Scale,
      description: "دوافع الشخصيات والتحيزات المعرفية.",
      status: "idle",
      confidence: 0,
      findings: [],
    },
    {
      id: "S4",
      name: "الرمزية والديناميكية",
      icon: Activity,
      description: "ما وراء النص (Subtext) والرسائل المبطنة.",
      status: "idle",
      confidence: 0,
      findings: [],
    },
    {
      id: "S5",
      name: "محامي الشيطان",
      icon: Gavel,
      description: "هجوم نقدي شرس لاكتشاف الثغرات.",
      status: "idle",
      confidence: 0,
      findings: [],
    },
    {
      id: "S6",
      name: "الحكم النهائي",
      icon: CheckCircle2,
      description: "تجميع الأدلة وإصدار تقرير الصلاحية.",
      status: "idle",
      confidence: 0,
      findings: [],
    },
  ]);

  // --- Logic ---

  const runSimulation = async () => {
    if (!text.trim()) {
      toast({
        title: "النص مفقود",
        description: "لا يمكن استجواب الفراغ. أطعم النظام نصاً أولاً.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Reset stations
    setStations(s => s.map(st => ({ ...st, status: "idle", findings: [], confidence: 0 })));

    // Simulate Analysis Pipeline (This would be your actual API call logic)
    // Here we utilize a waterfall effect for the UI
    for (let i = 0; i < stations.length; i++) {
      setStations((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "analyzing" } : s))
      );
      
      // Mock API Latency
      await new Promise((r) => setTimeout(r, 1500));
      
      // Mock Results (Replace this with actual API response parsing)
      setStations((prev) =>
        prev.map((s, idx) => {
          if (idx === i) {
            return {
              ...s,
              status: "completed",
              confidence: 0.7 + Math.random() * 0.3,
              findings: generateMockFindings(s.id),
              metrics: generateMockMetrics(s.id),
              alerts: idx > 1 ? generateMockAlerts(s.id) : [],
            };
          }
          return s;
        })
      );
    }

    setIsAnalyzing(false);
    toast({
      title: "اكتمل التحقيق",
      description: "تم إنشاء تقرير التشريح السردي بنجاح.",
    });
  };

  // --- Mock Data Generators (To demonstrate functionality) ---
  const generateMockFindings = (id: string) => {
    const findings = [
      "التوتر في المشهد الافتتاحي يعتمد على الصدفة أكثر من السببية.",
      "حوار الشخصية (س) يحمل دلالات لا تتناسب مع خلفيتها الاجتماعية.",
      "هناك فجوة زمنية غير مبررة بين الفصل الثاني والثالث.",
      "استخدام الرمزية (المرآة المكسورة) مستهلك وكليشيه.",
    ];
    return findings.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const generateMockMetrics = (id: string): StationMetric[] => {
    return [
      { label: "كثافة الصراع", value: Math.random() * 100, trend: "up" },
      { label: "غموض الدوافع", value: Math.random() * 100, trend: "down" },
      { label: "الإيقاع", value: Math.random() * 100, trend: "stable" },
    ];
  };

  const generateMockAlerts = (id: string): CrossStationAlert[] => {
    if (Math.random() > 0.7) return [];
    return [
      {
        sourceStation: id,
        targetStation: "S1",
        issue: "تناقض في الدافع الرئيسي مع البناء الهيكلي",
        severity: "high",
      },
    ];
  };

  // --- Interaction Handlers ---

  const handleDebateOpen = (finding: string) => {
    setDebateSession({
      isOpen: true,
      topic: finding,
      history: [
        { speaker: "ai", text: `لقد حددت النقطة التالية كنقطة ضعف: "${finding}". لماذا تعتقد أنني مخطئ؟` },
      ],
    });
  };

  const handleDebateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock AI Response logic
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("argument") as HTMLInputElement;
    const userArg = input.value;
    
    if (!userArg.trim()) return;

    const newHistory = [
      ...debateSession.history,
      { speaker: "user", text: userArg } as const,
      { speaker: "ai", text: "وجهة نظر مثيرة للاهتمام. سأقوم بتحديث معامل الثقة بناءً على هذا التبرير الدرامي." } as const,
    ];

    setDebateSession({ ...debateSession, history: newHistory });
    input.value = "";
  };

  // --- UI Components ---

  return (
    <div className="container mx-auto p-4 min-h-screen bg-background" dir="rtl">
      {/* Header Section */}
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          غرفة التشريح السردي
        </h1>
        <p className="text-muted-foreground text-lg">
          نظام المحطات السبع للتحليل الدرامي المتقدم
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                الأدلة المادية (النص)
              </CardTitle>
              <CardDescription>ارفع السيناريو أو الصقه هنا لبدء التحقيق.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                onFileContent={(c, n) => setText(c)}
                accept=".pdf,.docx,.txt"
              />
              <div className="relative">
                <Textarea
                  placeholder="أو اكتب المشهد هنا..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[300px] font-mono text-sm resize-none bg-muted/30 focus:bg-background transition-colors"
                />
                <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 rounded">
                  {text.length} حرف
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={runSimulation}
                disabled={isAnalyzing || !text}
                className="w-full text-lg font-bold py-6 shadow-md hover:shadow-xl transition-all"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري الاستجواب...
                  </>
                ) : (
                  <>
                    <Play className="ml-2 h-5 w-5" />
                    بدء التحليل
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Overall Health / Stats (Mock) */}
          {stations.some(s => s.status === "completed") && (
            <Card>
              <CardHeader>
                <CardTitle>مؤشرات حيوية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>التماسك المنطقي</span>
                    <span className="font-bold">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>الأصالة الإبداعية</span>
                    <span className="font-bold">92%</span>
                  </div>
                  <Progress value={92} className="h-2 bg-purple-100" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Stations Visualization */}
        <div className="lg:col-span-8 space-y-4">
          <ScrollArea className="h-[calc(100vh-200px)] pr-4">
            <div className="space-y-4">
              {stations.map((station, index) => (
                <StationCard
                  key={station.id}
                  station={station}
                  isActive={isAnalyzing && station.status === "analyzing"}
                  onDebate={handleDebateOpen}
                  index={index}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Debate Dialog (Modal) */}
      <Dialog open={debateSession.isOpen} onOpenChange={(open) => setDebateSession(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Gavel className="h-5 w-5" />
              اعتراض على الحكم
            </DialogTitle>
            <DialogDescription>
              أنت تناظر "المدعي الناقد" حول النقطة: <br/>
              <span className="font-bold text-foreground">"{debateSession.topic}"</span>
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[300px] border rounded-md p-4 bg-muted/20">
            <div className="space-y-4">
              {debateSession.history.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-full",
                    msg.speaker === "user" ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3 text-sm",
                      msg.speaker === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    )}
                  >
                    <p className="font-bold text-xs mb-1 opacity-70">
                      {msg.speaker === "user" ? "أنت (الدفاع)" : "الذكاء الاصطناعي (الادعاء)"}
                    </p>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={handleDebateSubmit} className="flex gap-2 mt-4">
            <Textarea
              name="argument"
              placeholder="اكتب مرافعتك هنا..."
              className="flex-1 min-h-[80px]"
            />
            <Button type="submit" className="h-auto px-6">
              إرسال <MessageSquare className="mr-2 h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Sub-Components ---

// Progress Ring Component for Station Status
function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  className,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={cn("progress-ring", className)}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted opacity-20"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring__circle text-brand"
      />
    </svg>
  );
}

// Enhanced Station Card with modern styling
function StationCard({
  station,
  isActive,
  onDebate,
  index,
}: {
  station: StationResult;
  isActive: boolean;
  onDebate: (finding: string) => void;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const StatusIcon = () => {
    if (station.status === "analyzing") {
      return (
        <div className="relative">
          <ProgressRing progress={50} size={40} strokeWidth={3} />
          <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-brand" />
        </div>
      );
    }
    if (station.status === "completed") {
      return (
        <div className="relative">
          <ProgressRing progress={100} size={40} strokeWidth={3} />
          <CheckCircle2 className="absolute inset-0 m-auto h-4 w-4 text-accent-success" />
        </div>
      );
    }
    if (station.status === "error") {
      return <AlertTriangle className="h-5 w-5 text-accent-error" />;
    }
    return (
      <div className="relative">
        <ProgressRing progress={0} size={40} strokeWidth={3} />
        <station.icon className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
      </div>
    );
  };

  return (
    <Card
      ref={cardRef}
      data-active={isActive}
      data-completed={station.status === "completed"}
      className={cn(
        "station-card relative overflow-hidden transition-all duration-300",
        "scroll-animate",
        isActive && "glow-brand",
        station.status === "completed" && "border-accent-success/30"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Animated background gradient for active state */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent pointer-events-none" />
      )}

      {/* Station number badge */}
      <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
        {index}
      </div>

      <CardHeader className="pb-2 pr-14">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <StatusIcon />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {station.name}
                {isActive && (
                  <Zap className="h-4 w-4 text-brand animate-pulse" />
                )}
              </CardTitle>
              <CardDescription className="mt-1">{station.description}</CardDescription>
            </div>
          </div>
          {station.status === "completed" && (
            <Badge
              variant={station.confidence > 0.8 ? "default" : "secondary"}
              className={cn(
                "transition-all",
                station.confidence > 0.8 && "bg-accent-success text-white"
              )}
            >
              <Sparkles className="h-3 w-3 ml-1" />
              ثقة: {Math.round(station.confidence * 100)}%
            </Badge>
          )}
        </div>
      </CardHeader>

      {station.status === "completed" && (
        <CardContent className="pt-2 space-y-4 animate-fade-in">
          {/* Metrics Grid with improved styling */}
          {station.metrics && station.metrics.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {station.metrics.map((m, i) => (
                <div
                  key={i}
                  className="metric-card p-3 rounded-lg text-center card-interactive"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="text-xs text-muted-foreground mb-2">{m.label}</div>
                  <div className="metric-card__value text-2xl font-bold text-brand">
                    {Math.round(m.value)}
                  </div>
                  <div className={cn(
                    "metric-card__trend text-xs mt-1",
                    m.trend === "up" && "text-accent-success",
                    m.trend === "down" && "text-accent-error",
                    m.trend === "stable" && "text-muted-foreground"
                  )}>
                    {m.trend === "up" && "↑"}
                    {m.trend === "down" && "↓"}
                    {m.trend === "stable" && "→"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Findings List with hover effects */}
          <div className="space-y-2">
            {station.findings.map((finding, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 group p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer"
              >
                <div className="mt-1.5 h-2 w-2 rounded-full bg-accent-error shrink-0 group-hover:scale-125 transition-transform" />
                <p className="text-sm flex-1 leading-relaxed">{finding}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-7 text-xs text-muted-foreground hover:text-accent-error hover:bg-accent-error/10 transition-all"
                  onClick={() => onDebate(finding)}
                >
                  <Gavel className="h-3 w-3 ml-1" />
                  اعترض!
                </Button>
              </div>
            ))}
          </div>

          {/* Cross-Station Alerts with improved styling */}
          {station.alerts && station.alerts.length > 0 && (
            <div className="mt-4 p-4 bg-accent-warning/10 border border-accent-warning/20 rounded-xl">
              <h4 className="text-sm font-bold text-accent-warning mb-3 flex items-center gap-2">
                <GitMerge className="h-4 w-4" /> تعارض مع محطات أخرى
              </h4>
              <div className="space-y-2">
                {station.alerts.map((alert, i) => (
                  <div key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-accent-warning">•</span>
                    <span>
                      يتعارض مع <strong className="text-foreground">{alert.targetStation}</strong>: {alert.issue}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}