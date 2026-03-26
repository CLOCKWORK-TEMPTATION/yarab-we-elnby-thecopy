import { describe, expect, it } from "vitest";
import {
  validateAnalysisReport,
  validateSceneBreakdown,
  validateScriptSegmentResponse,
} from "../../schemas";

describe("domain schemas", () => {
  it("يملأ القيم الافتراضية في تفريغ المشهد", () => {
    const result = validateSceneBreakdown({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cast).toEqual([]);
      expect(result.data.props).toEqual([]);
      expect(result.data.setDressing).toEqual([]);
      expect(result.data.sound).toEqual([]);
      expect(result.data.equipment).toEqual([]);
      expect(result.data.continuity).toEqual([]);
    }
  });

  it("يرفض استجابة تقسيم غير صالحة", () => {
    const result = validateScriptSegmentResponse({ scenes: [{ header: 1 }] });

    expect(result.success).toBe(false);
  });

  it("يقبل تقرير تحليل صحيح", () => {
    const result = validateAnalysisReport({
      executiveSummary: "ملخص",
      strengthsAnalysis: [],
      weaknessesIdentified: [],
      opportunitiesForImprovement: [],
      threatsToCohesion: [],
      overallAssessment: {
        narrativeQualityScore: 1,
        structuralIntegrityScore: 1,
        characterDevelopmentScore: 1,
        conflictEffectivenessScore: 1,
        overallScore: 1,
        rating: "جيد",
      },
    });

    expect(result.success).toBe(true);
  });
});
