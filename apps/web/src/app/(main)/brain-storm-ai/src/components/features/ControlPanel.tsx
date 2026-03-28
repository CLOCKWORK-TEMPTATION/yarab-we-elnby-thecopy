/**
 * @module ControlPanel
 * @description لوحة التحكم — المراحل وإدخال الفكرة والتقدم
 */

"use client";

import {
  Cpu,
  Settings,
  Play,
  Rocket,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FileUpload from "@/components/file-upload";
import type { Session, BrainstormPhase, PhaseDisplayInfo } from "../../types";

interface ControlPanelProps {
  phases: PhaseDisplayInfo[];
  activePhase: BrainstormPhase;
  setActivePhase: (phase: BrainstormPhase) => void;
  currentSession: Session | null;
  brief: string;
  setBrief: (value: string) => void;
  isLoading: boolean;
  progressPercent: string;
  onStartSession: () => void;
  onStopSession: () => void;
  onAdvancePhase: () => void;
  onFileContent: (content: string) => void;
}

export default function ControlPanel({
  phases,
  activePhase,
  setActivePhase,
  currentSession,
  brief,
  setBrief,
  isLoading,
  progressPercent,
  onStartSession,
  onStopSession,
  onAdvancePhase,
  onFileContent,
}: ControlPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Cpu className="w-6 h-6" />
          لوحة التحكم
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* المراحل */}
        <div>
          <h3 className="text-lg font-semibold mb-4">المراحل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {phases.map((phase) => (
              <TooltipProvider key={phase.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        activePhase === phase.id ? "default" : "outline"
                      }
                      className="p-4 h-auto"
                      onClick={() =>
                        setActivePhase(phase.id as BrainstormPhase)
                      }
                    >
                      <div className="flex items-center gap-3 w-full">
                        {phase.icon}
                        <div className="text-left flex-1">
                          <p className="font-bold text-sm">{phase.name}</p>
                          <p className="text-xs opacity-75">{phase.nameEn}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {phase.agentCount}
                        </Badge>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{phase.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* منطقة الإدخال أو التحكم بالجلسة */}
        {!currentSession ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                ملخص الفكرة
              </label>
              <FileUpload onFileContent={onFileContent} className="mb-4" />
              <Textarea
                value={brief}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBrief(e.target.value)}
                placeholder="اكتب فكرتك..."
                className="min-h-[100px]"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={onStartSession}
              disabled={isLoading || !brief.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Settings className="w-5 h-5 mr-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  بدء جلسة
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">الملخص</h3>
              <p className="text-sm">{currentSession.brief}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={onAdvancePhase}
                disabled={activePhase >= 5}
                className="flex-1"
              >
                <Rocket className="w-5 h-5 mr-2" />
                التالي
              </Button>
              <Button onClick={onStopSession} variant="destructive">
                <RotateCcw className="w-5 h-5 mr-2" />
                إعادة
              </Button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">التقدم</span>
                <span className="text-sm font-medium">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
