"use client";

import { HeroAnimation } from "@/components/HeroAnimation";
import { AppGrid } from "@/components/AppGrid";
import { useState } from "react";

export default function Page() {
  const [showApps, setShowApps] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-hidden">
      {!showApps ? (
        <HeroAnimation onContinue={() => setShowApps(true)} />
      ) : (
        <AppGrid />
      )}
    </main>
  );
}