"use client";

import { useEffect, useMemo, useState } from "react";
import { Clapperboard, FileText } from "lucide-react";
import appMetadata from "./metadata.json";
import { BreakdownLoadingState } from "./breakdown-ui";
import BreakdownApp from "./App";
import BreakdownContent from "./breakdown-content";

type BreakdownView = "workspace" | "report";

const VIEW_CONFIG: Array<{
  id: BreakdownView;
  label: string;
  description: string;
  icon: typeof Clapperboard;
}> = [
  {
    id: "workspace",
    label: "مساحة التفكيك",
    description: "واجهة تفكيك السيناريو الكاملة متعددة الوكلاء داخل المنصة.",
    icon: Clapperboard,
  },
  {
    id: "report",
    label: "التقرير",
    description: "عرض تقرير التحليل النهائي من نفس مسار المنصة.",
    icon: FileText,
  },
];

function ViewSwitcher({
  activeView,
  onSelect,
}: {
  activeView: BreakdownView;
  onSelect: (view: BreakdownView) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {VIEW_CONFIG.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onSelect(view.id)}
            aria-pressed={isActive}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{view.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function BreakdownPage() {
  const [activeView, setActiveView] = useState<BreakdownView>("workspace");
  const [isClientReady, setIsClientReady] = useState(false);

  const activeViewConfig = useMemo(
    () => VIEW_CONFIG.find((view) => view.id === activeView) ?? VIEW_CONFIG[0],
    [activeView]
  );

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">تطبيق المنصة</p>
              <h1 className="text-2xl font-bold text-foreground">
                {appMetadata.name}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {appMetadata.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeViewConfig.description}
              </p>
            </div>

            <ViewSwitcher activeView={activeView} onSelect={setActiveView} />
          </div>
        </div>
      </section>

      {!isClientReady ? (
        <BreakdownLoadingState />
      ) : activeView === "workspace" ? (
        <BreakdownApp />
      ) : (
        <BreakdownContent />
      )}
    </div>
  );
}
