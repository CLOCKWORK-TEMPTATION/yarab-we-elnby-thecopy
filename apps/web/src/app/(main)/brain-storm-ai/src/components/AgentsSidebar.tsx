/**
 * @module AgentsSidebar
 * @description الشريط الجانبي لعرض قائمة الوكلاء
 */

"use client";

import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import AgentCard from "./AgentCard";
import type { BrainstormAgentDefinition, AgentState, BrainstormPhase } from "../types";

interface AgentsSidebarProps {
  displayedAgents: readonly BrainstormAgentDefinition[];
  showAllAgents: boolean;
  setShowAllAgents: (value: boolean) => void;
  totalAgentCount: number;
  phaseAgentCount: number;
  activePhase: BrainstormPhase;
  getAgentState: (agentId: string) => AgentState;
  expandedAgents: Set<string>;
  toggleAgentExpand: (agentId: string) => void;
}

export default function AgentsSidebar({
  displayedAgents,
  showAllAgents,
  setShowAllAgents,
  totalAgentCount,
  phaseAgentCount,
  activePhase,
  getAgentState,
  expandedAgents,
  toggleAgentExpand,
}: AgentsSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Users className="w-6 h-6" />
          الوكلاء
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>
            {showAllAgents
              ? `${totalAgentCount} وكيل`
              : `${phaseAgentCount} للمرحلة ${activePhase}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllAgents(!showAllAgents)}
          >
            {showAllAgents ? "المرحلة" : "الكل"}
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {displayedAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                state={getAgentState(agent.id)}
                isExpanded={expandedAgents.has(agent.id)}
                onToggleExpand={() => toggleAgentExpand(agent.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
