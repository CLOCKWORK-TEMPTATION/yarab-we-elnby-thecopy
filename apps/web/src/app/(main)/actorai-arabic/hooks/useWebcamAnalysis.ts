/**
 * @fileoverview خطاف تحليل الأداء البصري بالكاميرا
 * يدير منطق الكاميرا والتحليل البصري للممثل
 * @reason فصل المنطق المعقد للكاميرا والتحليل إلى خطاف مستقل
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { WebcamAnalysisResult, WebcamSession, BlinkRateStatus, EyeDirection } from "../types";

/**
 * حالة إذن الكاميرا
 */
export type WebcamPermission = "granted" | "denied" | "pending";

/**
 * حالة الكاميرا والتحليل
 */
export interface WebcamState {
  /** هل الكاميرا نشطة */
  isActive: boolean;
  /** هل التحليل جارٍ */
  isAnalyzing: boolean;
  /** وقت التحليل بالثواني */
  analysisTime: number;
  /** نتيجة التحليل الأخيرة */
  analysisResult: WebcamAnalysisResult | null;
  /** سجل الجلسات السابقة */
  sessions: WebcamSession[];
  /** حالة إذن الكاميرا */
  permission: WebcamPermission;
}

/**
 * واجهة قيمة العودة من خطاف الكاميرا
 */
export interface UseWebcamAnalysisReturn {
  /** حالة الكاميرا والتحليل */
  state: WebcamState;
  /** مرجع عنصر الفيديو */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** مرجع عنصر Canvas */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** طلب إذن الكاميرا وتفعيلها */
  requestPermission: () => Promise<void>;
  /** إيقاف الكاميرا */
  stopWebcam: () => void;
  /** بدء التحليل البصري */
  startAnalysis: () => { success: boolean; error?: string };
  /** إيقاف التحليل وعرض النتائج */
  stopAnalysis: () => WebcamAnalysisResult | null;
  /** الحصول على نص حالة معدل الرمش */
  getBlinkStatusText: (status: BlinkRateStatus) => string;
  /** الحصول على لون حالة معدل الرمش */
  getBlinkStatusColor: (status: BlinkRateStatus) => string;
  /** ترجمة اتجاه النظر */
  getEyeDirectionText: (direction: EyeDirection) => string;
  /** مسح سجل الجلسات */
  clearSessions: () => void;
}

/**
 * البيانات التجريبية للجلسات السابقة
 */
const INITIAL_SESSIONS: WebcamSession[] = [
  {
    id: "1",
    date: "2025-10-30",
    duration: "5:30",
    score: 78,
    alerts: ["نظرت للأسفل 4 مرات", "معدل رمش مرتفع"],
  },
  {
    id: "2",
    date: "2025-10-29",
    duration: "3:45",
    score: 85,
    alerts: ["استخدام جيد للمساحة"],
  },
];

/**
 * خطاف إدارة تحليل الأداء البصري
 * @description يدير كل منطق الكاميرا والتحليل البصري بما في ذلك:
 * - طلب إذن الكاميرا
 * - تشغيل وإيقاف البث
 * - تحليل اتجاه النظر والتعبيرات
 * - تتبع معدل الرمش والتوتر
 * - حفظ سجل الجلسات
 * 
 * @example
 * ```tsx
 * const {
 *   state,
 *   videoRef,
 *   requestPermission,
 *   startAnalysis
 * } = useWebcamAnalysis();
 * 
 * // في المكون
 * <video ref={videoRef} autoPlay muted />
 * <button onClick={requestPermission}>تفعيل الكاميرا</button>
 * ```
 */
