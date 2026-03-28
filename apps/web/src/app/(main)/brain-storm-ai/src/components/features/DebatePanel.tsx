/**
 * @module DebatePanel
 * @description لوحة عرض رسائل النقاش بين الوكلاء
 */

"use client";

import { MessageSquare, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DebateMessage } from "../../types";

interface DebatePanelProps {
  messages: DebateMessage[];
}

function getMessageStyle(type: DebateMessage["type"]) {
  switch (type) {
    case "proposal":
      return "bg-blue-50 border-blue-200";
    case "decision":
      return "bg-purple-50 border-purple-200";
    default:
      return "bg-green-50 border-green-200";
  }
}

function getMessageTypeLabel(type: DebateMessage["type"]) {
  switch (type) {
    case "proposal":
      return "اقتراح";
    case "decision":
      return "قرار";
    default:
      return "موافقة";
  }
}

export default function DebatePanel({ messages }: DebatePanelProps) {
  if (messages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6" />
          النقاش
        </CardTitle>
        <CardDescription>{messages.length} رسالة</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${getMessageStyle(msg.type)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{msg.agentName}</span>
                  <div className="flex items-center gap-2">
                    {msg.uncertainty && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                msg.uncertainty.confidence > 0.7
                                  ? "bg-green-50"
                                  : msg.uncertainty.confidence > 0.4
                                    ? "bg-yellow-50"
                                    : "bg-red-50"
                              }`}
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {(msg.uncertainty.confidence * 100).toFixed(0)}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>الثقة: {msg.uncertainty.confidence.toFixed(2)}</p>
                            <p>النوع: {msg.uncertainty.type}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {getMessageTypeLabel(msg.type)}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{msg.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
