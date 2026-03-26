/**
 * @module useSession
 * @description هوك إدارة جلسة العصف الذهني والنقاش
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  getAgentsForPhase,
  getAgentStats,
  BRAINSTORM_PHASES,
} from "@/lib/drama-analyst/services/brainstormAgentRegistry";
import { conductDebate } from "../lib/api";
import { getPhaseIcon, getPhaseColor } from "../lib/utils";
import { PHASE_TASK_PREFIXES, EMPTY_BRIEF_ERROR, TOTAL_PHASES } from "../constants";
import type {
  Session,
  DebateMessage,
  BrainstormPhase,
  BrainstormAgentDefinition,
  AgentState,
  PhaseDisplayInfo,
} from "../types";

interface UseSessionOptions {
  updateAgentState: (agentId: string, updates: Partial<AgentState>) => void;
  resetAllAgents: () => void;
  realAgents: readonly BrainstormAgentDefinition[];
}

export function useSession({
  updateAgentState,
  resetAllAgents,
  realAgents,
}: UseSessionOptions) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<BrainstormPhase>(1);
  const [brief, setBrief] = useState("");
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([]);
  const [showAllAgents, setShowAllAgents] = useState(false);

  const agentStats = useMemo(() => getAgentStats(), []);
  const phaseAgents = useMemo(() => getAgentsForPhase(activePhase), [activePhase]);
  const displayedAgents = showAllAgents ? realAgents : phaseAgents;

  /** معلومات المراحل للعرض */
  const phases: PhaseDisplayInfo[] = useMemo(
    () =>
      BRAINSTORM_PHASES.map((phase) => ({
        id: phase.id,
        name: phase.name,
        nameEn: phase.nameEn,
        description: phase.description,
        icon: getPhaseIcon(phase.id),
        color: getPhaseColor(phase.id),
        agentCount: getAgentsForPhase(phase.id).length,
      })),
    []
  );

  /** نسبة التقدم */
  const progressPercent = ((activePhase / TOTAL_PHASES) * 100).toFixed(0);

  /** تنفيذ نقاش بين الوكلاء */
  const executeAgentDebate = useCallback(
    async (
      agents: readonly BrainstormAgentDefinition[],
      session: Session,
      task?: string
    ) => {
      const agentIds = agents.map((a) => a.id);
      const debateTask = task || `تحليل الفكرة: ${session.brief}`;

      agents.forEach((agent) => {
        updateAgentState(agent.id, {
          status: "working",
          lastMessage: "جاري المشاركة في النقاش...",
        });
      });

      try {
        const { result: debateResult } = await conductDebate({
          task: debateTask,
          context: {
            brief: session.brief,
            phase: session.phase,
            sessionId: session.id,
          },
          agentIds,
        });

        for (const proposal of debateResult.proposals) {
          const agent = agents.find((a) => a.id === proposal.agentId);
          if (agent) {
            updateAgentState(proposal.agentId, {
              status: "completed",
              lastMessage: `ثقة: ${(proposal.confidence * 100).toFixed(0)}%`,
              progress: proposal.confidence * 100,
            });

            setDebateMessages((prev) => [
              ...prev,
              {
                agentId: proposal.agentId,
                agentName: agent.nameAr,
                message: proposal.proposal,
                timestamp: new Date(),
                type: "proposal",
              },
            ]);
          }
        }

        if (debateResult.consensus || debateResult.finalDecision) {
          setDebateMessages((prev) => [
            ...prev,
            {
              agentId: "judge",
              agentName: "الحكم",
              message: `${debateResult.finalDecision}\n\n📋 السبب: ${debateResult.judgeReasoning}`,
              timestamp: new Date(),
              type: "decision",
            },
          ]);
        }

        setCurrentSession((prev) =>
          prev
            ? {
                ...prev,
                results: {
                  ...prev.results,
                  [`phase${session.phase}Debate`]: debateResult,
                },
              }
            : null
        );

        if (session.phase < TOTAL_PHASES) {
          setTimeout(() => {
            const nextPhase = (session.phase + 1) as BrainstormPhase;
            setActivePhase(nextPhase);
            setCurrentSession((prev) =>
              prev ? { ...prev, phase: nextPhase } : null
            );
          }, 2000);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "فشل في تنفيذ النقاش";
        setError(errorMessage);
        agents.forEach((agent) => {
          updateAgentState(agent.id, { status: "error", lastMessage: "فشل" });
        });
      }
    },
    [updateAgentState]
  );

  /** بدء جلسة عصف ذهني جديدة */
  const handleStartSession = useCallback(async () => {
    if (!brief.trim()) {
      setError(EMPTY_BRIEF_ERROR);
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebateMessages([]);

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
      setBrief("");

      const phase1Agents = getAgentsForPhase(1);
      phase1Agents.forEach((agent) => {
        updateAgentState(agent.id, { status: "working" });
      });

      await executeAgentDebate(phase1Agents, newSession);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "فشل في إنشاء الجلسة";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [brief, phaseAgents, updateAgentState, executeAgentDebate]);

  /** إيقاف الجلسة الحالية */
  const handleStopSession = useCallback(() => {
    setCurrentSession(null);
    setActivePhase(1);
    setDebateMessages([]);
    resetAllAgents();
  }, [resetAllAgents]);

  /** الانتقال إلى المرحلة التالية */
  const handleAdvancePhase = useCallback(async () => {
    if (!currentSession) return;
    const nextPhase = Math.min(activePhase + 1, TOTAL_PHASES) as BrainstormPhase;
    setActivePhase(nextPhase);
    const updatedSession = { ...currentSession, phase: nextPhase };
    setCurrentSession(updatedSession);
    const nextPhaseAgents = getAgentsForPhase(nextPhase);
    const task = `${PHASE_TASK_PREFIXES[nextPhase]} ${currentSession.brief}`;

    try {
      await executeAgentDebate(nextPhaseAgents, updatedSession, task);
    } catch {
      setError(`فشل في إتمام المرحلة ${nextPhase}`);
    }
  }, [currentSession, activePhase, executeAgentDebate]);

  return {
    currentSession,
    isLoading,
    error,
    setError,
    activePhase,
    setActivePhase,
    brief,
    setBrief,
    debateMessages,
    showAllAgents,
    setShowAllAgents,
    agentStats,
    phaseAgents,
    displayedAgents,
    phases,
    progressPercent,
    handleStartSession,
    handleStopSession,
    handleAdvancePhase,
  };
}
