/**
 * @fileoverview هوك مخصص لإدارة حالة التطوير الإبداعي
 * 
 * يفصل هذا الهوك منطق إدارة الحالة عن المكون الرسومي
 * لتسهيل الاختبار والصيانة
 * 
 * @module development/hooks/useCreativeDevelopment
 */

import { useState, useCallback, useEffect, useReducer } from "react";
import { useToast } from "@/hooks/use-toast";
import { toText } from "@/ai/gemini-core";
import {
  CreativeTaskType,
  CREATIVE_TASK_LABELS,
  DEFAULT_AI_SETTINGS,
  type AdvancedAISettings,
  type AIResponseData,
  type AIRequestData,
  type ProcessedInputFile,
  type SevenStationsAnalysis,
  type TaskResults,
  submitInputSchema,
} from "../types";

// ============================================
// الثوابت
// ============================================

/** الحد الأدنى لطول النص المطلوب */
const MIN_TEXT_LENGTH = 100;

/** المهام التي تتطلب تحديد نطاق الإكمال */
const TASKS_REQUIRING_COMPLETION_SCOPE: CreativeTaskType[] = [
  CreativeTaskType.COMPLETION,
];

/** خيارات تحسين الإكمال */
const COMPLETION_ENHANCEMENT_OPTIONS: CreativeTaskType[] = [
  CreativeTaskType.CHARACTER_VOICE,
  CreativeTaskType.TENSION_OPTIMIZER,
  CreativeTaskType.STYLE_FINGERPRINT,
];

// ============================================
// أنواع الإجراءات
// ============================================

type ActionType =
  | { type: "SET_TEXT_INPUT"; payload: string }
  | { type: "SET_SELECTED_TASK"; payload: CreativeTaskType | null }
  | { type: "SET_SPECIAL_REQUIREMENTS"; payload: string }
  | { type: "SET_ADDITIONAL_INFO"; payload: string }
  | { type: "SET_COMPLETION_SCOPE"; payload: string }
  | { type: "TOGGLE_ENHANCEMENT"; payload: CreativeTaskType }
  | { type: "SET_ANALYSIS_REPORT"; payload: string }
  | { type: "SET_ANALYSIS_COMPLETE"; payload: boolean }
  | { type: "SET_ANALYSIS_ID"; payload: string | null }
  | { type: "SET_TASK_RESULTS"; payload: TaskResults }
  | { type: "SET_SHOW_REPORT_MODAL"; payload: string | null }
  | { type: "SET_ADVANCED_SETTINGS"; payload: Partial<AdvancedAISettings> }
  | { type: "SET_AI_RESPONSE"; payload: AIResponseData | null }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "CLEAR_ANALYSIS_DATA" }
  | { type: "LOAD_SEVEN_STATIONS"; payload: SevenStationsAnalysis }
  | { type: "LOAD_SESSION_ANALYSIS"; payload: { report: string; id: string } };

// ============================================
// الحالة الابتدائية
// ============================================

interface CreativeDevelopmentState {
  textInput: string;
  selectedTask: CreativeTaskType | null;
  specialRequirements: string;
  additionalInfo: string;
  completionScope: string;
  selectedCompletionEnhancements: CreativeTaskType[];
  analysisReport: string;
  isAnalysisComplete: boolean;
  taskResults: TaskResults;
  showReportModal: string | null;
  analysisId: string | null;
  advancedSettings: AdvancedAISettings;
  aiResponse: AIResponseData | null;
  error: string | null;
  isLoading: boolean;
}

const initialState: CreativeDevelopmentState = {
  textInput: "",
  selectedTask: null,
  specialRequirements: "",
  additionalInfo: "",
  completionScope: "",
  selectedCompletionEnhancements: [],
  analysisReport: "",
  isAnalysisComplete: false,
  taskResults: {},
  showReportModal: null,
  analysisId: null,
  advancedSettings: DEFAULT_AI_SETTINGS,
  aiResponse: null,
  error: null,
  isLoading: false,
};

// ============================================
// المُختزل (Reducer)
// ============================================

/**
 * مُختزل حالة التطوير الإبداعي
 * يدير جميع تحديثات الحالة بطريقة مركزية
 */
