"use client";

import dynamic from "next/dynamic";

const CreativeWritingStudio = dynamic(
  () =>
    import("@the-copy/creative-writing").then((mod) => ({
      default: mod.CreativeWritingStudio,
    })),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            جاري تحميل استوديو الكتابة الإبداعية...
          </p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function ArabicCreativeWritingStudioPage() {
  return <CreativeWritingStudio />;
}
