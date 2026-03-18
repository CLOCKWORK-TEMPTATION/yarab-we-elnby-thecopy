/**
 * @module useBrainStormSession
 * @description هوك مخصص لإدارة جلسات العصف الذهني
 * يوفر واجهة موحدة للتحكم بدورة حياة الجلسة من الإنشاء حتى الإنهاء
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  getAgentsForPhase,
  type BrainstormAgentDefinition,
  type BrainstormPhase,
} from "@/lib/drama-analyst/services/brainstormAgentRegistry";
import type {
  Session,
  BrainStormSessionState,
  SessionResult,
} from "../types/session.types";

/**
 * المهام المرتبطة بكل مرحلة من مراحل العصف الذهني
 * تُستخدم لتوجيه النقاش بين الوكلاء في كل مرحلة
 */
const PHASE_TASKS: Record<BrainstormPhase, (brief: string) => string> = {
  1: (brief) => `التحليل الأولي للبريف: ${brief}`,
  2: (brief) => `التوسع الإبداعي: ${brief}`,
  3: (brief) => `التحقق والتدقيق: ${brief}`,
  4: (brief) => `النقاش والتوافق: ${brief}`,
  5: (brief) => `التقييم النهائي: ${brief}`,
};

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
 * الحصول على رسالة خطأ مناسبة بناءً على كود الحالة HTTP
 * @param status - كود حالة HTTP
 * @returns رسالة خطأ مناسبة باللغة العربية
 */
function getErrorMessage(status: number): string {
  return ERROR_MESSAGES[status] ?? `خطأ في الخادم: ${status}`;
}

/**
 * استخراج رسالة الخطأ من أي نوع خطأ
 * @param error - الخطأ المُلتقط
 * @param fallback - رسالة افتراضية عند فشل الاستخراج
 * @returns رسالة الخطأ النصية
 */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

/**
 * @interface UseBrainStormSessionOptions
 * @description خيارات تهيئة هوك جلسة العصف الذهني
 */
interface UseBrainStormSessionOptions {
  /** الحالة الأولية للمرحلة النشطة */
  initialPhase?: BrainstormPhase;
  /** معالج خارجي للأخطاء */
  onError?: (error: string) => void;
  /** معالج عند اكتمال الجلسة */
  onSessionComplete?: (result: SessionResult) => void;
}

/**
 * @interface UseBrainStormSessionReturn
 * @description القيم المُرجعة من هوك جلسة العصف الذهني
 */
interface UseBrainStormSessionReturn extends BrainStormSessionState {
  /** بدء جلسة جديدة */
  startSession: (brief: string) => Promise<void>;
  /** إيقاف الجلسة الحالية */
  stopSession: () => void;
  /** الانتقال للمرحلة التالية */
  advancePhase: () => Promise<void>;
  /** تعيين المرحلة النشطة يدوياً */
  setActivePhase: (phase: BrainstormPhase) => void;
  /** الوكلاء المتاحين للمرحلة الحالية */
  phaseAgents: readonly BrainstormAgentDefinition[];
  /** مهمة المرحلة الحالية */
  currentPhaseTask: string | null;
}

/**
 * @function useBrainStormSession
 * @description هوك مخصص لإدارة جلسات العصف الذهني
 * 
 * يوفر هذا الهوك واجهة موحدة للتعامل مع:
 * - إنشاء وإيقاف الجلسات
 * - التنقل بين المراحل
 * - معالجة الأخطاء بشكل موحد
 * - التواصل مع API الخادم
 * 
 * @param options - خيارات تهيئة الهوك
 * @returns كائن يحتوي على الحالة ودوال التحكم
 * 
 * @example
 * ```tsx
 * const {
 *   currentSession,
 *   isLoading,
 *   error,
 *   startSession,
 *   stopSession,
 *   advancePhase
 * } = useBrainStormSession({
 *   onError: (msg) => toast.error(msg)
 * });
 * ```
 */
