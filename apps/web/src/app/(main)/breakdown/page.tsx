"use client";

import dynamic from "next/dynamic";

const BreakdownContent = dynamic(() => import("./breakdown-content"), {
  loading: () => (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل تقرير التحليل...</p>
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

export default function BreakdownPage() {
  return <BreakdownContent />;
}
