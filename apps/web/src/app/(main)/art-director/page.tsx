"use client";

import dynamic from "next/dynamic";

const ArtDirectorStudio = dynamic(() => import("./art-director-studio"), {
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e94560] mx-auto mb-4"></div>
        <p className="text-white/60">جاري تحميل CineArchitect...</p>
      </div>
    </div>
  ),
  ssr: false,
});

export default function ArtDirectorPage() {
  return <ArtDirectorStudio />;
}


