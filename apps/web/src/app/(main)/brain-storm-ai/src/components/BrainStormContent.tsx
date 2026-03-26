/**
 * @module BrainStormContent
 * @description المكون المنسّق الرئيسي — يجمع ويربط جميع الأجزاء
 */

"use client";

import { useCallback } from "react";
import { useAgentStates } from "../hooks/useAgentStates";
import { useSession } from "../hooks/useSession";
import BrainStormHeader from "./BrainStormHeader";
import ControlPanel from "./ControlPanel";
import DebatePanel from "./DebatePanel";
import AgentsSidebar from "./AgentsSidebar";
import FeaturesGrid from "./FeaturesGrid";
import type { BrainstormPhase } from "../types";

export default function BrainStormContent() {
  const {
    realAgents,
    expandedAgents,
    updateAgentState,
    resetAllAgents,
    toggleAgentExpand,
    getAgentState,
  } = useAgentStates();

  const {
    currentSession,
    isLoading,
    error,
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
  } = useSession({ updateAgentState, resetAllAgents, realAgents });

  const handleFileContent = useCallback(
    (content: string) => {
      setBrief((prev: string) => (prev ? `${prev}\n\n${content}` : content));
    },
    [setBrief]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" dir="rtl">
      <BrainStormHeader
        agentStats={agentStats}
        error={error}
        currentSession={currentSession}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الأيسر — لوحة التحكم والنقاش */}
        <div className="lg:col-span-2 space-y-6">
          <ControlPanel
            phases={phases}
            activePhase={activePhase}
            setActivePhase={(p) => setActivePhase(p as BrainstormPhase)}
            currentSession={currentSession}
            brief={brief}
            setBrief={setBrief}
            isLoading={isLoading}
            progressPercent={progressPercent}
            onStartSession={handleStartSession}
            onStopSession={handleStopSession}
            onAdvancePhase={handleAdvancePhase}
            onFileContent={handleFileContent}
          />

          {currentSession && <DebatePanel messages={debateMessages} />}
        </div>

        {/* العمود الأيمن — الوكلاء */}
        <div>
          <AgentsSidebar
            displayedAgents={displayedAgents}
            showAllAgents={showAllAgents}
            setShowAllAgents={setShowAllAgents}
            totalAgentCount={realAgents.length}
            phaseAgentCount={phaseAgents.length}
            activePhase={activePhase}
            getAgentState={getAgentState}
            expandedAgents={expandedAgents}
            toggleAgentExpand={toggleAgentExpand}
          />
        </div>
      </div>

      <FeaturesGrid agentStats={agentStats} />
    </div>
  );
}
