/**
 * @fileoverview مكون التطوير الإبداعي الرئيسي
 * 
 * يوفر واجهة متكاملة لأدوات التطوير الإبداعي للنصوص الدرامية
 * باستخدام الذكاء الاصطناعي. يتطلب إكمال تحليل المحطات السبع
 * أولاً قبل استخدام أدوات التطوير
 * 
 * @module development/creative-development
 */

import dynamic from "next/dynamic";
import React, { useMemo, useCallback } from "react";
import { toText } from "@/ai/gemini-core";

// الأنواع والثوابت المحلية
import {
  CreativeTaskType,
  CREATIVE_TASK_LABELS,
  type AdvancedAISettings,
} from "./types";
import { useCreativeDevelopment } from "./hooks";
import { getCreativeTaskIcon } from "./utils/task-icon-mapper";

// مكونات عرض التقارير
import { AgentReportViewer } from "@/components/agent-report-viewer";
import { AgentReportsExporter } from "@/components/agent-reports-exporter";

// مكونات UI الأساسية
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// الأيقونات
import {
  Loader2,
  Lightbulb,
  Lock,
  Unlock,
  Wand2,
  Brain,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Database,
  Eye,
  Shield,
  Users,
  Download,
} from "lucide-react";

/**
 * تحميل ديناميكي لمكون رفع الملفات
 * يُحسّن وقت التحميل الأولي للصفحة
 */
