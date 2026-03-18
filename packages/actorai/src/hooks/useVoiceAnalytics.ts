"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ==================== أنواع البيانات ====================

export interface VoiceMetrics {
  // طبقة الصوت (Pitch)
  pitch: {
    value: number; // Hz
    level: "low" | "medium" | "high";
    label: string;
  };
  // شدة الصوت (Volume)
  volume: {
    value: number; // dB
    level: "quiet" | "normal" | "loud";
    label: string;
  };
  // سرعة الكلام (WPM)
  speechRate: {
    wpm: number;
    level: "slow" | "normal" | "fast";
    warning: string | null;
  };
  // وضوح المخارج (Articulation)
  articulation: {
    score: number; // 0-100
    level: "poor" | "fair" | "good" | "excellent";
    label: string;
  };
  // نمط التنفس
  breathing: {
    isBreathing: boolean;
    breathCount: number;
    warning: string | null;
    lastBreathTime: number;
  };
  // الوقفات الدرامية
  pauses: {
    count: number;
    averageDuration: number;
    isEffective: boolean;
    feedback: string;
  };
}

export interface VoiceAnalyticsState {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  metrics: VoiceMetrics;
  waveformData: number[];
  frequencyData: number[];
  history: VoiceMetrics[];
}

const DEFAULT_METRICS: VoiceMetrics = {
  pitch: { value: 0, level: "medium", label: "متوسط" },
  volume: { value: 0, level: "normal", label: "عادي" },
  speechRate: { wpm: 0, level: "normal", warning: null },
  articulation: { score: 0, level: "fair", label: "جيد" },
  breathing: { isBreathing: false, breathCount: 0, warning: null, lastBreathTime: 0 },
  pauses: { count: 0, averageDuration: 0, isEffective: true, feedback: "" },
};

// ==================== دوال التحليل ====================

// تحويل التردد إلى طبقة الصوت
function analyzePitch(frequency: number): VoiceMetrics["pitch"] {
  if (frequency === 0) {
    return { value: 0, level: "medium", label: "لا يوجد صوت" };
  }

  if (frequency < 150) {
    return { value: frequency, level: "low", label: "منخفض" };
  } else if (frequency < 300) {
    return { value: frequency, level: "medium", label: "متوسط" };
  } else {
    return { value: frequency, level: "high", label: "مرتفع" };
  }
}

// تحليل مستوى الصوت
function analyzeVolume(decibels: number): VoiceMetrics["volume"] {
  if (decibels < -50) {
    return { value: decibels, level: "quiet", label: "هادئ" };
  } else if (decibels < -20) {
    return { value: decibels, level: "normal", label: "عادي" };
  } else {
    return { value: decibels, level: "loud", label: "مرتفع" };
  }
}

// تحليل سرعة الكلام
function analyzeSpeechRate(wpm: number): VoiceMetrics["speechRate"] {
  if (wpm < 100) {
    return { wpm, level: "slow", warning: "سرعتك بطيئة، حاول زيادة الإيقاع قليلاً" };
  } else if (wpm > 180) {
    return { wpm, level: "fast", warning: "⚠️ أنت تتحدث بسرعة! أبطئ لتحسين الوضوح" };
  } else {
    return { wpm, level: "normal", warning: null };
  }
}

// تحليل وضوح المخارج
function analyzeArticulation(clarity: number): VoiceMetrics["articulation"] {
  const score = Math.min(100, Math.max(0, clarity));

  if (score < 40) {
    return { score, level: "poor", label: "ضعيف - ركز على وضوح الحروف" };
  } else if (score < 60) {
    return { score, level: "fair", label: "مقبول - يمكن تحسينه" };
  } else if (score < 80) {
    return { score, level: "good", label: "جيد - استمر!" };
  } else {
    return { score, level: "excellent", label: "ممتاز! 🌟" };
  }
}

// خوارزمية بسيطة للكشف عن تردد الصوت الأساسي (autocorrelation)
function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;
  const correlations = new Array(MAX_SAMPLES);

  // حساب RMS لتحديد إذا كان هناك صوت
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i] ?? 0;
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // إذا كان الصوت ضعيفاً جداً، لا يوجد طبقة صوت
  if (rms < 0.01) return 0;

  let lastCorrelation = 1;
  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    for (let i = 0; i < MAX_SAMPLES; i++) {
      const val1 = buffer[i] ?? 0;
      const val2 = buffer[i + offset] ?? 0;
      correlation += Math.abs(val1 - val2);
    }
    correlation = 1 - correlation / MAX_SAMPLES;
    correlations[offset] = correlation;

    if (correlation > 0.9 && correlation > lastCorrelation) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
      const shift =
        (correlations[bestOffset + 1] - correlations[bestOffset - 1]) /
        correlations[bestOffset];
      return sampleRate / (bestOffset + 8 * shift);
    }
    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.01) {
    return sampleRate / bestOffset;
  }
  return 0;
}

// ==================== الـ Hook الرئيسي ====================

