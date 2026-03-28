import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Clapperboard,
  FileStack,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BreakdownReportOutput } from "../../domain/schemas";

const PAGE_CONTAINER_CLASS = "container mx-auto max-w-6xl p-6";

type BreakdownStateProps = {
  title?: string;
  message: string;
};

function BreakdownPageContainer({ children }: { children: ReactNode }) {
  return <div className={`${PAGE_CONTAINER_CLASS} space-y-6`}>{children}</div>;
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4 text-center">
      <div className="text-2xl font-bold text-foreground">{value}</div>
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
          <p className="text-muted-foreground">جاري تحميل تقرير البريك دون...</p>
        </div>
      </div>
    </div>
  );
}

export function BreakdownMessageState({
  title = "تقرير البريك دون",
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

function BreakdownPageHeader({ report }: { report: BreakdownReportOutput }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Clapperboard className="h-6 w-6 text-primary" />
              {report.title}
            </CardTitle>
            <CardDescription>
              تقرير بريك دون معتمد من الخادم بتاريخ
              {" "}
              {new Date(report.updatedAt).toLocaleString("ar-EG")}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {report.source}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="leading-7 text-muted-foreground">{report.summary}</p>
      </CardContent>
    </Card>
  );
}

function BreakdownSummary({ report }: { report: BreakdownReportOutput }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <SummaryMetric label="عدد المشاهد" value={report.sceneCount} />
      <SummaryMetric label="إجمالي الصفحات" value={report.totalPages} />
      <SummaryMetric
        label="أيام التصوير المقدرة"
        value={report.totalEstimatedShootDays}
      />
      <SummaryMetric
        label="فئات العناصر"
        value={Object.keys(report.elementsByCategory).length}
      />
    </div>
  );
}

function BreakdownWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          التحذيرات العامة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2">
              <span className="mt-1 text-amber-500">•</span>
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function BreakdownSchedule({ report }: { report: BreakdownReportOutput }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          الجدولة الأولية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.schedule.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد بيانات جدولة حالياً.</p>
        ) : (
          report.schedule.map((day) => (
            <div
              key={`${day.dayNumber}-${day.location}-${day.timeOfDay}`}
              className="rounded-xl border border-border/70 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge>اليوم {day.dayNumber}</Badge>
                <Badge variant="outline">{day.location}</Badge>
                <Badge variant="outline">{day.timeOfDay}</Badge>
                <Badge variant="secondary">{day.estimatedHours} ساعة</Badge>
                <Badge variant="secondary">{day.totalPages} صفحة</Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {day.scenes.map((scene) => (
                  <div
                    key={`${day.dayNumber}-${scene.sceneId}`}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <span className="font-medium text-foreground">
                      المشهد
                      {" "}
                      {scene.sceneNumber}
                    </span>
                    <span>{scene.header}</span>
                    <span className="text-xs">
                      {scene.estimatedHours}
                      {" "}
                      ساعة
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownScenes({ report }: { report: BreakdownReportOutput }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileStack className="h-5 w-5 text-primary" />
          ملخص المشاهد
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.scenes.map((scene) => (
          <div
            key={scene.sceneId}
            className="rounded-xl border border-border/70 bg-background/60 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge>المشهد {scene.headerData.sceneNumber}</Badge>
              <Badge variant="outline">{scene.headerData.sceneType}</Badge>
              <Badge variant="outline">{scene.headerData.timeOfDay}</Badge>
              <Badge variant="outline">
                <MapPin className="mr-1 h-3 w-3" />
                {scene.headerData.location}
              </Badge>
              <Badge variant="secondary">{scene.headerData.pageCount} صفحة</Badge>
              <Badge variant="secondary">
                اليوم الدرامي
                {" "}
                {scene.headerData.storyDay}
              </Badge>
              {scene.analysis.source && (
                <Badge variant="secondary">{scene.analysis.source}</Badge>
              )}
            </div>

            <h3 className="mb-2 text-lg font-semibold">{scene.header}</h3>
            <p className="mb-3 text-sm leading-6 text-muted-foreground">
              {scene.analysis.summary}
            </p>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border/60 p-3 text-sm">
                <p className="font-medium text-foreground">الشخصيات</p>
                <p className="text-muted-foreground">
                  {scene.analysis.cast.length}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-3 text-sm">
                <p className="font-medium text-foreground">العناصر الفنية</p>
                <p className="text-muted-foreground">
                  {scene.analysis.elements.length}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-3 text-sm">
                <p className="font-medium text-foreground">البدائل الإنتاجية</p>
                <p className="text-muted-foreground">
                  {scene.scenarios.scenarios.length}
                </p>
              </div>
            </div>

            {scene.analysis.warnings.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-700">
                  <ShieldAlert className="h-4 w-4" />
                  تحذيرات المشهد
                </p>
                <ul className="space-y-1 text-sm text-amber-900/80 dark:text-amber-100/80">
                  {scene.analysis.warnings.map((warning) => (
                    <li key={`${scene.sceneId}-${warning}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BreakdownReportView({
  report,
}: {
  report: BreakdownReportOutput;
}) {
  return (
    <BreakdownPageContainer>
      <BreakdownPageHeader report={report} />
      <BreakdownSummary report={report} />
      <BreakdownWarnings warnings={report.warnings} />
      <BreakdownSchedule report={report} />
      <BreakdownScenes report={report} />
    </BreakdownPageContainer>
  );
}
