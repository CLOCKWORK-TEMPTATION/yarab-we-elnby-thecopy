import { STATIC_REPORT_PATH } from "../../domain/constants";
import { logError } from "../../domain/errors";
import {
  type BreakdownReportOutput,
  validateBreakdownReport,
} from "../../domain/schemas";
import {
  readAnalysisReportFromStorage,
  type ReadAnalysisReportResult,
} from "./report-storage";

export async function fetchStaticReport(): Promise<BreakdownReportOutput> {
  const response = await fetch(STATIC_REPORT_PATH);

  if (!response.ok) {
    throw new Error(`فشل في تحميل التقرير: ${response.status}`);
  }

  const data = await response.json();
  const validationResult = validateBreakdownReport(data);

  if (!validationResult.success) {
    throw new Error(validationResult.error);
  }

  return validationResult.data;
}

export async function loadAnalysisReport(
  storage: Storage | undefined
): Promise<{
  report: BreakdownReportOutput | null;
  storageResult: ReadAnalysisReportResult | null;
}> {
  const storedReportResult =
    typeof window === "undefined" || !storage
      ? null
      : readAnalysisReportFromStorage(storage);

  if (storedReportResult?.success) {
    return {
      report: storedReportResult.data,
      storageResult: storedReportResult,
    };
  }

  try {
    const staticReport = await fetchStaticReport();
    return { report: staticReport, storageResult: storedReportResult };
  } catch (error) {
    logError("loadAnalysisReport", error);
    return { report: null, storageResult: storedReportResult };
  }
}
