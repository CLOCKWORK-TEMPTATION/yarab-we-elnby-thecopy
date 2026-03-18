/**
 * @fileoverview Hook مخصص لإدارة أدوات أثناء التصوير
 *
 * هذا الـ Hook يوفر جميع الوظائف المطلوبة لمرحلة التصوير الفعلي
 * بما في ذلك تحليل اللقطات وإدارة الإعدادات التقنية.
 * يتضمن معالجة الأخطاء والتحقق من صحة البيانات.
 *
 * @module cinematography-studio/hooks/useProduction
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import type { VisualMood, ShotAnalysis } from "../types";
import { ShotAnalysisSchema } from "../types";

// ============================================
// واجهات الحالة الداخلية
// ============================================

/**
 * حالة تحليل اللقطة
 */
interface AnalysisState {
  /** حالة التحليل جارية */
  isAnalyzing: boolean;
  /** نتيجة التحليل */
  analysis: ShotAnalysis | null;
  /** رسالة الخطأ إن وجدت */
  error: string | null;
  /** سؤال المستخدم للمساعد */
  question: string;
}

/**
 * الإعدادات التقنية للكاميرا
 */
interface TechnicalSettings {
  /** Focus Peaking */
  focusPeaking: boolean;
  /** False Color */
  falseColor: boolean;
  /** درجة حرارة اللون بالكلفن */
  colorTemp: number;
}

// ============================================
// الثوابت
// ============================================

/**
 * الحالة الابتدائية للتحليل
 */
const initialAnalysisState: AnalysisState = {
  isAnalyzing: false,
  analysis: null,
  error: null,
  question: "",
};

/**
 * الإعدادات التقنية الافتراضية
 */
const defaultTechnicalSettings: TechnicalSettings = {
  focusPeaking: true,
  falseColor: false,
  colorTemp: 3200,
};

// ============================================
// الـ Hook الرئيسي
// ============================================

/**
 * Hook مخصص لإدارة أدوات أثناء التصوير
 *
 * يوفر هذا الـ Hook:
 * - تحليل اللقطات بالذكاء الاصطناعي
 * - إدارة الإعدادات التقنية للكاميرا
 * - نظام تحذيرات ذكي
 * - معالجة الأخطاء مع إشعارات Toast
 *
 * @example
 * ```tsx
 * const {
 *   analysis,
 *   isAnalyzing,
 *   handleAnalyzeShot,
 *   technicalSettings
 * } = useProduction("noir");
 * ```
 *
 * @param mood - المود البصري للمشروع
 * @returns كائن يحتوي على الحالة والدوال المساعدة
 */
