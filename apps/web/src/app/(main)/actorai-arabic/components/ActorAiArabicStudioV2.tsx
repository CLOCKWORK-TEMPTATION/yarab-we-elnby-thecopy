"use client";

import { lazy, Suspense, useMemo } from "react";
import { AppProvider, useApp } from "../context/AppContext";
import { AppHeader } from "../layout/AppHeader";
import { AppFooter } from "../layout/AppFooter";
import { NotificationBanner } from "../layout/NotificationBanner";
import type { ViewType } from "../types";

// Lazy-loaded feature views
const HomeView = lazy(() =>
  import("../features/home").then((m) => ({ default: m.HomeView })),
);
const DemoView = lazy(() =>
  import("../features/demo").then((m) => ({ default: m.DemoView })),
);
const LoginForm = lazy(() =>
  import("../features/auth").then((m) => ({ default: m.LoginForm })),
);
const RegisterForm = lazy(() =>
  import("../features/auth").then((m) => ({ default: m.RegisterForm })),
);
const VocalExercisesView = lazy(() =>
  import("../features/vocal").then((m) => ({
    default: m.VocalExercisesView,
  })),
);
const VoiceCoachView = lazy(() =>
  import("../features/voicecoach").then((m) => ({
    default: m.VoiceCoachView,
  })),
);
const SceneRhythmView = lazy(() =>
  import("../features/rhythm").then((m) => ({
    default: m.SceneRhythmView,
  })),
);
const WebcamAnalysisView = lazy(() =>
  import("../features/webcam").then((m) => ({
    default: m.WebcamAnalysisView,
  })),
);
const ARTrainingView = lazy(() =>
  import("../features/ar").then((m) => ({ default: m.ARTrainingView })),
);
const DashboardView = lazy(() =>
  import("../features/dashboard").then((m) => ({
    default: m.DashboardView,
  })),
);
const MemorizationView = lazy(() =>
  import("../features/memorization").then((m) => ({
    default: m.MemorizationView,
  })),
);

const VIEW_MAP: Record<
  string,
  React.LazyExoticComponent<React.ComponentType>
> = {
  home: HomeView,
  demo: DemoView,
  login: LoginForm,
  register: RegisterForm,
  vocal: VocalExercisesView,
  voicecoach: VoiceCoachView,
  rhythm: SceneRhythmView,
  webcam: WebcamAnalysisView,
  ar: ARTrainingView,
  dashboard: DashboardView,
  memorization: MemorizationView,
};

function ViewSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  );
}

function AppShell() {
  const { currentView, theme } = useApp();
  const ViewComponent = useMemo(
    () => VIEW_MAP[currentView as string] ?? HomeView,
    [currentView],
  );

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "dark bg-gray-900" : "bg-gray-50"}`}
      dir="rtl"
    >
      <AppHeader />
      <NotificationBanner />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<ViewSkeleton />}>
          <ViewComponent />
        </Suspense>
      </main>
      <AppFooter />
    </div>
  );
}

export default function ActorAiArabicStudioV2() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

// Named export for backward compatibility
export { ActorAiArabicStudioV2 as ActorAiArabicStudio };
