/**
 * @the-copy/art-director
 * حزمة Art Director - نقطة الدخول الرئيسية
 *
 * تُعيد تصدير جميع الوحدات العامة من الحزمة:
 * - Types & Schemas (أنواع البيانات ومخططات Zod)
 * - Core (PluginManager, toolConfigs)
 * - API routes
 * - Hooks (useApi, usePlugins)
 * - Plugins (16 إضافة متخصصة)
 * - Components (مكونات واجهة المستخدم)
 * - Pages (صفحات التطبيق)
 * - App-level modules (App, ArtDirectorStudio, main)
 */

// ──────────────────────────────────────────────
// Types & Schemas
// ──────────────────────────────────────────────
export * from './types';

// ──────────────────────────────────────────────
// Core
// ──────────────────────────────────────────────
export { PluginManager, pluginManager } from './core/PluginManager';
export {
  toolConfigs,
  type ToolInputOption,
  type ToolInput,
  type ToolConfig,
  type ToolId,
} from './core/toolConfigs';

// ──────────────────────────────────────────────
// API
// ──────────────────────────────────────────────
export { router } from './api/routes';

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────
export { usePlugins } from './hooks/usePlugins';
export { useApi, useApiCall } from './hooks/useApi';

// ──────────────────────────────────────────────
// Plugins
// ──────────────────────────────────────────────
export {
  BudgetOptimizer,
  budgetOptimizer,
} from './plugins/budget-optimizer';
export {
  CinemaSkillsTrainer,
  cinemaSkillsTrainer,
} from './plugins/cinema-skills-trainer';
export {
  CollaborativeReviewPlatform,
  collaborativeReview,
} from './plugins/collaborative-review';
export {
  CreativeInspirationAssistant,
  creativeInspiration,
} from './plugins/creative-inspiration';
export {
  AutomaticDocumentationGenerator,
  documentationGenerator,
} from './plugins/documentation-generator';
export {
  ImmersiveConceptArt,
  immersiveConceptArt,
} from './plugins/immersive-concept-art';
export {
  LightingSimulator,
  lightingSimulator,
} from './plugins/lighting-simulator';
export {
  LocationSetCoordinator,
  locationCoordinator,
} from './plugins/location-coordinator';
export {
  MRPrevizStudio,
  mrPrevizStudio,
} from './plugins/mr-previz-studio';
export {
  ProductionReadinessReportPromptBuilder,
  productionReadinessReportPromptBuilder,
} from './plugins/production-readiness-report';
export {
  PerformanceProductivityAnalyzer,
  productivityAnalyzer,
} from './plugins/productivity-analyzer';
export {
  RiskAnalyzer,
  riskAnalyzer,
} from './plugins/risk-analyzer';
export {
  SetReusabilityOptimizer,
  setReusability,
} from './plugins/set-reusability';
export {
  TerminologyTranslator,
  terminologyTranslator,
} from './plugins/terminology-translator';
export {
  VirtualProductionEngine,
  virtualProductionEngine,
} from './plugins/virtual-production-engine';
export {
  VirtualSetEditor,
  virtualSetEditor,
} from './plugins/virtual-set-editor';
export {
  VisualConsistencyAnalyzer,
  visualAnalyzer,
} from './plugins/visual-analyzer';

// ──────────────────────────────────────────────
// Components
// ──────────────────────────────────────────────
export { default as DashboardComponent } from './components/Dashboard';
export { default as DocumentationComponent } from './components/Documentation';
export { default as InspirationComponent } from './components/Inspiration';
export { default as LayoutComponent } from './components/Layout';
export { default as LocationsComponent } from './components/Locations';
export { default as ProductivityComponent } from './components/Productivity';
export { default as SetsComponent } from './components/Sets';
export { default as ToolsComponent } from './components/Tools';

// ──────────────────────────────────────────────
// Pages
// ──────────────────────────────────────────────
export { default as DashboardPage } from './pages/Dashboard';
export { default as DocumentationPage } from './pages/Documentation';
export { default as InspirationPage } from './pages/Inspiration';
export { default as LocationsPage } from './pages/Locations';
export { default as ProductivityPage } from './pages/Productivity';
export { default as SetsPage } from './pages/Sets';
export { default as ToolsPage } from './pages/Tools';

// ──────────────────────────────────────────────
// App-level modules
// ──────────────────────────────────────────────
export { default as App } from './App';
export { default as ArtDirectorStudio } from './art-director-studio';
