/**
 * @module session.types
 * @description أنواع TypeScript لجلسات العصف الذهني والوكلاء
 * يوفر تعريفات واضحة ومحددة لجميع الأنواع المستخدمة في منصة العصف الذهني
 */

import type { BrainstormPhase } from "@/lib/drama-analyst/services/brainstormAgentRegistry";
import type { UncertaintyMetrics } from "@/lib/ai/constitutional";

/**
 * @type AgentStatus
 * @description حالات الوكيل الممكنة أثناء جلسة العصف الذهني
 */
export type AgentStatus = "idle" | "working" | "completed" | "error";

/**
 * @type DebateMessageType
 * @description أنواع رسائل النقاش بين الوكلاء
 */
export type DebateMessageType = "proposal" | "critique" | "agreement" | "decision";

/**
 * @type SessionStatus
 * @description حالات الجلسة الممكنة
 */
export type SessionStatus = "active" | "completed" | "paused" | "error";

/**
 * @interface AgentState
 * @description حالة وكيل فردي أثناء جلسة العصف الذهني
 */
export interface AgentState {
  /** المعرف الفريد للوكيل */
  id: string;
  /** الحالة الحالية للوكيل */
  status: AgentStatus;
  /** آخر رسالة صادرة من الوكيل */
  lastMessage?: string;
  /** نسبة تقدم العمل (0-100) */
  progress?: number;
}

/**
 * @interface Session
 * @description بيانات جلسة العصف الذهني
 */
export interface Session {
  /** المعرف الفريد للجلسة */
  id: string;
  /** ملخص الفكرة الإبداعية */
  brief: string;
  /** المرحلة الحالية من العصف الذهني */
  phase: BrainstormPhase;
  /** حالة الجلسة */
  status: SessionStatus;
  /** وقت بدء الجلسة */
  startTime: Date;
  /** قائمة معرفات الوكلاء النشطين */
  activeAgents: string[];
  /** نتائج الجلسة */
  results?: SessionResult | Record<string, unknown>;
}

/**
 * @interface DebateMessage
 * @description رسالة في نقاش العصف الذهني بين الوكلاء
 */
export interface DebateMessage {
  /** معرف الوكيل المرسل */
  agentId: string;
  /** اسم الوكيل بالعربية */
  agentName: string;
  /** نص الرسالة */
  message: string;
  /** وقت الإرسال */
  timestamp: Date;
  /** نوع الرسالة */
  type: DebateMessageType;
  /** مقاييس عدم اليقين (اختياري) */
  uncertainty?: UncertaintyMetrics;
}

/**
 * @interface SessionResult
 * @description نتيجة جلسة العصف الذهني من API
 */
export interface SessionResult {
  /** قائمة الاقتراحات من الوكلاء */
  proposals: Array<{
    agentId: string;
    proposal: string;
    confidence: number;
    reasoning?: string;
  }>;
  /** القرار النهائي */
  finalDecision?: string;
  /** تبرير الحكم */
  judgeReasoning?: string;
  /** مستوى الإجماع (0-1) */
  consensusLevel?: number;
  /** بيانات وصفية عن النقاش */
  debateMetadata?: {
    totalRounds: number;
    participatingAgents: number;
    averageConfidence: number;
    processingTime: number;
  };
}

/**
 * @interface BrainStormSessionState
 * @description الحالة الكاملة لجلسة العصف الذهني
 */
export interface BrainStormSessionState {
  /** الجلسة الحالية */
  currentSession: Session | null;
  /** المرحلة النشطة */
  activePhase: BrainstormPhase;
  /** هل يتم التحميل */
  isLoading: boolean;
  /** رسالة الخطأ */
  error: string | null;
}

/**
 * @interface PhaseInfo
 * @description معلومات مرحلة العصف الذهني للعرض
 */
export interface PhaseInfo {
  /** رقم المرحلة */
  id: BrainstormPhase;
  /** اسم المرحلة بالعربية */
  name: string;
  /** اسم المرحلة بالإنجليزية */
  nameEn: string;
  /** وصف المرحلة */
  description: string;
  /** أيقونة المرحلة */
  icon: React.ReactNode;
  /** لون المرحلة */
  color: string;
  /** عدد الوكلاء في المرحلة */
  agentCount: number;
}

/**
 * @interface BrainstormAPIRequest
 * @description طلب API للعصف الذهني
 */
export interface BrainstormAPIRequest {
  /** المهمة المطلوب تنفيذها */
  task: string;
  /** سياق الطلب */
  context: {
    brief: string;
    phase: BrainstormPhase;
    sessionId: string;
  };
  /** قائمة معرفات الوكلاء المشاركين */
  agentIds: string[];
}

/**
 * @interface BrainstormAPIResponse
 * @description استجابة API للعصف الذهني
 */
export interface BrainstormAPIResponse {
  /** نتيجة النقاش */
  result: SessionResult;
  /** هل نجح الطلب */
  success: boolean;
  /** رسالة الخطأ إن وجدت */
  error?: string;
}
