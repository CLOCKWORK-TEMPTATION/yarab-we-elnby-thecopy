/**
 * @fileoverview Hook مخصص لإدارة أدوات ما بعد الإنتاج
 *
 * هذا الـ Hook يوفر جميع الوظائف المطلوبة لمرحلة ما بعد الإنتاج
 * بما في ذلك تدريج الألوان، المونتاج، وإعدادات التصدير.
 * يتضمن معالجة الأخطاء والتحقق من صحة البيانات.
 *
 * @module cinematography-studio/hooks/usePostProduction
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import type { VisualMood, ExportSettings } from "../types";
import { ColorTemperatureSchema, ColorPaletteSchema } from "../types";

// ============================================
// واجهات الحالة الداخلية
// ============================================

/**
 * نوع المشهد للتدريج اللوني
 */
type SceneType =
  | "morning"
  | "night"
  | "indoor"
  | "outdoor"
  | "happy"
  | "sad"
  | null;

/**
 * حالة تدريج الألوان
 */
interface ColorGradingState {
  /** نوع المشهد المحدد */
  sceneType: SceneType;
  /** درجة حرارة اللون بالكلفن */
  temperature: number;
  /** لوحة الألوان المولدة */
  colorPalette: string[];
  /** حالة التوليد جارية */
  isGenerating: boolean;
}

/**
 * حالة المونتاج
 */
interface EditorialState {
  /** ملاحظات المونتاج */
  notes: string;
  /** حالة التحليل جارية */
  isAnalyzing: boolean;
}

/**
 * حالة تحليل المشاهد
 */
interface FootageState {
  /** حالة الرفع جارية */
  isUploading: boolean;
  /** حالة التحليل */
  analysisStatus: {
    exposure: "pending" | "analyzing" | "complete";
    colorConsistency: "pending" | "analyzing" | "complete";
    focusQuality: "pending" | "analyzing" | "complete";
    motionBlur: "pending" | "analyzing" | "complete";
  };
}

// ============================================
// الثوابت
// ============================================

/**
 * درجة الحرارة الافتراضية
 */
const DEFAULT_TEMPERATURE = 5500;

/**
 * الحالة الابتدائية لتدريج الألوان
 */
const initialColorGradingState: ColorGradingState = {
  sceneType: null,
  temperature: DEFAULT_TEMPERATURE,
  colorPalette: [],
  isGenerating: false,
};

/**
 * الحالة الابتدائية للمونتاج
 */
const initialEditorialState: EditorialState = {
  notes: "",
  isAnalyzing: false,
};

/**
 * الحالة الابتدائية لتحليل المشاهد
 */
const initialFootageState: FootageState = {
  isUploading: false,
  analysisStatus: {
    exposure: "pending",
    colorConsistency: "pending",
    focusQuality: "pending",
    motionBlur: "pending",
  },
};

// ============================================
// الـ Hook الرئيسي
// ============================================

/**
 * Hook مخصص لإدارة أدوات ما بعد الإنتاج
 *
 * يوفر هذا الـ Hook:
 * - إدارة تدريج الألوان وتوليد لوحات الألوان
 * - تحليل إيقاع المونتاج
 * - تحليل المشاهد المصورة
 * - إعدادات التصدير والتسليم
 * - معالجة الأخطاء مع إشعارات Toast
 *
 * @example
 * ```tsx
 * const {
 *   colorPalette,
 *   generateColorPalette,
 *   temperature,
 *   setTemperature
 * } = usePostProduction("noir");
 * ```
 *
 * @param mood - المود البصري للمشروع
 * @returns كائن يحتوي على الحالة والدوال المساعدة
 */
