import { Schema, Type } from "@google/genai";
import { AGENT_PERSONAS } from "../infrastructure/agents/configs";
import { createChatSession } from "../infrastructure/gemini/chat-session";
import { getGeminiClient } from "../infrastructure/gemini/client";
import { analyzeScene } from "../infrastructure/gemini/analyze-scene";
import {
  analyzeProductionScenarios,
  type ScenarioAnalysisOptions,
} from "../infrastructure/gemini/analyze-scenarios";
import { segmentScript } from "../infrastructure/gemini/segment-script";
import { GEMINI_MODELS } from "../domain/constants";
import { logError } from "../domain/errors";

export {
  analyzeScene,
  analyzeProductionScenarios,
  createChatSession,
  segmentScript,
};

export type { ScenarioAnalysisOptions };

export interface SingleAgentAnalysis {
  agentKey: string;
  analysis: string[];
  suggestions: string[];
  warnings: string[];
}

const singleAgentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["analysis", "suggestions", "warnings"],
};

export const runSingleAgent = async (
  agentKey: string,
  sceneContent: string
): Promise<SingleAgentAnalysis> => {
  const persona = AGENT_PERSONAS[agentKey as keyof typeof AGENT_PERSONAS];
  const prompt = `You are the ${agentKey.toUpperCase()} Agent for film production.
Your specialty: ${persona?.focus || agentKey}

Analyze the following scene and provide:
1. analysis
2. suggestions
3. warnings

Return ONLY valid JSON.`;

  try {
    const response = await getGeminiClient().models.generateContent({
      model: GEMINI_MODELS.analysis,
      contents: [
        { role: "user", parts: [{ text: prompt }] },
        { role: "user", parts: [{ text: `SCENE:\n${sceneContent}` }] },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: singleAgentSchema,
      },
    });

    const result = response.text
      ? JSON.parse(response.text)
      : { analysis: [], suggestions: [], warnings: [] };

    return {
      agentKey,
      ...result,
    };
  } catch (error) {
    logError(`geminiService.runSingleAgent.${agentKey}`, error);
    return {
      agentKey,
      analysis: [],
      suggestions: [],
      warnings: [],
    };
  }
};
