"use server";

import { z } from "zod";

import { getApiKey } from "@/env";
import {
  buildFallbackSevenStationsResult,
  serializeAnalysisValue,
  type AnalysisPipelinePayload,
} from "@/lib/analysis/seven-stations-fallback";

const pipelineRequestSchema = z.object({
  fullText: z.string().min(1, "النص مطلوب"),
  projectName: z.string().min(1).default("تحليل درامي شامل"),
});

export type PipelineInput = z.infer<typeof pipelineRequestSchema>;
export type PipelineResult = AnalysisPipelinePayload;

function safeReadApiKey(): string | null {
  try {
    const apiKey = getApiKey();
    return apiKey || null;
  } catch {
    return (
      process.env.GEMINI_API_KEY_PROD ||
      process.env.GEMINI_API_KEY_STAGING ||
      null
    );
  }
}

function normalizePipelineResult(
  result: Record<string, unknown>,
  request: PipelineInput
): AnalysisPipelinePayload {
  const stationOutputs = serializeAnalysisValue(
    (result.stationOutputs || {}) as Record<string, unknown>
  ) as AnalysisPipelinePayload["stationOutputs"];

  const metadata = serializeAnalysisValue(
    (result.metadata || {}) as Record<string, unknown>
  ) as Record<string, unknown>;

  const hasStations = Object.keys(stationOutputs || {}).length > 0;

  if (!hasStations) {
    throw new Error("لم تُنتج المحطات أي مخرجات قابلة للعرض");
  }

  return {
    success: Boolean(result.success),
    mode: "ai",
    warnings: [],
    stationOutputs,
    metadata: {
      ...metadata,
      analysisMode: "ai",
      projectName: request.projectName,
      textLength: request.fullText.length,
    },
  };
}

export async function runFullPipeline(input: PipelineInput): Promise<PipelineResult> {
  const request = pipelineRequestSchema.parse(input);
  const apiKey = safeReadApiKey();

  if (!apiKey || process.env.NODE_ENV === "test") {
    return buildFallbackSevenStationsResult({
      fullText: request.fullText,
      projectName: request.projectName,
      warning: !apiKey
        ? "تم استخدام المسار الاحتياطي لأن مفاتيح التحليل الذكي غير متاحة."
        : "تم استخدام المسار الاحتياطي لأن بيئة الاختبار لا تشغّل تحليلًا شبكيًا حيًا.",
    });
  }

  try {
    const { createQuickPipeline } = await import(
      "@/lib/ai/stations/run-all-stations"
    );
    const pipeline = createQuickPipeline(apiKey);
    const result = await pipeline.runFullAnalysis({
      text: request.fullText,
      options: {
        title: request.projectName,
      },
    });

    return normalizePipelineResult(
      result as unknown as Record<string, unknown>,
      request
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "فشل غير معروف في تنفيذ التحليل";

    return buildFallbackSevenStationsResult({
      fullText: request.fullText,
      projectName: request.projectName,
      warning: `تم التحويل إلى المسار الاحتياطي بعد فشل التنفيذ الذكي: ${message}`,
    });
  }
}