export function usePostProduction(mood: VisualMood = "noir") {
  // ============================================
  // الحالة
  // ============================================

  const [colorGrading, setColorGrading] = useState<ColorGradingState>(
    initialColorGradingState
  );
  const [editorial, setEditorial] =
    useState<EditorialState>(initialEditorialState);
  const [footage, setFootage] = useState<FootageState>(initialFootageState);
  const [exportSettings, setExportSettings] = useState<ExportSettings | null>(
    null
  );

  // ============================================
  // دوال تدريج الألوان
  // ============================================

  /**
   * تحديث نوع المشهد
   *
   * @param sceneType - نوع المشهد الجديد
   */
  const setSceneType = useCallback((sceneType: SceneType) => {
    setColorGrading((prev) => ({
      ...prev,
      sceneType,
    }));
  }, []);

  /**
   * تحديث درجة حرارة اللون
   *
   * @param value - القيمة الجديدة
   */
  const setTemperature = useCallback((value: number[]) => {
    const temperature = value[0] ?? DEFAULT_TEMPERATURE;

    // التحقق من صحة القيمة
    const validation = ColorTemperatureSchema.safeParse(temperature);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message ?? "قيمة غير صالحة");
      return;
    }

    setColorGrading((prev) => ({
      ...prev,
      temperature,
    }));
  }, []);

  /**
   * توليد لوحة الألوان
   *
   * تقوم هذه الدالة بتوليد لوحة ألوان مناسبة بناءً على:
   * - المود البصري للمشروع
   * - نوع المشهد المحدد
   * - درجة حرارة اللون
   */
  const generateColorPalette = useCallback(async () => {
    try {
      setColorGrading((prev) => ({
        ...prev,
        isGenerating: true,
      }));

      toast.loading("جاري توليد لوحة الألوان...", { id: "palette" });

      // محاكاة عملية التوليد
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // توليد لوحة الألوان
      const palette = generatePaletteForMood(
        mood,
        colorGrading.sceneType,
        colorGrading.temperature
      );

      // التحقق من صحة اللوحة
      const validation = ColorPaletteSchema.safeParse(palette);
      if (!validation.success) {
        throw new Error("فشل في توليد لوحة الألوان");
      }

      setColorGrading((prev) => ({
        ...prev,
        isGenerating: false,
        colorPalette: validation.data,
      }));

      toast.success("تم توليد لوحة الألوان بنجاح!", { id: "palette" });
    } catch (error) {
      setColorGrading((prev) => ({
        ...prev,
        isGenerating: false,
      }));

      toast.error(
        error instanceof Error
          ? error.message
          : "فشل في توليد لوحة الألوان",
        { id: "palette" }
      );
    }
  }, [mood, colorGrading.sceneType, colorGrading.temperature]);

  // ============================================
  // دوال المونتاج
  // ============================================

  /**
   * تحديث ملاحظات المونتاج
   *
   * @param notes - الملاحظات الجديدة
   */
  const setEditorialNotes = useCallback((notes: string) => {
    setEditorial((prev) => ({
      ...prev,
      notes,
    }));
  }, []);

  /**
   * تحليل إيقاع المونتاج
   */
  const analyzeRhythm = useCallback(async () => {
    if (!editorial.notes.trim()) {
      toast.error("يرجى إدخال ملاحظات المونتاج أولاً");
      return;
    }

    try {
      setEditorial((prev) => ({
        ...prev,
        isAnalyzing: true,
      }));

      toast.loading("جاري تحليل الإيقاع...", { id: "rhythm" });

      // محاكاة عملية التحليل
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("تم تحليل الإيقاع بنجاح!", { id: "rhythm" });

      setEditorial((prev) => ({
        ...prev,
        isAnalyzing: false,
      }));
    } catch (error) {
      setEditorial((prev) => ({
        ...prev,
        isAnalyzing: false,
      }));

      toast.error("فشل في تحليل الإيقاع", { id: "rhythm" });
    }
  }, [editorial.notes]);

  // ============================================
  // دوال تحليل المشاهد
  // ============================================

  /**
   * رفع فيديو للتحليل
   */
  const uploadFootage = useCallback(async () => {
    try {
      setFootage((prev) => ({
        ...prev,
        isUploading: true,
      }));

      toast.loading("جاري رفع الفيديو...", { id: "upload" });

      // محاكاة عملية الرفع
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("تم رفع الفيديو بنجاح!", { id: "upload" });

      // بدء التحليل
      await analyzeFootage();
    } catch (error) {
      toast.error("فشل في رفع الفيديو", { id: "upload" });
    } finally {
      setFootage((prev) => ({
        ...prev,
        isUploading: false,
      }));
    }
  }, []);

  /**
   * تحليل المشاهد المرفوعة
   */
  const analyzeFootage = useCallback(async () => {
    const updateStatus = async (
      key: keyof FootageState["analysisStatus"],
      delay: number
    ) => {
      setFootage((prev) => ({
        ...prev,
        analysisStatus: {
          ...prev.analysisStatus,
          [key]: "analyzing",
        },
      }));

      await new Promise((resolve) => setTimeout(resolve, delay));

      setFootage((prev) => ({
        ...prev,
        analysisStatus: {
          ...prev.analysisStatus,
          [key]: "complete",
        },
      }));
    };

    try {
      toast.loading("جاري تحليل المشاهد...", { id: "analysis" });

      // تحليل كل جانب بالتتابع
      await updateStatus("exposure", 800);
      await updateStatus("colorConsistency", 600);
      await updateStatus("focusQuality", 700);
      await updateStatus("motionBlur", 500);

      toast.success("اكتمل التحليل!", { id: "analysis" });
    } catch (error) {
      toast.error("فشل في تحليل المشاهد", { id: "analysis" });
    }
  }, []);

  // ============================================
  // دوال التصدير
  // ============================================

  /**
   * إنشاء إعدادات التصدير
   *
   * @param platform - المنصة المستهدفة
   */
  const createExportSettings = useCallback(
    (platform: ExportSettings["platform"]) => {
      const settings = getExportSettingsForPlatform(platform);
      setExportSettings(settings);
      toast.success(`تم إنشاء إعدادات التصدير لـ ${settings.platform}`);
    },
    []
  );

  // ============================================
  // قيم محسوبة
  // ============================================

  /**
   * التحقق من وجود لوحة ألوان
   */
  const hasColorPalette = useMemo((): boolean => {
    return colorGrading.colorPalette.length > 0;
  }, [colorGrading.colorPalette]);

  /**
   * التحقق من اكتمال تحليل المشاهد
   */
  const isFootageAnalysisComplete = useMemo((): boolean => {
    const { analysisStatus } = footage;
    return Object.values(analysisStatus).every(
      (status) => status === "complete"
    );
  }, [footage.analysisStatus]);

  /**
   * قيمة درجة الحرارة للعرض
   */
  const temperatureValue = useMemo(
    () => [colorGrading.temperature],
    [colorGrading.temperature]
  );

  // ============================================
  // القيمة المُرجعة
  // ============================================

  return {
    // تدريج الألوان
    sceneType: colorGrading.sceneType,
    temperature: colorGrading.temperature,
    temperatureValue,
    colorPalette: colorGrading.colorPalette,
    isGeneratingPalette: colorGrading.isGenerating,
    setSceneType,
    setTemperature,
    generateColorPalette,
    hasColorPalette,

    // المونتاج
    editorialNotes: editorial.notes,
    isAnalyzingRhythm: editorial.isAnalyzing,
    setEditorialNotes,
    analyzeRhythm,

    // تحليل المشاهد
    isUploadingFootage: footage.isUploading,
    footageAnalysisStatus: footage.analysisStatus,
    uploadFootage,
    isFootageAnalysisComplete,

    // التصدير
    exportSettings,
    createExportSettings,
  };
}