function creativeDevelopmentReducer(
  state: CreativeDevelopmentState,
  action: ActionType
): CreativeDevelopmentState {
  switch (action.type) {
    case "SET_TEXT_INPUT":
      return { ...state, textInput: action.payload };

    case "SET_SELECTED_TASK":
      return {
        ...state,
        selectedTask: action.payload,
        error: null,
        aiResponse: null,
        completionScope: action.payload && !TASKS_REQUIRING_COMPLETION_SCOPE.includes(action.payload)
          ? ""
          : state.completionScope,
        selectedCompletionEnhancements: action.payload !== CreativeTaskType.COMPLETION
          ? []
          : state.selectedCompletionEnhancements,
      };

    case "SET_SPECIAL_REQUIREMENTS":
      return { ...state, specialRequirements: action.payload };

    case "SET_ADDITIONAL_INFO":
      return { ...state, additionalInfo: action.payload };

    case "SET_COMPLETION_SCOPE":
      return { ...state, completionScope: action.payload };

    case "TOGGLE_ENHANCEMENT":
      return {
        ...state,
        selectedCompletionEnhancements: state.selectedCompletionEnhancements.includes(action.payload)
          ? state.selectedCompletionEnhancements.filter((id) => id !== action.payload)
          : [...state.selectedCompletionEnhancements, action.payload],
      };

    case "SET_ANALYSIS_REPORT":
      return { ...state, analysisReport: action.payload };

    case "SET_ANALYSIS_COMPLETE":
      return { ...state, isAnalysisComplete: action.payload };

    case "SET_ANALYSIS_ID":
      return { ...state, analysisId: action.payload };

    case "SET_TASK_RESULTS":
      return { ...state, taskResults: action.payload };

    case "SET_SHOW_REPORT_MODAL":
      return { ...state, showReportModal: action.payload };

    case "SET_ADVANCED_SETTINGS":
      return {
        ...state,
        advancedSettings: { ...state.advancedSettings, ...action.payload },
      };

    case "SET_AI_RESPONSE":
      return { ...state, aiResponse: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "CLEAR_ANALYSIS_DATA":
      return {
        ...state,
        analysisReport: "",
        analysisId: null,
        isAnalysisComplete: false,
        textInput: "",
      };

    case "LOAD_SEVEN_STATIONS":
      return {
        ...state,
        analysisReport: action.payload.finalReport,
        textInput: action.payload.originalText,
        isAnalysisComplete: true,
      };

    case "LOAD_SESSION_ANALYSIS":
      return {
        ...state,
        analysisReport: action.payload.report,
        analysisId: action.payload.id,
        isAnalysisComplete: true,
      };

    default:
      return state;
  }
}

// ============================================
// الهوك الرئيسي
// ============================================

/**
 * هوك إدارة التطوير الإبداعي
 * 
 * يوفر جميع الوظائف والحالات اللازمة لصفحة التطوير الإبداعي
 * بما في ذلك إدارة المدخلات، معالجة الطلبات، وعرض النتائج
 * 
 * @returns كائن يحتوي على الحالة والإجراءات
 */
export function useCreativeDevelopment() {
  const [state, dispatch] = useReducer(creativeDevelopmentReducer, initialState);
  const { toast } = useToast();

  // ============================================
  // تحميل البيانات المحفوظة
  // ============================================

  useEffect(() => {
    loadSavedAnalysisData();
  }, []);

  /**
   * تحميل بيانات التحليل المحفوظة من localStorage أو sessionStorage
   * يتحقق أولاً من وجود تحليل المحطات السبع ثم من الجلسة
   */
  const loadSavedAnalysisData = useCallback(() => {
    // التحقق من بيانات المحطات السبع
    const sevenStationsData = localStorage.getItem("sevenStationsAnalysis");
    if (sevenStationsData) {
      try {
        const analysisData: SevenStationsAnalysis = JSON.parse(sevenStationsData);
        if (analysisData.finalReport && analysisData.originalText) {
          dispatch({ type: "LOAD_SEVEN_STATIONS", payload: analysisData });

          toast({
            title: "تم استيراد التقرير من نظام المحطات السبع",
            description: `مستوى الثقة: ${(analysisData.confidence * 100).toFixed(1)}%`,
          });

          localStorage.removeItem("sevenStationsAnalysis");
          return;
        }
      } catch (error) {
        console.error("خطأ في تحليل بيانات المحطات السبع:", error);
      }
    }

    // التحقق من بيانات الجلسة
    const storedAnalysis = sessionStorage.getItem("stationAnalysisResults");
    const storedId = sessionStorage.getItem("analysisId");

    if (storedAnalysis && storedId) {
      try {
        const analysisData = JSON.parse(storedAnalysis);
        if (analysisData.stationOutputs?.station7) {
          dispatch({
            type: "LOAD_SESSION_ANALYSIS",
            payload: {
              report: JSON.stringify(analysisData.stationOutputs.station7, null, 2),
              id: storedId,
            },
          });
          return;
        }
      } catch (error) {
        console.error("خطأ في تحليل بيانات الجلسة:", error);
      }
    }

    // التحقق من النص الأصلي المحفوظ
    const storedText = sessionStorage.getItem("originalText");
    if (storedText && !state.textInput) {
      dispatch({ type: "SET_TEXT_INPUT", payload: storedText });
    }
  }, [toast, state.textInput]);

  // ============================================
  // تحديث حالة اكتمال التحليل
  // ============================================

  useEffect(() => {
    const isComplete = state.analysisReport.trim().length > MIN_TEXT_LENGTH;
    if (isComplete !== state.isAnalysisComplete && !state.analysisId) {
      dispatch({ type: "SET_ANALYSIS_COMPLETE", payload: isComplete });
    }
  }, [state.analysisReport, state.isAnalysisComplete, state.analysisId]);

  // ============================================
  // الإجراءات
  // ============================================

  /**
   * تحديد المهمة المختارة
   * يعيد ضبط الحالات المرتبطة عند التغيير
   */
  const handleTaskSelect = useCallback((task: CreativeTaskType) => {
    dispatch({ type: "SET_SELECTED_TASK", payload: task });
  }, []);

  /**
   * تبديل تحسين الإكمال
   */
  const handleToggleEnhancement = useCallback((enhancementId: CreativeTaskType) => {
    dispatch({ type: "TOGGLE_ENHANCEMENT", payload: enhancementId });
  }, []);

  /**
   * مسح بيانات التحليل
   */
  const clearAnalysisData = useCallback(() => {
    sessionStorage.removeItem("stationAnalysisResults");
    sessionStorage.removeItem("analysisId");
    sessionStorage.removeItem("originalText");
    dispatch({ type: "CLEAR_ANALYSIS_DATA" });
  }, []);

  /**
   * تحديث إعدادات الذكاء الاصطناعي
   */
  const updateAdvancedSettings = useCallback((settings: Partial<AdvancedAISettings>) => {
    dispatch({ type: "SET_ADVANCED_SETTINGS", payload: settings });
  }, []);

  /**
   * معالجة محتوى الملف المحمل
   */
  const handleFileContent = useCallback((content: string, _filename: string) => {
    dispatch({ type: "SET_TEXT_INPUT", payload: content });
    toast({
      title: "تم تحميل الملف",
      description: "تم استيراد محتوى الملف بنجاح",
    });
  }, [toast]);

  /**
   * إرسال الطلب للذكاء الاصطناعي
   * يتحقق من صحة المدخلات ويرسل الطلب
   */
  const handleSubmit = useCallback(async () => {
    // التحقق من صحة المدخلات
    const validationResult = submitInputSchema.safeParse({
      textInput: state.textInput,
      selectedTask: state.selectedTask,
      completionScope: state.completionScope,
    });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 
        "يرجى التحقق من المدخلات";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return;
    }

    if (!state.selectedTask || state.textInput.length < MIN_TEXT_LENGTH) {
      dispatch({
        type: "SET_ERROR",
        payload: "يرجى اختيار مهمة وإدخال نص لا يقل عن 100 حرف",
      });
      return;
    }

    if (
      TASKS_REQUIRING_COMPLETION_SCOPE.includes(state.selectedTask) &&
      !state.completionScope.trim()
    ) {
      dispatch({
        type: "SET_ERROR",
        payload: `لهذه المهمة (${CREATIVE_TASK_LABELS[state.selectedTask]}), يرجى تحديد "نطاق الإكمال المطلوب"`,
      });
      return;
    }

    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_AI_RESPONSE", payload: null });
    dispatch({ type: "SET_LOADING", payload: true });

    // بناء الطلب
    const processedFile: ProcessedInputFile = {
      fileName: "input.txt",
      textContent: state.textInput,
      size: state.textInput.length,
      sizeBytes: state.textInput.length,
    };

    const request: AIRequestData = {
      agent: state.selectedTask,
      prompt: state.specialRequirements,
      context: {
        files: [processedFile],
      },
      options: {
        additionalInfo: state.additionalInfo,
        analysisReport: state.analysisReport,
        analysisId: state.analysisId,
        completionScope: TASKS_REQUIRING_COMPLETION_SCOPE.includes(state.selectedTask)
          ? state.completionScope
          : undefined,
        selectedCompletionEnhancements:
          state.selectedTask === CreativeTaskType.COMPLETION
            ? state.selectedCompletionEnhancements
            : undefined,
      },
    };

    try {
      // TODO: استبدال بالاستدعاء الفعلي لـ API
      // const result = await submitTask(request);
      const result = await mockSubmitTask(request);

      if (result && typeof result === "object" && "text" in result) {
        dispatch({ type: "SET_AI_RESPONSE", payload: result as AIResponseData });
        toast({
          title: "تم التحليل بنجاح",
          description: "تم إكمال المهمة بنجاح",
        });
      } else {
        const errorMsg = typeof result === "string" ? result : "حدث خطأ غير متوقع";
        dispatch({ type: "SET_ERROR", payload: errorMsg });
        toast({
          variant: "destructive",
          title: "خطأ في التحليل",
          description: errorMsg,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "حدث خطأ غير متوقع أثناء الإرسال";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast({
        variant: "destructive",
        title: "خطأ في التحليل",
        description: errorMessage,
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state, toast]);

  /**
   * تصدير التقرير كملف نصي
   */
  const exportReport = useCallback(() => {
    if (!state.aiResponse) return;

    const blob = new Blob([toText(state.aiResponse.raw)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.selectedTask || "result"}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.aiResponse, state.selectedTask]);

  /**
   * عرض modal التقرير
   */
  const showReport = useCallback(() => {
    dispatch({
      type: "SET_SHOW_REPORT_MODAL",
      payload: state.selectedTask || "result",
    });
  }, [state.selectedTask]);

  /**
   * إغلاق modal التقرير
   */
  const closeReport = useCallback(() => {
    dispatch({ type: "SET_SHOW_REPORT_MODAL", payload: null });
  }, []);

  // ============================================
  // دوال المساعدة
  // ============================================

  /**
   * الحصول على تقرير الوكيل للعرض
   */
  const getAgentReport = useCallback(() => {
    if (!state.aiResponse) return null;

    return {
      agentName: state.selectedTask
        ? CREATIVE_TASK_LABELS[state.selectedTask]
        : "التقرير",
      agentId: state.selectedTask || "unknown",
      text: toText(state.aiResponse.raw),
      confidence: 1.0,
      timestamp: new Date().toISOString(),
    };
  }, [state.aiResponse, state.selectedTask]);

  // ============================================
  // القيم المرجعة
  // ============================================

  return {
    // الحالة
    ...state,

    // الثوابت
    creativeTasks: Object.keys(CREATIVE_TASK_LABELS) as CreativeTaskType[],
    taskLabels: CREATIVE_TASK_LABELS,
    tasksRequiringScope: TASKS_REQUIRING_COMPLETION_SCOPE,
    completionEnhancements: COMPLETION_ENHANCEMENT_OPTIONS,

    // تحديث المدخلات
    setTextInput: (value: string) => dispatch({ type: "SET_TEXT_INPUT", payload: value }),
    setSpecialRequirements: (value: string) => dispatch({ type: "SET_SPECIAL_REQUIREMENTS", payload: value }),
    setAdditionalInfo: (value: string) => dispatch({ type: "SET_ADDITIONAL_INFO", payload: value }),
    setCompletionScope: (value: string) => dispatch({ type: "SET_COMPLETION_SCOPE", payload: value }),
    setAnalysisReport: (value: string) => dispatch({ type: "SET_ANALYSIS_REPORT", payload: value }),

    // الإجراءات
    handleTaskSelect,
    handleToggleEnhancement,
    handleSubmit,
    handleFileContent,
    clearAnalysisData,
    updateAdvancedSettings,
    exportReport,
    showReport,
    closeReport,
    getAgentReport,
  };
}

// ============================================
// دالة وهمية للاختبار (ستُستبدل بالتنفيذ الفعلي)
// ============================================

/**
 * دالة وهمية لإرسال المهمة - للاختبار فقط
 * 
 * **تحذير**: هذه دالة مؤقتة للاختبار ولا تقوم بأي عمل فعلي
 * يجب استبدالها بالاستدعاء الفعلي لـ API قبل الإنتاج
 * 
 * @param _request - طلب الذكاء الاصطناعي (غير مستخدم حالياً)
 * @returns null دائماً - سيتم عرض رسالة خطأ للمستخدم
 * 
 * @todo استبدال هذه الدالة بـ submitTask الفعلية من orchestration/executor
 * @see الملف الأصلي: src/orchestration/executor.ts
 */
async function mockSubmitTask(_request: AIRequestData): Promise<AIResponseData | null> {
  // هذه الدالة مؤقتة للاختبار فقط
  // عند الاتصال بـ API الفعلي، استبدلها بـ:
  // return await submitTask(request);
  console.warn(
    "[تحذير] تم استدعاء mockSubmitTask - هذه دالة اختبار ولن تنتج نتائج فعلية"
  );
  return null;
}

export default useCreativeDevelopment;
