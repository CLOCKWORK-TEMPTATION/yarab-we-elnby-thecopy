// @the-copy/cinefit — main entry point
// Re-exports all public components, services, contexts, types, and utilities

// ─── Types ───────────────────────────────────────────────────────────
export * from "./types";

// ─── Lib / Utilities ─────────────────────────────────────────────────
export * from "./lib/utils";

// ─── Data ────────────────────────────────────────────────────────────
export * from "./data/mockHistoricalData";

// ─── Wardrobe logic ──────────────────────────────────────────────────
export * from "./wardrobe";

// ─── Services ────────────────────────────────────────────────────────
export * from "./services/geminiService";
export * from "./services/rulesEngine";
export * from "./services/techPackService";

// ─── Contexts ────────────────────────────────────────────────────────
export * from "./contexts/ProjectContext";

// ─── Components ──────────────────────────────────────────────────────
export * from "./components/AddProductModal";
export * from "./components/AdjustmentPanel";
export * from "./components/Canvas";
export * from "./components/ContinuityTimeline";
export * from "./components/CropPanel";
export * from "./components/CurrentOutfitPanel";
export * from "./components/Dashboard";
export * from "./components/DebugModal";
export * from "./components/EditorCanvas";
export * from "./components/FilterPanel";
export * from "./components/FittingRoom";
export * from "./components/Footer";
export * from "./components/Header";
export * from "./components/icons";
export * from "./components/ImageUploader";
export * from "./components/LightingStudio";
export * from "./components/LoadingOverlay";
export * from "./components/ObjectCard";
export * from "./components/OutfitStack";
export * from "./components/PosePanel";
export * from "./components/ProductSelector";
export * from "./components/Spinner";
export * from "./components/StartScreen";
export * from "./components/TechPackView";
export * from "./components/ToolOptions";
export * from "./components/Toolbar";
export * from "./components/WardrobeModal";
export * from "./components/WardrobeSheet";
export * from "./components/WebGLErrorBoundary";

// ─── UI primitives ──────────────────────────────────────────────────
export * from "./components/ui/compare";
export * from "./components/ui/sparkles";

// ─── App-level modules ──────────────────────────────────────────────
export * from "./cinefit-app";
export * from "./new-feature";