// ============================================
// دوال مساعدة
// ============================================

/**
 * توليد لوحة ألوان بناءً على المود ونوع المشهد
 */
function generatePaletteForMood(
  mood: VisualMood,
  sceneType: SceneType,
  temperature: number
): string[] {
  // لوحات ألوان مسبقة التعريف حسب المود
  const moodPalettes: Record<VisualMood, string[]> = {
    noir: ["#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560"],
    realistic: ["#f5f5f5", "#e8e8e8", "#d4d4d4", "#a3a3a3", "#737373"],
    surreal: ["#ff006e", "#8338ec", "#3a86ff", "#06ffa0", "#ffbe0b"],
    vintage: ["#d4a574", "#c4956a", "#b4865f", "#a47755", "#94684a"],
  };

  // تعديل اللوحة بناءً على نوع المشهد ودرجة الحرارة
  let basePalette = moodPalettes[mood];

  // تعديل الألوان بناءً على درجة الحرارة
  if (temperature < 4000) {
    // ألوان أكثر دفئاً
    basePalette = basePalette.map((color) => warmShift(color));
  } else if (temperature > 7000) {
    // ألوان أكثر برودة
    basePalette = basePalette.map((color) => coolShift(color));
  }

  return basePalette;
}

/**
 * تحويل اللون نحو الدفء
 */
function warmShift(hex: string): string {
  // تبسيط: إضافة لمسة برتقالية
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.min(255, r + 20);
  const newB = Math.max(0, b - 15);

  return `#${newR.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

/**
 * تحويل اللون نحو البرودة
 */
function coolShift(hex: string): string {
  // تبسيط: إضافة لمسة زرقاء
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.max(0, r - 15);
  const newB = Math.min(255, b + 20);

  return `#${newR.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

/**
 * الحصول على إعدادات التصدير للمنصة
 */
function getExportSettingsForPlatform(
  platform: ExportSettings["platform"]
): ExportSettings {
  const settingsMap: Record<ExportSettings["platform"], ExportSettings> = {
    "cinema-dcp": {
      platform: "cinema-dcp",
      resolution: "4096x2160",
      frameRate: 24,
      codec: "JPEG2000",
    },
    "broadcast-hd": {
      platform: "broadcast-hd",
      resolution: "1920x1080",
      frameRate: 25,
      codec: "ProRes 422",
    },
    "web-social": {
      platform: "web-social",
      resolution: "1920x1080",
      frameRate: 30,
      codec: "H.264",
    },
    bluray: {
      platform: "bluray",
      resolution: "1920x1080",
      frameRate: 24,
      codec: "H.264 High Profile",
    },
  };

  return settingsMap[platform];
}

export default usePostProduction;
