"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles,
  Wand2,
  FileText,
  Zap,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Copy,
  History,
  BookOpen,
  RefreshCw,
  ArrowRight,
  ArrowUpDown,
  Layers,
  Target,
  Shield,
  Eye,
  Hash,
  Clock,
  TrendingUp,
  FlaskConical,
  Play,
  Save,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Star,
  ArrowUp,
  ArrowDown,
  PenTool,
  MessagesSquare,
  FileCode,
  Languages,
  ListFilter,
  Maximize2,
  type LucideIcon,
} from "lucide-react";
import { analyzePrompt, comparePrompts, generateEnhancementSuggestions } from "@the-copy/prompt-engineering";
import { defaultPromptTemplates, renderTemplate, validateTemplateVariables } from "@the-copy/prompt-engineering";
import type { PromptAnalysis, PromptTemplate, PromptCategory } from "@the-copy/prompt-engineering";

// Category icons mapping
const CATEGORY_ICONS: Record<PromptCategory, LucideIcon> = {
  creative_writing: PenTool,
  analysis: BarChart3,
  translation: Languages,
  summarization: FileText,
  question_answering: MessagesSquare,
  code_generation: FileCode,
  data_extraction: ListFilter,
  conversation: MessagesSquare,
  other: Layers,
};

// Category labels in Arabic
const CATEGORY_LABELS: Record<PromptCategory, string> = {
  creative_writing: "كتابة إبداعية",
  analysis: "تحليل",
  translation: "ترجمة",
  summarization: "تلخيص",
  question_answering: "أسئلة وأجوبة",
  code_generation: "توليد كود",
  data_extraction: "استخراج بيانات",
  conversation: "محادثة",
  other: "أخرى",
};

// Score colors
const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-blue-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
};

const getScoreBgColor = (score: number) => {
  if (score >= 80) return "bg-green-500/20";
  if (score >= 60) return "bg-blue-500/20";
  if (score >= 40) return "bg-amber-500/20";
  return "bg-red-500/20";
};

