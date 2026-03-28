"use client";

import dynamic from "next/dynamic";

/**
 * V2 shell — decomposed modular architecture
 * Replaces monolith import from @the-copy/actorai
 * Original: import("@the-copy/actorai").then(mod => mod.ActorAiArabicStudio)
 */
const ActorAiArabicStudio = dynamic(
  () => import("./components/ActorAiArabicStudioV2"),
  {
    loading: () => (
      <main className="min-h-screen flex items-center justify-center" role="main">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل استوديو الممثل...</p>
        </div>
      </main>
    ),
    ssr: false,
  }
);

export default function ActoraiArabicPage() {
  return <ActorAiArabicStudio />;
}
