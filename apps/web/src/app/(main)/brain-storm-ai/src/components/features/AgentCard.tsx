/**
 * @module AgentCard
 * @description بطاقة عرض معلومات الوكيل مع التفاصيل القابلة للتوسيع
 */

"use client";

import { useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCollaborators } from "@/lib/drama-analyst/services/brainstormAgentRegistry";
import { STATUS_COLORS, CATEGORY_COLORS, CATEGORY_NAMES } from "../../constants";
import type { BrainstormAgentDefinition, AgentState } from "../../types";
import AgentIconComponent from "./AgentIconComponent";

interface AgentCardProps {
  agent: BrainstormAgentDefinition;
  state: AgentState;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function AgentCard({
  agent,
  state,
  isExpanded,
  onToggleExpand,
}: AgentCardProps) {
  const statusColor = STATUS_COLORS[state.status];
  const categoryColor = CATEGORY_COLORS[agent.category];

  const collaborators = useMemo(
    () => getCollaborators(agent.id),
    [agent.id]
  );

  return (
    <div
      className={`p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border ${
        state.status === "working" ? "border-blue-400" : "border-transparent"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-blue-500">
          <AgentIconComponent icon={agent.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{agent.nameAr}</p>
            <Badge
              variant="secondary"
              className={`text-xs ${categoryColor}`}
            >
              {CATEGORY_NAMES[agent.category]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {agent.role}
          </p>
          {state.lastMessage && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {state.lastMessage}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-muted space-y-2">
          <p className="text-xs text-muted-foreground">{agent.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {agent.capabilities.canAnalyze && (
              <Badge variant="outline" className="text-xs">
                تحليل
              </Badge>
            )}
            {agent.capabilities.canGenerate && (
              <Badge variant="outline" className="text-xs">
                توليد
              </Badge>
            )}
            {agent.capabilities.canPredict && (
              <Badge variant="outline" className="text-xs">
                تنبؤ
              </Badge>
            )}
            {agent.capabilities.hasMemory && (
              <Badge variant="outline" className="text-xs">
                ذاكرة
              </Badge>
            )}
            {agent.capabilities.supportsRAG && (
              <Badge variant="outline" className="text-xs">
                RAG
              </Badge>
            )}
          </div>
          {collaborators.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground">
                يتعاون مع:
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {collaborators.slice(0, 3).map((c: { id: string; nameAr: string }) => (
                  <Badge key={c.id} variant="secondary" className="text-xs">
                    {c.nameAr}
                  </Badge>
                ))}
                {collaborators.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{collaborators.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>التعقيد: {(agent.complexityScore * 100).toFixed(0)}%</span>
            <span>الاسم: {agent.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
