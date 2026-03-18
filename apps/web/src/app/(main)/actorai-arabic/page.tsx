"use client";

import dynamic from "next/dynamic";

const ActorAiArabicStudio = dynamic(
  () =>
    import("@the-copy/actorai").then((mod) => ({
      default: mod.ActorAiArabicStudio,
    })),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل استوديو الممثل...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function ActoraiArabicPage() {
  return <ActorAiArabicStudio />;
}
