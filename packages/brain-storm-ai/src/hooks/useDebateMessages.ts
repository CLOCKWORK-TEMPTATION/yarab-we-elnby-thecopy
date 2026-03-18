/**
 * @module useDebateMessages
 * @description هوك مخصص لإدارة رسائل النقاش بين الوكلاء
 * يوفر واجهة موحدة لتتبع وإضافة رسائل النقاش المتعدد الوكلاء
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  DebateMessage,
  DebateMessageType,
} from "../types/session.types";
import type { UncertaintyMetrics } from "@/lib/ai/constitutional";

/**
 * @interface UseDebateMessagesOptions
 * @description خيارات تهيئة هوك رسائل النقاش
 */
interface UseDebateMessagesOptions {
  /** الحد الأقصى لعدد الرسائل المحتفظ بها */
  maxMessages?: number;
  /** معالج عند إضافة رسالة جديدة */
  onMessageAdded?: (message: DebateMessage) => void;
}

/**
 * @interface UseDebateMessagesReturn
 * @description القيم المُرجعة من هوك رسائل النقاش
 */
interface UseDebateMessagesReturn {
  /** قائمة رسائل النقاش */
  messages: DebateMessage[];
  /** إضافة رسالة جديدة */
  addMessage: (
    agentId: string,
    agentName: string,
    message: string,
    type: DebateMessageType,
    uncertainty?: UncertaintyMetrics
  ) => void;
  /** إضافة مجموعة رسائل من نتيجة النقاش */
  addMessagesFromResult: (
    proposals: Array<{
      agentId: string;
      proposal: string;
      confidence: number;
    }>,
    agents: Array<{ id: string; nameAr: string }>,
    finalDecision?: string,
    judgeReasoning?: string
  ) => void;
  /** مسح جميع الرسائل */
  clearMessages: () => void;
  /** عدد رسائل الاقتراحات */
  proposalCount: number;
  /** عدد رسائل القرارات */
  decisionCount: number;
  /** آخر رسالة */
  lastMessage: DebateMessage | null;
  /** هل توجد رسائل */
  hasMessages: boolean;
}

/**
 * @function useDebateMessages
 * @description هوك مخصص لإدارة رسائل النقاش بين الوكلاء
 * 
 * يوفر هذا الهوك واجهة شاملة للتعامل مع:
 * - إضافة رسائل النقاش (اقتراحات، انتقادات، موافقات، قرارات)
 * - تتبع مقاييس عدم اليقين لكل رسالة
 * - معالجة نتائج API النقاش
 * - إحصائيات الرسائل
 * 
 * @param options - خيارات تهيئة الهوك
 * @returns كائن يحتوي على الحالة ودوال التحكم
 * 
 * @example
 * ```tsx
 * const {
 *   messages,
 *   addMessage,
 *   addMessagesFromResult,
 *   clearMessages
 * } = useDebateMessages({
 *   maxMessages: 100,
 *   onMessageAdded: (msg) => console.log('New message:', msg)
 * });
 * ```
 */
export function useDebateMessages(
  options: UseDebateMessagesOptions = {}
): UseDebateMessagesReturn {
  const { maxMessages = 500, onMessageAdded } = options;

  const [messages, setMessages] = useState<DebateMessage[]>([]);

  /**
   * إضافة رسالة جديدة للنقاش
   * @param agentId - معرف الوكيل
   * @param agentName - اسم الوكيل بالعربية
   * @param message - نص الرسالة
   * @param type - نوع الرسالة
   * @param uncertainty - مقاييس عدم اليقين (اختياري)
   */
  const addMessage = useCallback(
    (
      agentId: string,
      agentName: string,
      message: string,
      type: DebateMessageType,
      uncertainty?: UncertaintyMetrics
    ) => {
      const newMessage: DebateMessage = {
        agentId,
        agentName,
        message,
        timestamp: new Date(),
        type,
        uncertainty,
      };

      setMessages((prev) => {
        const updated = [...prev, newMessage];
        // الاحتفاظ بآخر maxMessages رسالة فقط
        if (updated.length > maxMessages) {
          return updated.slice(-maxMessages);
        }
        return updated;
      });

      onMessageAdded?.(newMessage);
    },
    [maxMessages, onMessageAdded]
  );

  /**
   * إضافة مجموعة رسائل من نتيجة النقاش
   * يُستخدم لمعالجة استجابة API النقاش وتحويلها لرسائل
   * 
   * @param proposals - قائمة الاقتراحات من الوكلاء
   * @param agents - قائمة الوكلاء مع أسمائهم
   * @param finalDecision - القرار النهائي (اختياري)
   * @param judgeReasoning - تبرير الحكم (اختياري)
   */
  const addMessagesFromResult = useCallback(
    (
      proposals: Array<{
        agentId: string;
        proposal: string;
        confidence: number;
      }>,
      agents: Array<{ id: string; nameAr: string }>,
      finalDecision?: string,
      judgeReasoning?: string
    ) => {
      const newMessages: DebateMessage[] = [];

      // إضافة اقتراحات الوكلاء
      for (const proposal of proposals) {
        const agent = agents.find((a) => a.id === proposal.agentId);
        if (agent) {
          newMessages.push({
            agentId: proposal.agentId,
            agentName: agent.nameAr,
            message: proposal.proposal,
            timestamp: new Date(),
            type: "proposal",
            uncertainty: {
              confidence: proposal.confidence,
              type: "epistemic" as const,
              sources: [],
            },
          });
        }
      }

      // إضافة القرار النهائي إن وجد
      if (finalDecision) {
        const decisionMessage = judgeReasoning
          ? `${finalDecision}\n\n${judgeReasoning}`
          : finalDecision;

        newMessages.push({
          agentId: "judge",
          agentName: "الحكم",
          message: decisionMessage,
          timestamp: new Date(),
          type: "decision",
        });
      }

      setMessages((prev) => {
        const updated = [...prev, ...newMessages];
        if (updated.length > maxMessages) {
          return updated.slice(-maxMessages);
        }
        return updated;
      });

      // استدعاء المعالج لكل رسالة جديدة
      newMessages.forEach((msg) => onMessageAdded?.(msg));
    },
    [maxMessages, onMessageAdded]
  );

  /**
   * مسح جميع رسائل النقاش
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /** عدد رسائل الاقتراحات */
  const proposalCount = useMemo(
    () => messages.filter((m) => m.type === "proposal").length,
    [messages]
  );

  /** عدد رسائل القرارات */
  const decisionCount = useMemo(
    () => messages.filter((m) => m.type === "decision").length,
    [messages]
  );

  /** آخر رسالة في النقاش */
  const lastMessage = useMemo(
    () => (messages.length > 0 ? messages[messages.length - 1] : null),
    [messages]
  );

  /** هل توجد رسائل */
  const hasMessages = messages.length > 0;

  return {
    messages,
    addMessage,
    addMessagesFromResult,
    clearMessages,
    proposalCount,
    decisionCount,
    lastMessage,
    hasMessages,
  };
}

export default useDebateMessages;
