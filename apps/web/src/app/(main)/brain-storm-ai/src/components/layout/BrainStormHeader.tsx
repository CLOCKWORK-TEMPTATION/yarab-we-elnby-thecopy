/**
 * @module BrainStormHeader
 * @description رأس صفحة العصف الذهني — العنوان والإحصائيات والرسائل
 */

"use client";

import { Badge } from "@/components/ui/badge";
import type { Session } from "../../types";

interface BrainStormHeaderProps {
  agentStats: {
    total: number;
    withRAG: number;
    averageComplexity: number;
    withSelfReflection: number;
  };
  error: string | null;
  currentSession: Session | null;
}

export default function BrainStormHeader({
  agentStats,
  error,
  currentSession,
}: BrainStormHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        🧠 منصة العصف الذهني الذكي
      </h1>
      <p className="text-xl text-muted-foreground">
        نظام متعدد الوكلاء للتطوير القصصي
      </p>
      <div className="flex items-center justify-center gap-4 mt-4">
        <Badge variant="secondary">{agentStats.total} وكيل</Badge>
        <Badge variant="secondary">{agentStats.withRAG} RAG</Badge>
        <Badge variant="secondary">
          تعقيد {(agentStats.averageComplexity * 100).toFixed(0)}%
        </Badge>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {currentSession && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-600 font-medium">
            الجلسة: {currentSession.brief}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            الحالة: {currentSession.status} | المرحلة: {currentSession.phase}
          </p>
        </div>
      )}
    </div>
  );
}