export default function ArabicPromptEngineeringStudioPage() {
  const [prompt, setPrompt] = React.useState("");
  const [analysis, setAnalysis] = React.useState<PromptAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("editor");
  const [selectedTemplate, setSelectedTemplate] = React.useState<PromptTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = React.useState<Record<string, string>>({});
  const [promptHistory, setPromptHistory] = React.useState<Array<{ prompt: string; timestamp: Date; score: number }>>([]);
  const [comparePrompt1, setComparePrompt1] = React.useState("");
  const [comparePrompt2, setComparePrompt2] = React.useState("");
  const [comparisonResult, setComparisonResult] = React.useState<ReturnType<typeof comparePrompts> | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);

  // Analyze prompt
  const handleAnalyze = React.useCallback(() => {
    if (!prompt.trim()) return;

    setIsAnalyzing(true);

    // Simulate async analysis
    setTimeout(() => {
      try {
        const result = analyzePrompt(prompt);
        setAnalysis(result);
        setSuggestions(generateEnhancementSuggestions(prompt));

        // Add to history
        setPromptHistory(prev => [
          { prompt, timestamp: new Date(), score: result.metrics.overallScore },
          ...prev.slice(0, 9)
        ]);
      } catch (error) {
        console.error("Analysis error:", error);
      }
      setIsAnalyzing(false);
    }, 500);
  }, [prompt]);

  // Apply template
  const handleApplyTemplate = React.useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template);
    setTemplateVariables({});

    // Pre-fill with defaults
    const defaults: Record<string, string> = {};
    template.variables.forEach(v => {
      if (v.defaultValue) {
        defaults[v.name] = v.defaultValue;
      }
    });
    setTemplateVariables(defaults);
  }, []);

  // Generate from template
  const handleGenerateFromTemplate = React.useCallback(() => {
    if (!selectedTemplate) return;

    const validation = validateTemplateVariables(selectedTemplate, templateVariables);
    if (!validation.valid) {
      alert(validation.errors.join("\n"));
      return;
    }

    const rendered = renderTemplate(selectedTemplate, templateVariables);
    setPrompt(rendered);
    setActiveTab("editor");
  }, [selectedTemplate, templateVariables]);

  // Compare prompts
  const handleCompare = React.useCallback(() => {
    if (!comparePrompt1.trim() || !comparePrompt2.trim()) return;

    try {
      const result = comparePrompts(comparePrompt1, comparePrompt2);
      setComparisonResult(result);
    } catch (error) {
      console.error("Comparison error:", error);
    }
  }, [comparePrompt1, comparePrompt2]);

  // Copy to clipboard
  const handleCopy = React.useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
  }, []);

  // Load from history
  const handleLoadFromHistory = React.useCallback((historicalPrompt: string) => {
    setPrompt(historicalPrompt);
    setActiveTab("editor");
  }, []);



  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/5">
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-violet-900/90 text-white py-8 px-6 border-b border-purple-500/20">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                  <Wand2 className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">
                    استوديو هندسة التوجيهات العربي
                  </h1>
                  <p className="text-purple-200/80">
                    Arabic Prompt Engineering Studio - أدوات متقدمة لتحسين وتحليل التوجيهات
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-purple-400/50 text-purple-200">
                  <Sparkles className="h-3 w-3 ml-1" />
                  مدعوم بالذكاء الاصطناعي
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto bg-muted/50">
              <TabsTrigger value="editor" className="gap-2">
                <PenTool className="h-4 w-4" />
                المحرر
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <BookOpen className="h-4 w-4" />
                القوالب
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                المقارنة
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                السجل
              </TabsTrigger>
              <TabsTrigger value="lab" className="gap-2">
                <FlaskConical className="h-4 w-4" />
                المختبر
              </TabsTrigger>
            </TabsList>

            {/* Editor Tab */}
            <TabsContent value="editor" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Prompt Editor */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="border-purple-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-500" />
                          محرر التوجيهات
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleCopy(prompt)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setPrompt("")}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="اكتب توجيهك هنا... مثال: اكتب مقالاً تحليلياً عن تأثير الذكاء الاصطناعي على سوق العمل العربي"
                        className="min-h-[300px] bg-muted/30 border-purple-500/20 focus:border-purple-500/50 text-lg leading-relaxed"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        dir="auto"
                      />

                      {/* Quick Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Hash className="h-4 w-4" />
                            {prompt.split(/\s+/).filter(Boolean).length} كلمة
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {prompt.length} حرف
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            ~{Math.ceil(prompt.length / 4)} tokens
                          </span>
                        </div>
                        <Button
                          onClick={handleAnalyze}
                          disabled={!prompt.trim() || isAnalyzing}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                        >
                          {isAnalyzing ? (
                            <>
                              <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                              جاري التحليل...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="h-4 w-4 ml-2" />
                              تحليل التوجيه
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <Card className="border-amber-500/20 bg-amber-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                          <Lightbulb className="h-5 w-5" />
                          اقتراحات للتحسين
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Analysis Panel */}
                <div className="space-y-4">
                  {analysis ? (
                    <>
                      {/* Overall Score */}
                      <Card className="border-purple-500/20">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="relative w-32 h-32 mx-auto mb-4">
                              <svg className="w-32 h-32" viewBox="0 0 100 100">
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  className="text-muted/20"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                  strokeDasharray={`${analysis.metrics.overallScore * 2.83} 283`}
                                  transform="rotate(-90 50 50)"
                                  className={getScoreColor(analysis.metrics.overallScore)}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={cn("text-3xl font-bold", getScoreColor(analysis.metrics.overallScore))}>
                                  {analysis.metrics.overallScore}
                                </span>
                                <span className="text-xs text-muted-foreground">من 100</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <Badge className={cn("text-sm px-3 py-1", getScoreBgColor(analysis.metrics.overallScore))}>
                                {analysis.metrics.overallScore >= 80 ? "ممتاز" :
                                 analysis.metrics.overallScore >= 60 ? "جيد" :
                                 analysis.metrics.overallScore >= 40 ? "مقبول" : "يحتاج تحسين"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Metrics Breakdown */}
                      <Card className="border-purple-500/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-500" />
                            تفاصيل التقييم
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {[
                            { label: "الوضوح", value: analysis.metrics.clarity, icon: Eye },
                            { label: "التحديد", value: analysis.metrics.specificity, icon: Target },
                            { label: "الاكتمال", value: analysis.metrics.completeness, icon: CheckCircle },
                            { label: "الفعالية", value: analysis.metrics.effectiveness, icon: TrendingUp },
                            { label: "كفاءة التوكنز", value: analysis.metrics.tokenEfficiency, icon: Zap },
                          ].map((metric) => (
                            <div key={metric.label} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <metric.icon className="h-4 w-4" />
                                  {metric.label}
                                </span>
                                <span className={cn("font-bold", getScoreColor(metric.value))}>
                                  {metric.value}%
                                </span>
                              </div>
                              <Progress value={metric.value} className="h-2" />
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Category & Language */}
                      <Card className="border-purple-500/20">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">التصنيف</p>
                              <Badge variant="secondary">
                                {CATEGORY_LABELS[analysis.category]}
                              </Badge>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">اللغة</p>
                              <Badge variant="secondary">
                                {analysis.language === "ar" ? "عربية" :
                                 analysis.language === "en" ? "إنجليزية" : "مختلطة"}
                              </Badge>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">التعقيد</p>
                              <Badge variant="secondary">
                                {analysis.complexity === "low" ? "منخفض" :
                                 analysis.complexity === "medium" ? "متوسط" : "عالي"}
                              </Badge>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">التوكنز</p>
                              <Badge variant="secondary">
                                ~{analysis.estimatedTokens}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 gap-4">
                        {analysis.strengths.length > 0 && (
                          <Card className="border-green-500/20 bg-green-500/5">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                نقاط القوة
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-1">
                                {analysis.strengths.map((strength, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm">
                                    <ArrowUp className="h-3 w-3 text-green-500" />
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {analysis.weaknesses.length > 0 && (
                          <Card className="border-red-500/20 bg-red-500/5">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                نقاط الضعف
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-1">
                                {analysis.weaknesses.map((weakness, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm">
                                    <ArrowDown className="h-3 w-3 text-red-500" />
                                    {weakness}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </>
                  ) : (
                    <Card className="border-dashed border-2 border-purple-500/20">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="h-8 w-8 text-purple-500/50" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">لا يوجد تحليل بعد</h3>
                        <p className="text-sm text-muted-foreground">
                          اكتب توجيهاً واضغط على "تحليل التوجيه" لرؤية التقييم
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Templates List */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-500" />
                        مكتبة القوالب
                      </CardTitle>
                      <CardDescription>
                        قوالب جاهزة لمختلف الاستخدامات
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-4">
                          {defaultPromptTemplates.map((template) => {
                            const Icon = CATEGORY_ICONS[template.category];
                            return (
                              <div
                                key={template.id}
                                className={cn(
                                  "p-4 rounded-lg border cursor-pointer transition-all",
                                  selectedTemplate?.id === template.id
                                    ? "border-purple-500 bg-purple-500/10"
                                    : "border-muted hover:border-purple-500/50 hover:bg-muted/50"
                                )}
                                onClick={() => handleApplyTemplate(template)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10">
                                      <Icon className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{template.name}</h4>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {template.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="text-xs">
                                          {CATEGORY_LABELS[template.category]}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {template.language === "ar" ? "عربي" : "إنجليزي"}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {template.variables.length} متغير
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Template Editor */}
                <div>
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {selectedTemplate ? selectedTemplate.name : "اختر قالباً"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedTemplate ? (
                        <div className="space-y-4">
                          {/* Variables */}
                          {selectedTemplate.variables.map((variable) => (
                            <div key={variable.name} className="space-y-2">
                              <label className="text-sm font-medium flex items-center gap-2">
                                {variable.name}
                                {variable.required && (
                                  <span className="text-red-500">*</span>
                                )}
                              </label>
                              <Input
                                placeholder={variable.description}
                                value={templateVariables[variable.name] || ""}
                                onChange={(e) =>
                                  setTemplateVariables((prev) => ({
                                    ...prev,
                                    [variable.name]: e.target.value,
                                  }))
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                {variable.description}
                              </p>
                            </div>
                          ))}

                          {/* Preview */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">معاينة</label>
                            <div className="p-3 bg-muted/30 rounded-lg text-sm max-h-48 overflow-auto">
                              <pre className="whitespace-pre-wrap" dir="auto">
                                {renderTemplate(selectedTemplate, templateVariables)}
                              </pre>
                            </div>
                          </div>

                          <Button
                            onClick={handleGenerateFromTemplate}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                          >
                            <Play className="h-4 w-4 ml-2" />
                            استخدام القالب
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>اختر قالباً من القائمة</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Compare Tab */}
            <TabsContent value="compare" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5 text-purple-500" />
                    مقارنة التوجيهات
                  </CardTitle>
                  <CardDescription>
                    قارن بين توجيهين لمعرفة أيهما أفضل
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium">التوجيه الأول</label>
                      <Textarea
                        placeholder="اكتب التوجيه الأول هنا..."
                        className="min-h-[200px]"
                        value={comparePrompt1}
                        onChange={(e) => setComparePrompt1(e.target.value)}
                        dir="auto"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium">التوجيه الثاني</label>
                      <Textarea
                        placeholder="اكتب التوجيه الثاني هنا..."
                        className="min-h-[200px]"
                        value={comparePrompt2}
                        onChange={(e) => setComparePrompt2(e.target.value)}
                        dir="auto"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={handleCompare}
                      disabled={!comparePrompt1.trim() || !comparePrompt2.trim()}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600"
                    >
                      <ArrowUpDown className="h-4 w-4 ml-2" />
                      مقارنة التوجيهات
                    </Button>
                  </div>

                  {/* Comparison Results */}
                  {comparisonResult && (
                    <div className="mt-8 space-y-6">
                      <div className="text-center p-6 bg-muted/30 rounded-lg">
                        <h3 className="text-xl font-bold mb-2">
                          {comparisonResult.winner === 1 ? "🏆 التوجيه الأول أفضل" :
                           comparisonResult.winner === 2 ? "🏆 التوجيه الثاني أفضل" :
                           "🤝 تعادل"}
                        </h3>
                        <p className="text-muted-foreground">
                          {comparisonResult.prompt1.metrics.overallScore} مقابل {comparisonResult.prompt2.metrics.overallScore}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        {/* Prompt 1 Results */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">التوجيه الأول</span>
                            <Badge className={getScoreBgColor(comparisonResult.prompt1.metrics.overallScore)}>
                              {comparisonResult.prompt1.metrics.overallScore}/100
                            </Badge>
                          </div>
                          {[
                            { label: "الوضوح", value: comparisonResult.prompt1.metrics.clarity },
                            { label: "التحديد", value: comparisonResult.prompt1.metrics.specificity },
                            { label: "الاكتمال", value: comparisonResult.prompt1.metrics.completeness },
                          ].map((metric) => (
                            <div key={metric.label} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{metric.label}</span>
                                <span>{metric.value}%</span>
                              </div>
                              <Progress value={metric.value} className="h-2" />
                            </div>
                          ))}
                        </div>

                        {/* Prompt 2 Results */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">التوجيه الثاني</span>
                            <Badge className={getScoreBgColor(comparisonResult.prompt2.metrics.overallScore)}>
                              {comparisonResult.prompt2.metrics.overallScore}/100
                            </Badge>
                          </div>
                          {[
                            { label: "الوضوح", value: comparisonResult.prompt2.metrics.clarity },
                            { label: "التحديد", value: comparisonResult.prompt2.metrics.specificity },
                            { label: "الاكتمال", value: comparisonResult.prompt2.metrics.completeness },
                          ].map((metric) => (
                            <div key={metric.label} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{metric.label}</span>
                                <span>{metric.value}%</span>
                              </div>
                              <Progress value={metric.value} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Differences */}
                      {comparisonResult.differences.length > 0 && (
                        <Card className="border-purple-500/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">الفروقات</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {comparisonResult.differences.map((diff, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                  <ChevronRight className="h-4 w-4 text-purple-500" />
                                  {diff}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-purple-500" />
                    سجل التوجيهات
                  </CardTitle>
                  <CardDescription>
                    التوجيهات التي تم تحليلها مؤخراً
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {promptHistory.length > 0 ? (
                    <div className="space-y-4">
                      {promptHistory.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border hover:border-purple-500/50 transition-all cursor-pointer"
                          onClick={() => handleLoadFromHistory(item.prompt)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm line-clamp-2" dir="auto">
                                {item.prompt}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.timestamp.toLocaleTimeString("ar-SA")}
                                </span>
                                <Badge variant="outline" className={getScoreBgColor(item.score)}>
                                  {item.score}/100
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>لا يوجد سجل بعد</p>
                      <p className="text-sm mt-1">ابدأ بتحليل التوجيهات لحفظها في السجل</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lab Tab */}
            <TabsContent value="lab" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quick Tips */}
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-purple-500" />
                      مختبر هندسة التوجيهات
                    </CardTitle>
                    <CardDescription>
                      نصائح وتقنيات متقدمة لكتابة توجيهات فعالة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          title: "كن واضحاً ومحدداً",
                          description: "استخدم تعليمات واضحة ومباشرة. تجنب الغموض والعبارات المبهمة.",
                          icon: Target,
                          color: "text-blue-500",
                        },
                        {
                          title: "أضف السياق",
                          description: "وفر معلومات كافية عن الخلفية والسياق للحصول على نتائج أفضل.",
                          icon: Layers,
                          color: "text-green-500",
                        },
                        {
                          title: "حدد التنسيق",
                          description: "اذكر بوضوح التنسيق المطلوب للمخرجات (قائمة، جدول، فقرات، إلخ).",
                          icon: FileText,
                          color: "text-purple-500",
                        },
                        {
                          title: "استخدم الأمثلة",
                          description: "الأمثلة التوضيحية تساعد النموذج على فهم المطلوب بشكل أفضل.",
                          icon: Lightbulb,
                          color: "text-amber-500",
                        },
                        {
                          title: "تجنب التكرار",
                          description: "كن موجزاً وتجنب تكرار نفس التعليمات. هذا يوفر التوكنز.",
                          icon: Zap,
                          color: "text-red-500",
                        },
                        {
                          title: "راجع وحسّن",
                          description: "جرب التوجيه وراجع النتائج. حسّن بناءً على ما تحصل عليه.",
                          icon: RefreshCw,
                          color: "text-indigo-500",
                        },
                      ].map((tip) => (
                        <div
                          key={tip.title}
                          className="p-4 rounded-lg border hover:border-purple-500/30 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg bg-muted", tip.color)}>
                              <tip.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">{tip.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {tip.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Prompt Patterns */}
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-500" />
                      أنماط التوجيهات الشائعة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          name: "Zero-Shot",
                          description: "توجيه مباشر بدون أمثلة",
                          example: "اكتب ملخصاً للنص التالي: [النص]",
                        },
                        {
                          name: "Few-Shot",
                          description: "توجيه مع أمثلة توضيحية",
                          example: "مثال 1: ... → ...\nمثال 2: ... → ...\nالآن: [المدخل]",
                        },
                        {
                          name: "Chain of Thought",
                          description: "التفكير خطوة بخطوة",
                          example: "فكر خطوة بخطوة في حل المسألة التالية: [المسألة]",
                        },
                        {
                          name: "Role-Playing",
                          description: "تحديد دور معين للنموذج",
                          example: "أنت خبير في [المجال]. أجب على السؤال التالي: [السؤال]",
                        },
                      ].map((pattern) => (
                        <div
                          key={pattern.name}
                          className="p-4 rounded-lg bg-muted/30 border"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{pattern.name}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {pattern.description}
                          </p>
                          <div className="p-2 bg-background rounded text-xs font-mono" dir="auto">
                            {pattern.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
}
