import type { SceneBreakdown } from "../../domain/models";
import { logError } from "../../domain/errors";
import { runAllBreakdownAgents } from "../agents/runner";
import { simplifyCastResult } from "../cast/adapter";
import { analyzeCastEnhanced } from "../cast/service";

export const analyzeScene = async (
  sceneContent: string
): Promise<SceneBreakdown> => {
  try {
    const [castResult, technicalResult] = await Promise.all([
      analyzeCastEnhanced(sceneContent),
      runAllBreakdownAgents(sceneContent),
    ]);

    return {
      cast: simplifyCastResult(castResult),
      ...technicalResult,
    };
  } catch (error) {
    logError("analyzeScene", error);
    throw new Error("فشل في إكمال تحليل المشهد.");
  }
};
