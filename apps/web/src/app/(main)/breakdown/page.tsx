"use client";

/** صفحة التفكيك الرئيسية — نقطة الدخول لتطبيق تفكيك السيناريو */

import { useEffect, useMemo, useState } from "react";
import appMetadata from "./metadata.json";
import { BreakdownLoadingState } from "./breakdown-ui";
import BreakdownApp from "./App";
import BreakdownContent from "./breakdown-content";
import { ViewSwitcher, VIEW_CONFIG, type BreakdownView } from "./presentation/shared/view-switcher";

export default function BreakdownPage() {
  const [activeView, setActiveView] = useState<BreakdownView>("workspace");
  const [isClientReady, setIsClientReady] = useState(false);
  const activeViewConfig = useMemo(
    () => VIEW_CONFIG.find((v) => v.id === activeView) ?? VIEW_CONFIG[0],
    [activeView]
  );
  useEffect(() => { setIsClientReady(true); }, []);

  return (
    <div className="space-y-6 pb-8">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">تطبيق المنصة</p>
              <h1 className="text-2xl font-bold text-foreground">{appMetadata.name}</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{appMetadata.description}</p>
              <p className="text-xs text-muted-foreground">{activeViewConfig.description}</p>
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