const FileUpload = dynamic(() => import("@/components/file-upload"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

// ============================================
// مكونات فرعية مُذكّرة (Memoized)
// ============================================

/**
 * مكون حالة القفل
 * يعرض رسالة توضح أن قسم التطوير مقفل
 */
const LockedStateAlert = React.memo(function LockedStateAlert() {
  return (
    <Alert>
      <Lock className="h-4 w-4" />
      <AlertTitle>قسم التطوير الإبداعي مقفل</AlertTitle>
      <AlertDescription>
        يجب إكمال تحليل المحطات السبع أولاً أو إدخال تقرير التحليل يدوياً
        لفتح أدوات التطوير الإبداعي
      </AlertDescription>
    </Alert>
  );
});

/**
 * مكون حالة التحميل الناجح
 * يعرض رسالة توضح أن نتائج التحليل جاهزة
 */
const LoadedStateAlert = React.memo(function LoadedStateAlert() {
  return (
    <Alert>
      <Unlock className="h-4 w-4" />
      <AlertTitle>تم تحميل نتائج التحليل</AlertTitle>
      <AlertDescription>
        يمكنك الآن استخدام أدوات التطوير الإبداعي لتحليل النص الخاص بك
      </AlertDescription>
    </Alert>
  );
});

/**
 * خصائص مكون إعدادات الذكاء الاصطناعي
 */
interface AISettingsProps {
  settings: AdvancedAISettings;
  onSettingChange: (key: keyof AdvancedAISettings, value: boolean) => void;
}

/**
 * مكون إعدادات الذكاء الاصطناعي المتقدمة
 * يعرض خيارات تفعيل/تعطيل الأنظمة المتقدمة
 */
const AdvancedAISettingsCard = React.memo(function AdvancedAISettingsCard({
  settings,
  onSettingChange,
}: AISettingsProps) {
  const settingsConfig = useMemo(() => [
    {
      key: "enableRAG" as const,
      icon: <Database className="w-4 h-4 text-blue-500" />,
      title: "RAG (الاسترجاع المعزز)",
      description: "يسترجع سياق ذي صلة من النص الأصلي والتحليل لضمان الدقة",
    },
    {
      key: "enableSelfCritique" as const,
      icon: <Brain className="w-4 h-4 text-purple-500" />,
      title: "النقد الذاتي",
      description: "مراجعة وتحسين المخرجات تلقائياً قبل العرض النهائي",
    },
    {
      key: "enableConstitutional" as const,
      icon: <Shield className="w-4 h-4 text-green-500" />,
      title: "الذكاء الدستوري",
      description: "التأكد من الالتزام بقواعد الأمانة والتماسك السردي",
    },
    {
      key: "enableHallucination" as const,
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      title: "كشف الهلوسات",
      description: "اكتشاف وتصحيح المحتوى غير المستند للنص الأصلي",
    },
    {
      key: "enableUncertainty" as const,
      icon: <CheckCircle2 className="w-4 h-4 text-cyan-500" />,
      title: "قياس عدم اليقين",
      description: "قياس مستوى الثقة في المخرجات (قد يبطئ الأداء)",
    },
    {
      key: "enableDebate" as const,
      icon: <Users className="w-4 h-4 text-indigo-500" />,
      title: "النقاش متعدد الوكلاء",
      description: "نقاش بين وكلاء متعددة للتوصل لأفضل حل (بطيء جداً)",
    },
  ], []);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          الإعدادات المتقدمة لأنظمة الذكاء الاصطناعي
        </CardTitle>
        <CardDescription>
          تفعيل/تعطيل الأنظمة المتقدمة (RAG، النقد الذاتي، الذكاء الدستوري،
          كشف الهلوسات)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsConfig.map((config) => (
            <div
              key={config.key}
              className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg border bg-card"
            >
              <Checkbox
                id={config.key}
                checked={settings[config.key]}
                onCheckedChange={(checked) =>
                  onSettingChange(config.key, checked as boolean)
                }
              />
              <div className="space-y-1 flex-1">
                <Label
                  htmlFor={config.key}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  {config.icon}
                  {config.title}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * خصائص مكون أزرار المهام
 */
interface TaskButtonsProps {
  tasks: CreativeTaskType[];
  selectedTask: CreativeTaskType | null;
  onTaskSelect: (task: CreativeTaskType) => void;
}

/**
 * مكون أزرار اختيار المهام الإبداعية
 */
const TaskButtons = React.memo(function TaskButtons({
  tasks,
  selectedTask,
  onTaskSelect,
}: TaskButtonsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tasks.map((task) => (
        <Button
          key={task}
          variant={selectedTask === task ? "default" : "outline"}
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onTaskSelect(task)}
        >
          {getCreativeTaskIcon(task)}
          <span className="text-xs text-center">
            {CREATIVE_TASK_LABELS[task]}
          </span>
        </Button>
      ))}
    </div>
  );
});

// ============================================
// المكون الرئيسي
// ============================================

/**
 * مكون التطوير الإبداعي
 * 
 * يوفر واجهة شاملة لأدوات التطوير الإبداعي للنصوص الدرامية
 * يستخدم الهوك المخصص لإدارة الحالة وفصل المنطق عن العرض
 */
const DramaAnalystApp: React.FC = () => {
  // استخدام الهوك المخصص لإدارة الحالة
  const {
    // الحالة
    textInput,
    selectedTask,
    specialRequirements,
    additionalInfo,
    completionScope,
    selectedCompletionEnhancements,
    analysisReport,
    isAnalysisComplete,
    taskResults,
    showReportModal,
    analysisId,
    advancedSettings,
    aiResponse,
    error,
    isLoading,

    // الثوابت
    creativeTasks,
    tasksRequiringScope,
    completionEnhancements,

    // الإجراءات
    setTextInput,
    setSpecialRequirements,
    setAdditionalInfo,
    setCompletionScope,
    setAnalysisReport,
    handleTaskSelect,
    handleToggleEnhancement,
    handleSubmit,
    handleFileContent,
    clearAnalysisData,
    updateAdvancedSettings,
    exportReport,
    showReport,
    getAgentReport,
  } = useCreativeDevelopment();

  /**
   * معالج تغيير إعدادات الذكاء الاصطناعي
   */
  const handleSettingChange = useCallback(
    (key: keyof AdvancedAISettings, value: boolean) => {
      updateAdvancedSettings({ [key]: value });
    },
    [updateAdvancedSettings]
  );

  /**
   * تقرير الوكيل للعرض
   */
  const agentReport = useMemo(() => getAgentReport(), [getAgentReport]);

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      {/* رأس الصفحة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            المحلل الدرامي والمبدع المحاكي
          </CardTitle>
          <CardDescription className="text-center">
            منصة ذكية لتحليل النصوص الدرامية وإنتاج محتوى إبداعي محاكي باستخدام
            الذكاء الاصطناعي
          </CardDescription>
        </CardHeader>
      </Card>

      {/* تنبيه حالة القفل */}
      {!isAnalysisComplete && <LockedStateAlert />}

      {/* تنبيه حالة التحميل الناجح */}
      {isAnalysisComplete && analysisId && <LoadedStateAlert />}

      {/* معلومات التحليل المحمل */}
      {isAnalysisComplete && analysisId && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            تم تحميل نتائج تحليل المحطات السبع تلقائياً (ID:{" "}
            {analysisId.slice(0, 8)}...)
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={clearAnalysisData}
            className="p-0 h-auto ml-2"
          >
            مسح البيانات
          </Button>
        </div>
      )}

      {/* قسم المدخلات */}
      <Card>
        <CardHeader>
          <CardTitle>المدخلات المطلوبة</CardTitle>
          <CardDescription>
            السيناريو وتقرير التحليل من المحطات السبع
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload
            onFileContent={handleFileContent}
          />
          <div>
            <Label htmlFor="screenplay">النص الدرامي</Label>
            <Textarea
              id="screenplay"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-32"
              placeholder="النص الدرامي المراد تطويره..."
              disabled={!!analysisId}
            />
            {analysisId && (
              <p className="text-sm text-muted-foreground mt-1">
                تم تحميل النص تلقائياً من جلسة التحليل السابقة
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="analysisReport">
              تقرير التحليل (المحطة السابعة)
              {analysisId && (
                <span className="text-green-600 text-sm ml-2">
                  ✓ محمل تلقائياً
                </span>
              )}
            </Label>
            <Textarea
              id="analysisReport"
              value={analysisReport}
              onChange={(e) => setAnalysisReport(e.target.value)}
              className="min-h-32"
              placeholder="تقرير التحليل من المحطات السبع... (سيتم تحميله تلقائياً بعد إكمال التحليل)"
              disabled={!!analysisId}
            />
            {analysisId && (
              <p className="text-sm text-muted-foreground mt-1">
                تم تحميل التقرير تلقائياً من نتائج تحليل المحطات السبع
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* اختيار أدوات التطوير الإبداعي */}
      {isAnalysisComplete && (
        <Card>
          <CardHeader>
            <CardTitle>أدوات التطوير الإبداعي</CardTitle>
            <CardDescription>اختر الأداة الإبداعية المطلوبة</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskButtons
              tasks={creativeTasks}
              selectedTask={selectedTask}
              onTaskSelect={handleTaskSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* متطلبات التطوير */}
      {isAnalysisComplete && (
        <Card>
          <CardHeader>
            <CardTitle>متطلبات التطوير</CardTitle>
            <CardDescription>حدد متطلبات التطوير الإبداعي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="devRequirements">متطلبات خاصة</Label>
              <Textarea
                id="devRequirements"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="حدد متطلبات التطوير الإبداعي..."
              />
            </div>
            <div>
              <Label htmlFor="additionalInfo">معلومات إضافية</Label>
              <Textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="أضف أي معلومات إضافية هنا..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* تحسينات الإكمال */}
      {selectedTask === CreativeTaskType.COMPLETION && (
        <Card>
          <CardHeader>
            <CardTitle>تحسينات الإكمال</CardTitle>
            <CardDescription>اختر التحسينات الإضافية للإكمال</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {completionEnhancements.map((enhancement) => (
                <div key={enhancement} className="flex items-center space-x-2">
                  <Checkbox
                    id={enhancement}
                    checked={selectedCompletionEnhancements.includes(enhancement)}
                    onCheckedChange={() => handleToggleEnhancement(enhancement)}
                  />
                  <Label htmlFor={enhancement} className="text-sm">
                    {CREATIVE_TASK_LABELS[enhancement] || enhancement}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* نطاق الإكمال */}
      {selectedTask && tasksRequiringScope.includes(selectedTask) && (
        <Card>
          <CardHeader>
            <CardTitle>نطاق الإكمال المطلوب</CardTitle>
            <CardDescription>حدد مدى الإكمال المطلوب</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={completionScope}
              onChange={(e) => setCompletionScope(e.target.value)}
              placeholder="مثال: فصل واحد، 3 مشاهد، حتى نهاية المسرحية، حلقتان..."
            />
          </CardContent>
        </Card>
      )}

      {/* الإعدادات المتقدمة */}
      {isAnalysisComplete && selectedTask && (
        <AdvancedAISettingsCard
          settings={advancedSettings}
          onSettingChange={handleSettingChange}
        />
      )}

      {/* متطلبات خاصة */}
      <Card>
        <CardHeader>
          <CardTitle>متطلبات خاصة (اختياري)</CardTitle>
          <CardDescription>أضف أي متطلبات أو توجيهات خاصة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="specialRequirements">متطلبات خاصة</Label>
            <Textarea
              id="specialRequirements"
              value={specialRequirements}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setSpecialRequirements(e.target.value)
              }
              placeholder="أضف أي متطلبات خاصة هنا..."
            />
          </div>
          <div>
            <Label htmlFor="additionalInfo">معلومات إضافية</Label>
            <Textarea
              id="additionalInfo"
              value={additionalInfo}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setAdditionalInfo(e.target.value)
              }
              placeholder="أضف أي معلومات إضافية هنا..."
            />
          </div>
        </CardContent>
      </Card>

      {/* زر الإرسال */}
      {isAnalysisComplete && (
        <div className="text-center">
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading || !selectedTask || !textInput || !analysisReport
            }
            size="lg"
            className="px-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري التطوير...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                بدء التطوير الإبداعي
              </>
            )}
          </Button>
        </div>
      )}

      {/* رسائل الخطأ */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* النتائج */}
      {aiResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>نتائج التحليل</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showReport}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  عرض التقرير الكامل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportReport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  تصدير التقرير
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>التحليل الدرامي</AlertTitle>
              <AlertDescription className="prose prose-sm dark:prose-invert mt-2 whitespace-pre-wrap">
                {toText(aiResponse.raw).substring(0, 500)}...
                <div className="mt-2 text-muted-foreground text-xs">
                  عرض أول 500 حرف فقط. اضغط "عرض التقرير الكامل" لمشاهدة التقرير
                  بالكامل
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Modal عرض التقرير */}
      {showReportModal && agentReport && (
        <AgentReportViewer report={agentReport} />
      )}

      {/* التقارير المجمعة */}
      {Object.keys(taskResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>التقارير المجمعة</CardTitle>
            <CardDescription>
              تم إنجاز {Object.keys(taskResults).length} مهمة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgentReportsExporter
              reports={taskResults}
              originalText={textInput}
              onExport={() => {
                // يتم استدعاء toast من الهوك
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DramaAnalystApp;