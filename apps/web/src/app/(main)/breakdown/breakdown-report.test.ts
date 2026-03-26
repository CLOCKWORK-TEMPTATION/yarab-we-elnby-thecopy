import { describe, expect, it, vi } from "vitest";
import {
  breakdownReportErrors,
  readAnalysisReportFromStorage,
} from "./breakdown-report";

const validStoredResults = {
  stationOutputs: {
    station7: {
      finalReport: {
        executiveSummary: "ملخص تنفيذي",
        strengthsAnalysis: ["قوة 1"],
        weaknessesIdentified: ["ضعف 1"],
        opportunitiesForImprovement: ["فرصة 1"],
        threatsToCoherence: ["تهديد 1"],
        overallAssessment: {
          narrativeQualityScore: 8,
          structuralIntegrityScore: 7,
          characterDevelopmentScore: 9,
          conflictEffectivenessScore: 6,
          overallScore: 8,
          rating: "جيد جدًا",
        },
      },
    },
  },
};

describe("readAnalysisReportFromStorage", () => {
  it("يعيد خطأ واضحًا عند عدم وجود نتائج محفوظة", () => {
    const storage = {
      getItem: vi.fn().mockReturnValue(null),
    };

    expect(readAnalysisReportFromStorage(storage)).toEqual({
      success: false,
      error: breakdownReportErrors.missingResults,
    });
  });

  it("يحوّل threatsToCoherence إلى threatsToCohesion قبل التحقق من الصحة", () => {
    const storage = {
      getItem: vi.fn().mockReturnValue(JSON.stringify(validStoredResults)),
    };

    const result = readAnalysisReportFromStorage(storage);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.threatsToCohesion).toEqual(["تهديد 1"]);
      expect(result.data.overallAssessment.rating).toBe("جيد جدًا");
    }
  });

  it("يعيد خطأ واضحًا عند غياب التقرير النهائي", () => {
    const storage = {
      getItem: vi.fn().mockReturnValue(
        JSON.stringify({
          stationOutputs: {
            station7: {},
          },
        })
      ),
    };

    expect(readAnalysisReportFromStorage(storage)).toEqual({
      success: false,
      error: breakdownReportErrors.missingReport,
    });
  });

  it("يعيد خطأ تنسيق عند وجود بيانات غير صالحة", () => {
    const storage = {
      getItem: vi.fn().mockReturnValue(
        JSON.stringify({
          stationOutputs: {
            station7: {
              finalReport: {
                executiveSummary: "ملخص غير مكتمل",
                overallAssessment: {
                  narrativeQualityScore: "bad-value",
                },
              },
            },
          },
        })
      ),
    };

    expect(readAnalysisReportFromStorage(storage)).toEqual({
      success: false,
      error: breakdownReportErrors.invalidFormat,
    });
  });

  it("يعيد خطأ تحميل عند وجود JSON غير صالح", () => {
    const storage = {
      getItem: vi.fn().mockReturnValue("{invalid-json"),
    };

    expect(readAnalysisReportFromStorage(storage)).toEqual({
      success: false,
      error: breakdownReportErrors.loadFailed,
    });
  });
});
