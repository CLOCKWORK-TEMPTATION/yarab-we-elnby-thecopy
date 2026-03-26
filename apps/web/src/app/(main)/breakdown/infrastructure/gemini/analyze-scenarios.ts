import { Schema, Type } from "@google/genai";
import type { ScenarioAnalysis } from "../../domain/models";
import { GEMINI_MODELS } from "../../domain/constants";
import { logError } from "../../domain/errors";
import { getGeminiClient } from "./client";

export interface ScenarioAnalysisOptions {
  includeRecommended?: boolean;
  scenarioCount?: number;
  prioritizeBudget?: boolean;
  prioritizeCreative?: boolean;
  prioritizeSchedule?: boolean;
}

const scenarioSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scenarios: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique scenario identifier" },
          name: { type: Type.STRING, description: "Scenario name" },
          description: {
            type: Type.STRING,
            description: "Detailed description of the approach",
          },
          recommended: { type: Type.BOOLEAN, description: "Whether this is the recommended option" },
          metrics: {
            type: Type.OBJECT,
            properties: {
              budget: { type: Type.NUMBER },
              schedule: { type: Type.NUMBER },
              risk: { type: Type.NUMBER },
              creative: { type: Type.NUMBER },
            },
            required: ["budget", "schedule", "risk", "creative"],
          },
          agentInsights: {
            type: Type.OBJECT,
            properties: {
              logistics: { type: Type.STRING },
              budget: { type: Type.STRING },
              schedule: { type: Type.STRING },
              creative: { type: Type.STRING },
              risk: { type: Type.STRING },
            },
            required: ["logistics", "budget", "schedule", "creative", "risk"],
          },
        },
        required: ["id", "name", "description", "recommended", "metrics", "agentInsights"],
      },
    },
  },
  required: ["scenarios"],
};

export const analyzeProductionScenarios = async (
  sceneContent: string,
  options: ScenarioAnalysisOptions = {}
): Promise<ScenarioAnalysis> => {
  const {
    scenarioCount = 3,
    prioritizeBudget = false,
    prioritizeCreative = false,
    prioritizeSchedule = false,
  } = options;

  let priorityGuidance = "";
  if (prioritizeBudget) priorityGuidance = " Prioritize cost savings in all scenarios.";
  if (prioritizeCreative) priorityGuidance = " Prioritize artistic impact in all scenarios.";
  if (prioritizeSchedule) priorityGuidance = " Prioritize time efficiency in all scenarios.";

  const prompt = `You are the 'Central Orchestrator Agent' (COA) for a film production AI system.
Generate exactly ${scenarioCount} production scenarios representing different trade-offs.${priorityGuidance}
Return metrics and agent insights for budget, creative, risk, schedule, and logistics.`;

  try {
    const response = await getGeminiClient().models.generateContent({
      model: GEMINI_MODELS.scenario,
      contents: [
        { role: "user", parts: [{ text: prompt }] },
        { role: "user", parts: [{ text: `SCENE TO ANALYZE:\n${sceneContent}` }] },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: scenarioSchema,
      },
    });

    return response.text ? JSON.parse(response.text) : { scenarios: [] };
  } catch (error) {
    logError("analyzeProductionScenarios", error);
    return { scenarios: [] };
  }
};
