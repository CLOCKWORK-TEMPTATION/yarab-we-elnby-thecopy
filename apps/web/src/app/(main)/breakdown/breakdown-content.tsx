"use client";

import { useEffect, useState } from "react";
import { readAnalysisReportFromStorage } from "./breakdown-report";
import {
  BreakdownLoadingState,
  BreakdownMessageState,
  BreakdownReportView,
} from "./breakdown-ui";
import type { AnalysisReportOutput } from "./schemas";

export default function BreakdownContent() {
  const [report, setReport] = useState<AnalysisReportOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const result = readAnalysisReportFromStorage();

    if (result.success) {
      setReport(result.data);
      setError(null);
    } else {
      setReport(null);
      setError(result.error);
    }

    setLoading(false);
  }, []);

  if (loading) {
    return <BreakdownLoadingState />;
  }

  if (error || !report) {
    return (
      <BreakdownMessageState
        message={error || "لم يتم العثور على تقرير تحليل."}
      />
    );
  }

  return <BreakdownReportView report={report} />;
}
