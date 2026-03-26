/**
 * @module useAgentStates
 * @description هوك إدارة حالات الوكلاء
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getAllAgents } from "@/lib/drama-analyst/services/brainstormAgentRegistry";
import type { AgentState } from "../types";

export function useAgentStates() {
  const realAgents = useMemo(() => getAllAgents(), []);

  const [agentStates, setAgentStates] = useState<Map<string, AgentState>>(
    new Map()
  );

  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(
    new Set()
  );

  /** تهيئة حالات الوكلاء */
  useEffect(() => {
    const initialStates = new Map<string, AgentState>();
    realAgents.forEach((agent) => {
      initialStates.set(agent.id, { id: agent.id, status: "idle" });
    });
    setAgentStates(initialStates);
  }, [realAgents]);

  /** تحديث حالة وكيل محدد */
  const updateAgentState = useCallback(
    (agentId: string, updates: Partial<AgentState>) => {
      setAgentStates((prev) => {
        const next = new Map(prev);
        const current = next.get(agentId);
        if (current) {
          next.set(agentId, { ...current, ...updates });
        }
        return next;
      });
    },
    []
  );

  /** إعادة جميع الوكلاء لحالة الخمول */
  const resetAllAgents = useCallback(() => {
    realAgents.forEach((agent) => {
      updateAgentState(agent.id, { status: "idle", lastMessage: undefined, progress: undefined });
    });
  }, [realAgents, updateAgentState]);

  /** تبديل حالة توسيع بطاقة الوكيل */
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

  /** الحصول على حالة وكيل */
  const getAgentState = useCallback(
    (agentId: string): AgentState => {
      return agentStates.get(agentId) || { id: agentId, status: "idle" };
    },
    [agentStates]
  );

  return {
    realAgents,
    agentStates,
    expandedAgents,
    updateAgentState,
    resetAllAgents,
    toggleAgentExpand,
    getAgentState,
  };
}
