/**
 * @module @the-copy/directors-studio
 *
 * Directors Studio package — re-exports all business logic
 * extracted from the directors-studio application module.
 */

// ─── Components ──────────────────────────────────────────────
export { default as AIChatPanel } from "./components/AIChatPanel";
export { AppSidebar } from "./components/AppSidebar";
export { default as CharacterFormDialog } from "./components/CharacterFormDialog";
export { default as CharacterTracker } from "./components/CharacterTracker";
export { default as DashboardHero } from "./components/DashboardHero";
export { DirectorsStudio, default as DirectorsStudioDefault } from "./components/DirectorsStudio";
export { LoadingSection } from "./components/LoadingSection";
export { NoProjectSection } from "./components/NoProjectSection";
export { PageLayout } from "./components/PageLayout";
export { ProjectContent } from "./components/ProjectContent";
export { default as ProjectManager } from "./components/ProjectManager";
export { default as ProjectStats } from "./components/ProjectStats";
export { ProjectTabs } from "./components/ProjectTabs";
export { default as SceneCard } from "./components/SceneCard";
export { default as SceneFormDialog } from "./components/SceneFormDialog";
export { default as ScriptUploadZone } from "./components/ScriptUploadZone";
export { default as ShotPlanningCard } from "./components/ShotPlanningCard";
export { default as ThemeToggle } from "./components/ThemeToggle";

// ─── Helpers ─────────────────────────────────────────────────
export {
  prepareCharacterList,
  hasActiveProject,
  calculateProjectStats,
} from "./helpers/projectSummary";

export type {
  SceneCardProps,
  CharacterTrackerProps,
  ProjectCharacterInput,
  ProjectStatsSummary,
} from "./helpers/projectSummary";

// ─── Lib (utilities & stores) ────────────────────────────────
export * from "./lib/projectStore";
export * from "./lib/queryClient";
export { cn } from "./lib/utils";

// ─── Shared (schema & types) ────────────────────────────────
export {
  users,
  insertUserSchema,
  projects,
  insertProjectSchema,
  scenes,
  insertSceneSchema,
  characters,
  insertCharacterSchema,
  shots,
  insertShotSchema,
} from "./shared/schema";

export type {
  InsertUser,
  User,
  InsertProject,
  Project,
  InsertScene,
  Scene,
  InsertCharacter,
  Character,
  InsertShot,
  Shot,
} from "./shared/schema";
