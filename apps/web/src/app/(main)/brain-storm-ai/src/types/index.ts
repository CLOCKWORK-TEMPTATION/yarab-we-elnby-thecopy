/**
 * @module types
 * @description أنواع البيانات لتطبيق العصف الذهني الذكي
 */

import type {
  BrainstormAgentDefinition,
  BrainstormPhase,
  AgentIcon,
  AgentCategory,
} from "@/lib/drama-analyst/services/brainstormAgentRegistry";

import type { UncertaintyMetrics } from "@/lib/ai/constitutional";

// ============================================================================
// إعادة تصدير الأنواع الخارجية
// ============================================================================

export type {
  BrainstormAgentDefinition,
  BrainstormPhase,
  AgentIcon,
  AgentCategory,
  UncertaintyMetrics,
};

// ============================================================================
// أنواع التطبيق
// ============================================================================

/** حالات الوكيل الممكنة أثناء جلسة العصف الذهني */
export type AgentStatus = "idle" | "working" | "completed" | "error";

/** حالة وكيل فردي أثناء جلسة العصف الذهني */
export interface AgentState {
  id: string;
  status: AgentStatus;
  lastMessage?: string;
  progress?: number;
}

/** بيانات جلسة العصف الذهني */
export interface Session {
  id: string;
  brief: string;
  phase: BrainstormPhase;
  status: "active" | "completed" | "paused" | "error";
  startTime: Date;
  activeAgents: string[];
  results?: Record<string, unknown>;
}

/** رسالة في نقاش العصف الذهني بين الوكلاء */
export interface DebateMessage {
  agentId: string;
  agentName: string;
  message: string;
  timestamp: Date;
  type: "proposal" | "critique" | "agreement" | "decision";
  uncertainty?: UncertaintyMetrics;
}

/** معلومات المرحلة للعرض */
export interface PhaseDisplayInfo {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  agentCount: number;
}

/** نتيجة النقاش من الخادم */
export interface DebateResult {
  proposals: Array<{
    agentId: string;
    proposal: string;
    confidence: number;
  }>;
  consensus?: boolean;
  finalDecision?: string;
  judgeReasoning?: string;
}

/** استجابة API العصف الذهني */
export interface BrainstormApiResponse {
  success: boolean;
  result: DebateResult;
}

/** طلب API العصف الذهني */
export interface BrainstormApiRequest {
  task: string;
  context: {
    brief: string;
    phase: BrainstormPhase;
    sessionId: string;
  };
  agentIds: string[];
}
