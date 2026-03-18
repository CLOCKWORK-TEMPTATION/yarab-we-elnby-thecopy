// @the-copy/prompt-engineering
// Main entry point — re-export all public APIs

// ─── Types ───────────────────────────────────────────────────────────
export type {
  PromptMetrics,
  PromptAnalysis,
  PromptCategory,
  PromptEnhancementOptions,
  EnhancedPrompt,
  PromptTemplate,
  TemplateVariable,
  PromptTestResult,
  TestCase,
  PromptComparison,
  PromptSession,
  PromptHistoryEntry,
} from './types';

// ─── Lib / Services ──────────────────────────────────────────────────

// prompt-analyzer
export {
  analyzePrompt,
  comparePrompts,
  generateEnhancementSuggestions,
} from './lib/prompt-analyzer';

// prompt-data (templates & helpers)
export {
  defaultPromptTemplates,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByLanguage,
  renderTemplate,
  validateTemplateVariables,
  extractTemplateVariables,
} from './lib/prompt-data';

// gemini-service (client-side wrapper)
export type { PromptStudioGeminiConfig } from './lib/gemini-service';
export {
  createPromptStudioGeminiService,
  generatePromptAnalysis,
  estimateTokenCount,
  estimatePromptCost,
  validatePrompt,
} from './lib/gemini-service';

// data-manager
export { DataManager } from './lib/data-manager';

// ─── Components ──────────────────────────────────────────────────────
export { CreativeWritingStudio } from './components/CreativeWritingStudio';
export { PromptLibrary } from './components/PromptLibrary';
export { WritingEditor } from './components/WritingEditor';
export { SettingsPanel } from './components/SettingsPanel';

// ─── UI / Loading ────────────────────────────────────────────────────
export { default as Loading } from './loading';
