import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BreakdownContent from "../../breakdown-content";

const validReport = {
  executiveSummary: "ملخص تنفيذي جاهز",
  strengthsAnalysis: ["قوة 1"],
  weaknessesIdentified: ["ضعف 1"],
  opportunitiesForImprovement: ["فرصة 1"],
  threatsToCohesion: ["تهديد 1"],
  overallAssessment: {
    narrativeQualityScore: 8,
    structuralIntegrityScore: 7,
    characterDevelopmentScore: 9,
    conflictEffectivenessScore: 6,
    overallScore: 8,
    rating: "جيد جدًا",
  },
};

describe("BreakdownContent", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("يقرأ التقرير من تخزين المنصة قبل أي طلب شبكي", async () => {
    sessionStorage.setItem(
      "stationAnalysisResults",
      JSON.stringify({
        stationOutputs: {
          station7: {
            finalReport: {
              ...validReport,
              threatsToCoherence: ["تهديد 1"],
            },
          },
        },
      })
    );

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<BreakdownContent />);

    expect(await screen.findByText("📊 تحليل شامل للنص")).toBeInTheDocument();
    expect(screen.getByText("ملخص تنفيذي جاهز")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("يرجع إلى الملف الثابت إذا لم توجد نتائج محفوظة داخل المنصة", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => validReport,
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<BreakdownContent />);

    await waitFor(() => {
      expect(screen.getByText("ملخص تنفيذي جاهز")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith("/analysis_output/final-report.json");
  });
});
