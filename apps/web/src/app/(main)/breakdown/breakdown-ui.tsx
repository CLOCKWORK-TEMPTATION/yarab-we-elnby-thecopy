import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalysisReportOutput } from "./schemas";

const PAGE_CONTAINER_CLASS = "container mx-auto max-w-6xl p-6";

type BreakdownStateProps = {
  title?: string;
  message: string;
};

type BreakdownInsightListProps = {
  title: string;
  titleClassName: string;
  bulletClassName: string;
  items: string[];
};

function BreakdownPageContainer({ children }: { children: ReactNode }) {
  return <div className={`${PAGE_CONTAINER_CLASS} space-y-6`}>{children}</div>;
}

function BreakdownScore({
  value,
  label,
  valueClassName,
}: {
  value: number;
  label: string;
  valueClassName: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export function BreakdownLoadingState() {
  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">جاري تحميل تقرير التحليل...</p>
        </div>
      </div>
    </div>
  );
}

export function BreakdownMessageState({
  title = "تحليل النص",
  message,
}: BreakdownStateProps) {
  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <div className="py-12 text-center">
        <h1 className="mb-4 text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function BreakdownPageHeader() {
  return (
    <div className="text-center">
      <h1 className="mb-2 text-3xl font-bold">📊 تحليل شامل للنص</h1>
      <p className="text-muted-foreground">
        تقرير مفصل عن جودة النص ونقاط القوة والضعف
      </p>
    </div>
  );
}

export function BreakdownOverallAssessment({
  report,
}: {
  report: AnalysisReportOutput;
}) {
  const { overallAssessment } = report;

  return (
    <Card>
      <CardHeader>
        <CardTitle>التقييم العام</CardTitle>
        <CardDescription>نظرة شاملة على جودة النص</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
          <BreakdownScore
            value={overallAssessment.narrativeQualityScore}
            label="جودة السرد"
            valueClassName="text-blue-600"
          />
          <BreakdownScore
            value={overallAssessment.structuralIntegrityScore}
            label="السلامة الهيكلية"
            valueClassName="text-green-600"
          />
          <BreakdownScore
            value={overallAssessment.characterDevelopmentScore}
            label="تطوير الشخصيات"
            valueClassName="text-purple-600"
          />
          <BreakdownScore
            value={overallAssessment.conflictEffectivenessScore}
            label="فعالية الصراع"
            valueClassName="text-orange-600"
          />
          <BreakdownScore
            value={overallAssessment.overallScore}
            label="النتيجة الإجمالية"
            valueClassName="text-red-600"
          />
        </div>

        <div className="text-center">
          <Badge variant="outline" className="px-4 py-2 text-lg">
            التصنيف: {overallAssessment.rating}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function BreakdownExecutiveSummary({
  summary,
}: {
  summary: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الملخص التنفيذي</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{summary}</p>
      </CardContent>
    </Card>
  );
}

export function BreakdownInsightList({
  title,
  titleClassName,
  bulletClassName,
  items,
}: BreakdownInsightListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={titleClassName}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${item}-${index}`} className="flex items-start">
              <span className={`mr-2 ${bulletClassName}`}>•</span>
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function BreakdownReportView({
  report,
}: {
  report: AnalysisReportOutput;
}) {
  return (
    <BreakdownPageContainer>
      <BreakdownPageHeader />
      <BreakdownOverallAssessment report={report} />
      <BreakdownExecutiveSummary summary={report.executiveSummary} />
      <BreakdownInsightList
        title="💪 نقاط القوة"
        titleClassName="text-green-700"
        bulletClassName="text-green-500"
        items={report.strengthsAnalysis}
      />
      <BreakdownInsightList
        title="⚠️ نقاط الضعف"
        titleClassName="text-red-700"
        bulletClassName="text-red-500"
        items={report.weaknessesIdentified}
      />
      <BreakdownInsightList
        title="🚀 فرص التحسين"
        titleClassName="text-blue-700"
        bulletClassName="text-blue-500"
        items={report.opportunitiesForImprovement}
      />
      <BreakdownInsightList
        title="⚡ التهديدات للتماسك"
        titleClassName="text-orange-700"
        bulletClassName="text-orange-500"
        items={report.threatsToCohesion}
      />
    </BreakdownPageContainer>
  );
}