export function useProduction(mood: VisualMood = "noir") {
  // ============================================
  // الحالة
  // ============================================

  const [analysisState, setAnalysisState] =
    useState<AnalysisState>(initialAnalysisState);
  const [technicalSettings, setTechnicalSettings] =
    useState<TechnicalSettings>(defaultTechnicalSettings);

  // ============================================
  // دوال التحليل
  // ============================================

  /**
   * تحليل اللقطة الحالية
   *
   * تقوم هذه الدالة بـ:
   * 1. بدء عملية التحليل
   * 2. محاكاة استدعاء API (سيتم استبداله)
   * 3. توليد نتائج التحليل
   * 4. معالجة الأخطاء وإظهار الإشعارات
   */
  const handleAnalyzeShot = useCallback(async () => {
    try {
      setAnalysisState((prev) => ({
        ...prev,
        isAnalyzing: true,
        error: null,
      }));

      toast.loading("جاري المسح الطيفي للقطة...", { id: "analyzing" });

      // محاكاة عملية التحليل
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // توليد نتائج التحليل بناءً على المود
      const analysis = generateAnalysisResult(mood);

      // التحقق من صحة النتيجة
      const validation = ShotAnalysisSchema.safeParse(analysis);
      if (!validation.success) {
        throw new Error("فشل في التحقق من نتائج التحليل");
      }

      setAnalysisState((prev) => ({
        ...prev,
        isAnalyzing: false,
        analysis: validation.data,
      }));

      // إظهار إشعار النجاح أو التحذير
      if (validation.data.issues.length > 0) {
        toast.success(
          `تم التحليل بنجاح - يوجد ${validation.data.issues.length} ملاحظة`,
          { id: "analyzing" }
        );
      } else {
        toast.success("اللقطة جاهزة للتصوير! 🎬", { id: "analyzing" });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحليل اللقطة";

      setAnalysisState((prev) => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
      }));

      toast.error(errorMessage, { id: "analyzing" });
    }
  }, [mood]);

  /**
   * تحديث سؤال المستخدم
   *
   * @param question - السؤال الجديد
   */
  const setQuestion = useCallback((question: string) => {
    setAnalysisState((prev) => ({
      ...prev,
      question,
    }));
  }, []);

  /**
   * إرسال سؤال للمساعد الذكي
   */
  const askAssistant = useCallback(async () => {
    const { question } = analysisState;

    if (!question.trim()) {
      toast.error("يرجى كتابة سؤالك أولاً");
      return;
    }

    try {
      toast.loading("جاري البحث عن إجابة...", { id: "assistant" });

      // محاكاة استدعاء API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("تم استلام السؤال - الإجابة قريباً", { id: "assistant" });

      // مسح السؤال بعد الإرسال
      setAnalysisState((prev) => ({
        ...prev,
        question: "",
      }));
    } catch (error) {
      toast.error("فشل في إرسال السؤال", { id: "assistant" });
    }
  }, [analysisState.question]);

  /**
   * إعادة تعيين حالة التحليل
   */
  const resetAnalysis = useCallback(() => {
    setAnalysisState(initialAnalysisState);
  }, []);

  // ============================================
  // دوال الإعدادات التقنية
  // ============================================

  /**
   * تبديل إعداد Focus Peaking
   */
  const toggleFocusPeaking = useCallback(() => {
    setTechnicalSettings((prev) => ({
      ...prev,
      focusPeaking: !prev.focusPeaking,
    }));
    toast.success(
      technicalSettings.focusPeaking
        ? "تم إيقاف Focus Peaking"
        : "تم تفعيل Focus Peaking"
    );
  }, [technicalSettings.focusPeaking]);

  /**
   * تبديل إعداد False Color
   */
  const toggleFalseColor = useCallback(() => {
    setTechnicalSettings((prev) => ({
      ...prev,
      falseColor: !prev.falseColor,
    }));
    toast.success(
      technicalSettings.falseColor
        ? "تم إيقاف False Color"
        : "تم تفعيل False Color"
    );
  }, [technicalSettings.falseColor]);

  /**
   * تحديث درجة حرارة اللون
   *
   * @param colorTemp - درجة الحرارة بالكلفن
   */
  const setColorTemp = useCallback((colorTemp: number) => {
    if (colorTemp >= 2000 && colorTemp <= 10000) {
      setTechnicalSettings((prev) => ({
        ...prev,
        colorTemp,
      }));
    }
  }, []);

  // ============================================
  // قيم محسوبة
  // ============================================

  /**
   * التحقق من وجود تحليل جاهز
   */
  const hasAnalysis = useMemo((): boolean => {
    return analysisState.analysis !== null;
  }, [analysisState.analysis]);

  /**
   * التحقق من وجود مشاكل في اللقطة
   */
  const hasIssues = useMemo((): boolean => {
    return (analysisState.analysis?.issues.length ?? 0) > 0;
  }, [analysisState.analysis]);

  /**
   * حالة الجاهزية للتصوير
   */
  const isReadyToShoot = useMemo((): boolean => {
    return hasAnalysis && !hasIssues;
  }, [hasAnalysis, hasIssues]);

  // ============================================
  // القيمة المُرجعة
  // ============================================

  return {
    // حالة التحليل
    analysis: analysisState.analysis,
    isAnalyzing: analysisState.isAnalyzing,
    error: analysisState.error,
    question: analysisState.question,

    // دوال التحليل
    handleAnalyzeShot,
    setQuestion,
    askAssistant,
    resetAnalysis,

    // الإعدادات التقنية
    technicalSettings,
    toggleFocusPeaking,
    toggleFalseColor,
    setColorTemp,

    // قيم محسوبة
    hasAnalysis,
    hasIssues,
    isReadyToShoot,
  };
}

// ============================================
// دوال مساعدة
// ============================================

/**
 * توليد نتيجة التحليل بناءً على المود
 *
 * @param mood - المود البصري
 * @returns نتيجة التحليل
 */
function generateAnalysisResult(mood: VisualMood): ShotAnalysis {
  // توليد نتائج مختلفة بناءً على المود
  const baseScore = 80 + Math.floor(Math.random() * 15);
  const exposure = 60 + Math.floor(Math.random() * 25);

  const dynamicRangeOptions = ["High", "Medium", "Low"];
  const grainOptions = [
    "Minimal (Digital)",
    "Moderate (Cinematic)",
    "Heavy (Film-like)",
  ];

  // توليد المشاكل بناءً على المود
  const issues: string[] = [];

  if (mood === "noir") {
    // النوار يحتاج إضاءة مظلمة - لا مشاكل عادة
    if (exposure > 75) {
      issues.push("الإضاءة ساطعة جداً للنوار - حاول تقليلها");
    }
  } else {
    // الأمواد الأخرى قد تحتاج تعديلات
    if (exposure < 50) {
      issues.push(
        "الإضاءة مظلمة جداً (تتناسب مع النوار ولكن تأكد من تفاصيل الوجه)"
      );
    }
  }

  return {
    score: baseScore,
    dynamicRange:
      dynamicRangeOptions[Math.floor(Math.random() * dynamicRangeOptions.length)] ??
      "High",
    grainLevel:
      grainOptions[Math.floor(Math.random() * grainOptions.length)] ??
      "Moderate (Cinematic)",
    issues,
    exposure,
  };
}

export default useProduction;