export function useBrainStormSession(
  options: UseBrainStormSessionOptions = {}
): UseBrainStormSessionReturn {
  const { initialPhase = 1, onError, onSessionComplete } = options;

  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [activePhase, setActivePhase] = useState<BrainstormPhase>(initialPhase);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** الوكلاء المتاحين للمرحلة النشطة الحالية */
  const phaseAgents = useMemo(
    () => getAgentsForPhase(activePhase),
    [activePhase]
  );

  /** مهمة المرحلة الحالية بناءً على ملخص الجلسة */
  const currentPhaseTask = useMemo(() => {
    if (!currentSession) return null;
    return PHASE_TASKS[activePhase](currentSession.brief);
  }, [currentSession, activePhase]);

  /**
   * تنفيذ نقاش بين الوكلاء عبر API الخادم
   * @param agents - قائمة الوكلاء المشاركين في النقاش
   * @param session - الجلسة الحالية
   * @param task - المهمة المطلوب تنفيذها (اختياري)
   */
  const executeAgentDebate = useCallback(
    async (
      agents: readonly BrainstormAgentDefinition[],
      session: Session,
      task?: string
    ): Promise<SessionResult | null> => {
      const agentIds = agents.map((a) => a.id);
      const debateTask = task ?? PHASE_TASKS[session.phase](session.brief);

      try {
        const response = await fetch("/api/brainstorm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: debateTask,
            context: {
              brief: session.brief,
              phase: session.phase,
              sessionId: session.id,
            },
            agentIds,
          }),
        });

        if (!response.ok) {
          throw new Error(getErrorMessage(response.status));
        }

        const { result } = await response.json();
        return result as SessionResult;
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "فشل في تنفيذ النقاش");
        setError(errorMessage);
        onError?.(errorMessage);
        return null;
      }
    },
    [onError]
  );

  /**
   * بدء جلسة عصف ذهني جديدة
   * @param brief - ملخص الفكرة الإبداعية
   */
  const startSession = useCallback(
    async (brief: string) => {
      if (!brief.trim()) {
        const errorMsg =
          "⚠️ يرجى إدخال ملخص الفكرة الإبداعية أو رفع ملف (PDF, DOCX, TXT)";
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      setIsLoading(true);
      setError(null);

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

        const result = await executeAgentDebate(phaseAgents, newSession);
        if (result) {
          setCurrentSession((prev) =>
            prev ? { ...prev, results: result } : null
          );
        }
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "فشل في إنشاء الجلسة");
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [phaseAgents, executeAgentDebate, onError]
  );

  /**
   * إيقاف الجلسة الحالية وإعادة تعيين الحالة
   */
  const stopSession = useCallback(() => {
    setCurrentSession(null);
    setActivePhase(1);
    setError(null);
  }, []);

  /**
   * الانتقال إلى المرحلة التالية من العصف الذهني
   */
  const advancePhase = useCallback(async () => {
    if (!currentSession) return;

    const nextPhase = Math.min(activePhase + 1, 5) as BrainstormPhase;
    setActivePhase(nextPhase);

    const updatedSession: Session = { ...currentSession, phase: nextPhase };
    setCurrentSession(updatedSession);

    const nextPhaseAgents = getAgentsForPhase(nextPhase);

    try {
      const result = await executeAgentDebate(
        nextPhaseAgents,
        updatedSession,
        PHASE_TASKS[nextPhase](currentSession.brief)
      );

      if (result) {
        setCurrentSession((prev) =>
          prev ? { ...prev, results: { ...prev.results, ...result } } : null
        );

        if (nextPhase === 5) {
          onSessionComplete?.(result);
        }
      }
    } catch (err) {
      const errorMessage = `فشل في إتمام المرحلة ${nextPhase}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [currentSession, activePhase, executeAgentDebate, onError, onSessionComplete]);

  return {
    currentSession,
    activePhase,
    isLoading,
    error,
    phaseAgents,
    currentPhaseTask,
    startSession,
    stopSession,
    advancePhase,
    setActivePhase,
  };
}

export default useBrainStormSession;
