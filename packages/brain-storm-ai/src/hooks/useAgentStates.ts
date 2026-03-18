/**
 * @module useAgentStates
 * @description هوك مخصص لإدارة حالات الوكلاء في منصة العصف الذهني
 * يوفر واجهة موحدة لتتبع وتحديث حالة كل وكيل خلال النقاش
 */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  getAllAgents,
  type BrainstormAgentDefinition,
} from "@/lib/drama-analyst/services/brainstormAgentRegistry";
import type { AgentState, AgentStatus } from "../types/session.types";

/**
 * @interface UseAgentStatesOptions
 * @description خيارات تهيئة هوك حالات الوكلاء
 */
interface UseAgentStatesOptions {
  /** قائمة الوكلاء المبدئية (اختياري - يستخدم getAllAgents افتراضياً) */
  initialAgents?: readonly BrainstormAgentDefinition[];
  /** معالج عند تغيير حالة وكيل */
  onStateChange?: (agentId: string, state: AgentState) => void;
}

/**
 * @interface UseAgentStatesReturn
 * @description القيم المُرجعة من هوك حالات الوكلاء
 */
interface UseAgentStatesReturn {
  /** خريطة حالات جميع الوكلاء */
  agentStates: Map<string, AgentState>;
  /** قائمة الوكلاء الموسعة (expanded) */
  expandedAgents: Set<string>;
  /** تحديث حالة وكيل محدد */
  updateAgentState: (agentId: string, updates: Partial<AgentState>) => void;
  /** تبديل حالة توسيع بطاقة الوكيل */
  toggleAgentExpand: (agentId: string) => void;
  /** تعيين حالة مجموعة من الوكلاء */
  setAgentsStatus: (agentIds: string[], status: AgentStatus) => void;
  /** إعادة تعيين جميع الوكلاء للحالة الأولية */
  resetAllAgents: () => void;
  /** الحصول على حالة وكيل محدد */
  getAgentState: (agentId: string) => AgentState;
  /** عدد الوكلاء العاملين حالياً */
  workingAgentsCount: number;
  /** عدد الوكلاء المكتملين */
  completedAgentsCount: number;
  /** هل يوجد وكيل في حالة خطأ */
  hasErrors: boolean;
}

/**
 * إنشاء حالة ابتدائية لوكيل
 * @param agentId - معرف الوكيل
 * @returns حالة الوكيل الافتراضية
 */
function createInitialAgentState(agentId: string): AgentState {
  return {
    id: agentId,
    status: "idle",
    lastMessage: undefined,
    progress: undefined,
  };
}

/**
 * @function useAgentStates
 * @description هوك مخصص لإدارة حالات الوكلاء في منصة العصف الذهني
 * 
 * يوفر هذا الهوك واجهة شاملة للتعامل مع:
 * - تتبع حالة كل وكيل (idle, working, completed, error)
 * - إدارة توسيع/طي بطاقات الوكلاء
 * - تحديث الحالات بشكل فردي أو جماعي
 * - حساب إحصائيات الوكلاء
 * 
 * @param options - خيارات تهيئة الهوك
 * @returns كائن يحتوي على الحالة ودوال التحكم
 * 
 * @example
 * ```tsx
 * const {
 *   agentStates,
 *   updateAgentState,
 *   toggleAgentExpand,
 *   setAgentsStatus,
 *   workingAgentsCount
 * } = useAgentStates({
 *   onStateChange: (id, state) => console.log(`Agent ${id}:`, state)
 * });
 * ```
 */
export function useAgentStates(
  options: UseAgentStatesOptions = {}
): UseAgentStatesReturn {
  const { initialAgents, onStateChange } = options;

  /** قائمة جميع الوكلاء المتاحة */
  const allAgents = useMemo(
    () => initialAgents ?? getAllAgents(),
    [initialAgents]
  );

  /** خريطة حالات الوكلاء */
  const [agentStates, setAgentStates] = useState<Map<string, AgentState>>(
    () => {
      const states = new Map<string, AgentState>();
      allAgents.forEach((agent) => {
        states.set(agent.id, createInitialAgentState(agent.id));
      });
      return states;
    }
  );

  /** مجموعة الوكلاء الموسعة */
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  /** تهيئة حالات الوكلاء عند تغيير قائمة الوكلاء */
  useEffect(() => {
    const initialStates = new Map<string, AgentState>();
    allAgents.forEach((agent) => {
      initialStates.set(agent.id, createInitialAgentState(agent.id));
    });
    setAgentStates(initialStates);
  }, [allAgents]);

  /**
   * تحديث حالة وكيل محدد
   * @param agentId - معرف الوكيل
   * @param updates - التحديثات المطلوبة
   */
  const updateAgentState = useCallback(
    (agentId: string, updates: Partial<AgentState>) => {
      setAgentStates((prev) => {
        const next = new Map(prev);
        const current = next.get(agentId);
        if (current) {
          const newState = { ...current, ...updates };
          next.set(agentId, newState);
          onStateChange?.(agentId, newState);
        }
        return next;
      });
    },
    [onStateChange]
  );

  /**
   * تبديل حالة توسيع بطاقة الوكيل
   * @param agentId - معرف الوكيل
   */
  const toggleAgentExpand = useCallback((agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  }, []);

  /**
   * تعيين حالة مجموعة من الوكلاء
   * @param agentIds - قائمة معرفات الوكلاء
   * @param status - الحالة الجديدة
   */
  const setAgentsStatus = useCallback(
    (agentIds: string[], status: AgentStatus) => {
      setAgentStates((prev) => {
        const next = new Map(prev);
        agentIds.forEach((id) => {
          const current = next.get(id);
          if (current) {
            const newState = { ...current, status };
            next.set(id, newState);
            onStateChange?.(id, newState);
          }
        });
        return next;
      });
    },
    [onStateChange]
  );

  /**
   * إعادة تعيين جميع الوكلاء للحالة الأولية
   */
  const resetAllAgents = useCallback(() => {
    const initialStates = new Map<string, AgentState>();
    allAgents.forEach((agent) => {
      initialStates.set(agent.id, createInitialAgentState(agent.id));
    });
    setAgentStates(initialStates);
    setExpandedAgents(new Set());
  }, [allAgents]);

  /**
   * الحصول على حالة وكيل محدد
   * @param agentId - معرف الوكيل
   * @returns حالة الوكيل أو الحالة الافتراضية
   */
  const getAgentState = useCallback(
    (agentId: string): AgentState => {
      return agentStates.get(agentId) ?? createInitialAgentState(agentId);
    },
    [agentStates]
  );

  /**
   * إحصائيات الوكلاء المحسوبة
   * يتم حسابها في تكرار واحد لتحسين الأداء
   */
  const agentStatistics = useMemo(() => {
    let working = 0;
    let completed = 0;
    let errors = false;
    
    agentStates.forEach((state) => {
      if (state.status === "working") working++;
      else if (state.status === "completed") completed++;
      else if (state.status === "error") errors = true;
    });
    
    return { working, completed, errors };
  }, [agentStates]);

  /** عدد الوكلاء العاملين حالياً */
  const workingAgentsCount = agentStatistics.working;

  /** عدد الوكلاء المكتملين */
  const completedAgentsCount = agentStatistics.completed;

  /** هل يوجد وكيل في حالة خطأ */
  const hasErrors = agentStatistics.errors;

  return {
    agentStates,
    expandedAgents,
    updateAgentState,
    toggleAgentExpand,
    setAgentsStatus,
    resetAllAgents,
    getAgentState,
    workingAgentsCount,
    completedAgentsCount,
    hasErrors,
  };
}

export default useAgentStates;
