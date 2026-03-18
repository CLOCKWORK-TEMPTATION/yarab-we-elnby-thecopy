/**
 * @the-copy/budget
 *
 * Budget management package for film production budgeting.
 * Provides types, services, components, and utilities for
 * script-based budget generation and analysis.
 */

// ── Types & Schemas ──────────────────────────────────────────────
export type {
  LineItem,
  Category,
  Section,
  Budget,
  SecurityRisk,
  ProcessingStatus,
  SavedBudget,
  BudgetTemplate,
  ChartData,
  ExportOptions,
  UserPreferences,
  ComparisonData,
  AnalyticsData,
} from './lib/types';

export {
  LineItemSchema,
  CategorySchema,
  SectionSchema,
  BudgetMetadataSchema,
  BudgetSchema,
  GenerateBudgetRequestSchema,
  AIAnalysisSchema,
} from './lib/types';

// ── Constants ────────────────────────────────────────────────────
export {
  INITIAL_BUDGET_TEMPLATE,
  BUDGET_TEMPLATES,
  COLOR_PALETTE,
  TRANSLATIONS,
} from './lib/constants';

// ── Services ─────────────────────────────────────────────────────
export {
  GeminiService,
  geminiService,
  generateBudgetFromScript,
  validateBudgetStructure,
} from './lib/geminiService';

// ── Utilities ────────────────────────────────────────────────────
export { cn } from './lib/utils';

// ── Components ───────────────────────────────────────────────────
export { BudgetAnalytics } from './components/BudgetAnalytics';
export { default as BudgetApp } from './components/BudgetApp';
export { DetailView } from './components/DetailView';
export { EnhancedChart } from './components/EnhancedChart';
export { ExportModal } from './components/ExportModal';
export { ScriptAnalyzer } from './components/ScriptAnalyzer';
export { TemplateSelector } from './components/TemplateSelector';
export { TopSheet } from './components/TopSheet';

// ── UI Primitives ────────────────────────────────────────────────
export {
  Badge,
  badgeVariants,
  Button,
  buttonVariants,
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Textarea,
} from './components/ui';

export type { BadgeProps, ButtonProps } from './components/ui';

// ── API Route Handlers ───────────────────────────────────────────
export {
  exportBudgetHandler,
  generateBudgetHandler,
} from './app';
