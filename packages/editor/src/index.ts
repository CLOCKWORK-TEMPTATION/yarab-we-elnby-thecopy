// @the-copy/editor — main entry point
// Contains the extracted editor business logic as a standalone workspace package.
// These are real source files (classes, handlers, helpers, components, types, config)
// that live in packages/editor/src/ — NOT re-exports from apps/web.
// Consumed by apps/web and potentially other apps via workspace:* dependency.

// ─── Types ───────────────────────────────────────────────────────────────────
export * from './types/types';

// ─── Config ──────────────────────────────────────────────────────────────────
export * from './config';

// ─── Classes ─────────────────────────────────────────────────────────────────
export { AIWritingAssistant } from './classes/AIWritingAssistant';
export * from './classes/ScreenplayClassifier';

// ─── Classes / Systems ───────────────────────────────────────────────────────
export { AdvancedSearchEngine } from './classes/systems/AdvancedSearchEngine';
export { AutoSaveManager } from './classes/systems/AutoSaveManager';
export { CollaborationSystem } from './classes/systems/CollaborationSystem';
export { ProjectManager } from './classes/systems/ProjectManager';
export { SmartImportSystem } from './classes/systems/SmartImportSystem';
export { StateManager } from './classes/systems/StateManager';
export { VisualPlanningSystem } from './classes/systems/VisualPlanningSystem';

// ─── Handlers ────────────────────────────────────────────────────────────────
export * from './handlers/handleAIReview';
export * from './handlers/handleCharacterRename';
export * from './handlers/handleKeyDown';
export * from './handlers/handleReplace';
export * from './handlers/handleSearch';

// ─── Helpers ─────────────────────────────────────────────────────────────────
export * from './helpers/SceneHeaderAgent';
export * from './helpers/applyFormatToCurrentLine';
export * from './helpers/formatText';
export * from './helpers/getFormatStyles';
export * from './helpers/handlePaste';
export * from './helpers/postProcessFormatting';

// ─── Modules ─────────────────────────────────────────────────────────────────
export * from './modules/domTextReplacement';

// ─── Components ──────────────────────────────────────────────────────────────
export { default as AdvancedAgentsPopup } from './components/AdvancedAgentsPopup';
export { default as ExportDialog } from './components/ExportDialog';
export { default as ScreenplayEditorEnhanced } from './components/ScreenplayEditorEnhanced';
