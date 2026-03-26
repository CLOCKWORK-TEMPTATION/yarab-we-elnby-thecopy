import { logError } from "./config";
import { validateAnalysisReport } from "./schemas";
import type { AnalysisReportOutput } from "./schemas";

const REPORT_STORAGE_KEY = "stationAnalysisResults";

const REPORT_ERRORS = {
  missingResults: "لم يتم العثور على نتائج تحليل. يرجى تشغيل التحليل أولاً.",
  missingReport:
    "لم يتم العثور على التقرير النهائي. يرجى التأكد من اكتمال جميع المحطات.",
  invalidFormat: "تنسيق التقرير غير صحيح",
  loadFailed: "فشل في تحميل تقرير التحليل",
} as const;

type ReportStorageLike = Pick<Storage, "getItem">;

type StoredFinalReport = Partial<
  AnalysisReportOutput & {
    threatsToCoherence?: string[];
  }
>;

type StoredStationAnalysisResults = {
  stationOutputs?: {
    station7?: {
      finalReport?: StoredFinalReport;
    };
  };
};

export type ReadAnalysisReportResult =
  | { success: true; data: AnalysisReportOutput }
  | { success: false; error: string };

function normalizeStoredReport(
  finalReport: StoredFinalReport
): Record<string, unknown> {
  return {
    ...finalReport,
    threatsToCohesion:
      finalReport.threatsToCoherence ?? finalReport.threatsToCohesion ?? [],
  };
}

function getStoredFinalReport(
  rawResults: string
): StoredFinalReport | null {
  const parsedResults = JSON.parse(rawResults) as StoredStationAnalysisResults;
  const finalReport = parsedResults?.stationOutputs?.station7?.finalReport;

  if (!finalReport || typeof finalReport !== "object") {
    return null;
  }

  return finalReport;
}

export function readAnalysisReportFromStorage(
  storage: ReportStorageLike = sessionStorage
): ReadAnalysisReportResult {
  try {
    const storedResults = storage.getItem(REPORT_STORAGE_KEY);

    if (!storedResults) {
      return { success: false, error: REPORT_ERRORS.missingResults };
    }

    const finalReport = getStoredFinalReport(storedResults);

    if (!finalReport) {
      return { success: false, error: REPORT_ERRORS.missingReport };
    }

    const validationResult = validateAnalysisReport(
      normalizeStoredReport(finalReport)
    );

    if (!validationResult.success) {
      logError(
        "readAnalysisReportFromStorage",
        new Error(validationResult.error)
      );

      return { success: false, error: REPORT_ERRORS.invalidFormat };
    }

    return { success: true, data: validationResult.data };
  } catch (error) {
    logError("readAnalysisReportFromStorage", error);
    return { success: false, error: REPORT_ERRORS.loadFailed };
  }
}

export const breakdownReportErrors = REPORT_ERRORS;