export function useVoiceAnalytics() {
  const [state, setState] = useState<VoiceAnalyticsState>({
    isListening: false,
    isSupported: typeof window !== "undefined" && !!navigator.mediaDevices,
    error: null,
    metrics: DEFAULT_METRICS,
    waveformData: [],
    frequencyData: [],
    history: [],
  });

  // مراجع للصوت
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // مراجع للتتبع
  const silenceStartRef = useRef<number>(0);
  const pauseCountRef = useRef<number>(0);
  const pauseDurationsRef = useRef<number[]>([]);
  const wordCountRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);
  const breathCountRef = useRef<number>(0);
  const lastBreathTimeRef = useRef<number>(0);

  // تحديث المقاييس
  const updateMetrics = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    const frequencyArray = new Uint8Array(analyser.frequencyBinCount);

    analyser.getFloatTimeDomainData(dataArray);
    analyser.getByteFrequencyData(frequencyArray);

    // حساب مستوى الصوت (RMS to dB)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const val = dataArray[i] ?? 0;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / bufferLength);
    const decibels = 20 * Math.log10(rms + 0.0001);

    // الكشف عن تردد الصوت
    const frequency = detectPitch(dataArray, audioContextRef.current.sampleRate);

    // الكشف عن الصمت والوقفات
    const now = Date.now();
    const isSilent = rms < 0.01;

    if (isSilent) {
      if (silenceStartRef.current === 0) {
        silenceStartRef.current = now;
      }

      const silenceDuration = now - silenceStartRef.current;

      // الكشف عن التنفس (صمت قصير بين 300-800ms)
      if (silenceDuration > 300 && silenceDuration < 800 && lastBreathTimeRef.current + 2000 < now) {
        breathCountRef.current++;
        lastBreathTimeRef.current = now;
      }

      // الكشف عن الوقفات الدرامية (أكثر من 500ms)
      if (silenceDuration > 500 && lastSpeechTimeRef.current > 0) {
        if (pauseDurationsRef.current[pauseDurationsRef.current.length - 1] !== silenceDuration) {
          pauseCountRef.current++;
          pauseDurationsRef.current.push(silenceDuration);
        }
      }
    } else {
      silenceStartRef.current = 0;
      lastSpeechTimeRef.current = now;

      // تقدير عدد الكلمات (تقريبي)
      if (frequency > 80) {
        wordCountRef.current += 0.05; // تقدير تقريبي
      }
    }

    // حساب سرعة الكلام
    const elapsedMinutes = (now - startTimeRef.current) / 60000;
    const wpm = elapsedMinutes > 0 ? Math.round(wordCountRef.current / elapsedMinutes) : 0;

    // حساب متوسط مدة الوقفات
    const avgPauseDuration =
      pauseDurationsRef.current.length > 0
        ? pauseDurationsRef.current.reduce((a, b) => a + b, 0) / pauseDurationsRef.current.length
        : 0;

    // تحديد فعالية الوقفات
    const pausesFeedback = avgPauseDuration > 2000
      ? "الوقفات طويلة جداً، حاول تقصيرها"
      : avgPauseDuration > 500
      ? "وقفات درامية جيدة! 👍"
      : "أضف وقفات درامية لتعزيز المعنى";

    // تنبيه التنفس
    const breathingWarning =
      now - lastBreathTimeRef.current > 15000 && rms > 0.01
        ? "⚠️ تذكر أن تتنفس! لا تحبس نفسك"
        : null;

    // حساب وضوح المخارج (تقدير بناءً على spectral clarity)
    const spectralSum = frequencyArray.reduce((a, b) => a + b, 0);
    const spectralAvg = spectralSum / frequencyArray.length;
    const articulationScore = Math.min(100, (spectralAvg / 128) * 100);

    // تحديث الحالة
    setState((prev) => ({
      ...prev,
      metrics: {
        pitch: analyzePitch(frequency),
        volume: analyzeVolume(decibels),
        speechRate: analyzeSpeechRate(wpm),
        articulation: analyzeArticulation(articulationScore),
        breathing: {
          isBreathing: isSilent && (now - silenceStartRef.current) > 300,
          breathCount: breathCountRef.current,
          warning: breathingWarning,
          lastBreathTime: lastBreathTimeRef.current,
        },
        pauses: {
          count: pauseCountRef.current,
          averageDuration: avgPauseDuration,
          isEffective: avgPauseDuration > 400 && avgPauseDuration < 2500,
          feedback: pausesFeedback,
        },
      },
      waveformData: Array.from(dataArray.slice(0, 128)),
      frequencyData: Array.from(frequencyArray.slice(0, 64)),
    }));

    // استمرار التحليل
    animationFrameRef.current = requestAnimationFrame(updateMetrics);
  }, []);

  // بدء الاستماع
  const startListening = useCallback(async () => {
    try {
      // إعادة تعيين المتتبعات
      silenceStartRef.current = 0;
      pauseCountRef.current = 0;
      pauseDurationsRef.current = [];
      wordCountRef.current = 0;
      startTimeRef.current = Date.now();
      lastSpeechTimeRef.current = 0;
      breathCountRef.current = 0;
      lastBreathTimeRef.current = Date.now();

      // الحصول على إذن الميكروفون
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // إنشاء سياق الصوت
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // إنشاء المحلل
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // توصيل الميكروفون بالمحلل
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setState((prev) => ({
        ...prev,
        isListening: true,
        error: null,
      }));

      // بدء التحليل
      updateMetrics();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "فشل الوصول للميكروفون",
      }));
    }
  }, [updateMetrics]);

  // إيقاف الاستماع
  const stopListening = useCallback(() => {
    // إيقاف التحليل
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // إغلاق سياق الصوت
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // إيقاف البث
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // حفظ المقاييس في التاريخ
    setState((prev) => ({
      ...prev,
      isListening: false,
      history: [...prev.history, prev.metrics],
    }));
  }, []);

  // إعادة التعيين
  const reset = useCallback(() => {
    stopListening();
    setState({
      isListening: false,
      isSupported: typeof window !== "undefined" && !!navigator.mediaDevices,
      error: null,
      metrics: DEFAULT_METRICS,
      waveformData: [],
      frequencyData: [],
      history: [],
    });
  }, [stopListening]);

  // تنظيف عند إزالة المكون
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    reset,
  };
}

export default useVoiceAnalytics;