export function useWebcamAnalysis(): UseWebcamAnalysisReturn {
  // الحالة
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisTime, setAnalysisTime] = useState(0);
  const [analysisResult, setAnalysisResult] =
    useState<WebcamAnalysisResult | null>(null);
  const [sessions, setSessions] = useState<WebcamSession[]>(INITIAL_SESSIONS);
  const [permission, setPermission] = useState<WebcamPermission>("pending");

  // المراجع
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * مؤقت التحليل
   */
  useEffect(() => {
    if (isAnalyzing) {
      timerIntervalRef.current = setInterval(() => {
        setAnalysisTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isAnalyzing]);

  /**
   * طلب إذن الكاميرا وتفعيلها
   */
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermission("granted");
      setIsActive(true);
    } catch {
      setPermission("denied");
      throw new Error("لم يتم السماح بالوصول للكاميرا");
    }
  }, []);

  /**
   * إيقاف الكاميرا
   */
  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsAnalyzing(false);
    setAnalysisTime(0);
  }, []);

  /**
   * بدء التحليل البصري
   */
  const startAnalysis = useCallback((): { success: boolean; error?: string } => {
    if (!isActive) {
      return { success: false, error: "يرجى تفعيل الكاميرا أولاً" };
    }
    setIsAnalyzing(true);
    setAnalysisTime(0);
    setAnalysisResult(null);
    return { success: true };
  }, [isActive]);

  /**
   * إيقاف التحليل وعرض النتائج
   */
  const stopAnalysis = useCallback((): WebcamAnalysisResult | null => {
    setIsAnalyzing(false);

    const minutes = Math.floor(analysisTime / 60);
    const seconds = analysisTime % 60;
    const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    // محاكاة نتائج التحليل (في التطبيق الحقيقي سيكون هناك تحليل فعلي)
    const directions: EyeDirection[] = ["center", "audience", "down", "up"];
    const mockResult: WebcamAnalysisResult = {
      eyeLine: {
        direction:
          directions[Math.floor(Math.random() * directions.length)] ?? "center",
        consistency: Math.floor(Math.random() * 30) + 60,
        alerts:
          Math.random() > 0.5
            ? ["نظرت للأسفل 3 مرات متتالية", "تجنب كثرة النظر للجانب"]
            : [],
      },
      expressionSync: {
        score: Math.floor(Math.random() * 25) + 70,
        matchedEmotions: ["حزن", "أمل", "شوق"],
        mismatches:
          Math.random() > 0.6 ? ["لحظة الفرح لم تظهر بوضوح"] : [],
      },
      blinkRate: {
        rate: Math.floor(Math.random() * 10) + 12,
        status: Math.random() > 0.7 ? "high" : "normal",
        tensionIndicator: Math.floor(Math.random() * 40) + 20,
      },
      blocking: {
        spaceUsage: Math.floor(Math.random() * 30) + 50,
        movements: [
          "حركة للأمام عند الذروة العاطفية",
          "تراجع خفيف عند التردد",
        ],
        suggestions: [
          "استخدم المساحة الجانبية أكثر",
          "أضف حركات يد تعبيرية",
        ],
      },
      alerts: [
        "نظرت للأسفل كثيراً في الدقيقة الأولى",
        "معدل الرمش طبيعي",
        "استخدام جيد لتعبيرات الوجه",
      ],
      overallScore: Math.floor(Math.random() * 20) + 75,
      timestamp: new Date().toISOString(),
    };

    setAnalysisResult(mockResult);

    // حفظ الجلسة
    const newSession: WebcamSession = {
      id: Date.now().toString(),
      date:
        new Date().toISOString().split("T")[0] ??
        new Date().toLocaleDateString(),
      duration,
      score: mockResult.overallScore,
      alerts: mockResult.alerts.slice(0, 2),
    };

    setSessions((prev) => [newSession, ...prev]);

    return mockResult;
  }, [analysisTime]);

  /**
   * الحصول على نص حالة معدل الرمش
   */
  const getBlinkStatusText = useCallback((status: BlinkRateStatus): string => {
    switch (status) {
      case "high":
        return "مرتفع (قد يدل على توتر)";
      case "low":
        return "منخفض (تركيز عالي)";
      default:
        return "طبيعي";
    }
  }, []);

  /**
   * الحصول على لون حالة معدل الرمش
   */
  const getBlinkStatusColor = useCallback((status: BlinkRateStatus): string => {
    switch (status) {
      case "high":
        return "text-orange-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-green-600";
    }
  }, []);

  /**
   * ترجمة اتجاه النظر
   */
  const getEyeDirectionText = useCallback((direction: EyeDirection): string => {
    const directions: Record<EyeDirection, string> = {
      up: "للأعلى",
      down: "للأسفل",
      left: "لليسار",
      right: "لليمين",
      center: "للمركز",
      audience: "للجمهور",
    };
    return directions[direction] || direction;
  }, []);

  /**
   * مسح سجل الجلسات
   */
  const clearSessions = useCallback(() => {
    setSessions([]);
  }, []);

  // تجميع الحالة
  const state: WebcamState = {
    isActive,
    isAnalyzing,
    analysisTime,
    analysisResult,
    sessions,
    permission,
  };

  return {
    state,
    videoRef,
    canvasRef,
    requestPermission,
    stopWebcam,
    startAnalysis,
    stopAnalysis,
    getBlinkStatusText,
    getBlinkStatusColor,
    getEyeDirectionText,
    clearSessions,
  };
}

export default useWebcamAnalysis;
