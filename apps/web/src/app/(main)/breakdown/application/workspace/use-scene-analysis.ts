import { useCallback, useMemo, useState } from "react";
import type { Scene, SceneBreakdown, ScenarioAnalysis, Version } from "../../domain/models";
import { AGENTS } from "../../constants";
import { logError } from "../../domain/errors";
import { analyzeScene } from "../../infrastructure/gemini/analyze-scene";
import { analyzeProductionScenarios } from "../../infrastructure/gemini/analyze-scenarios";

interface UseSceneAnalysisOptions {
  scenes: Scene[];
  onUpdateScene: (
    id: number,
    breakdown: SceneBreakdown | undefined,
    scenarios?: ScenarioAnalysis
  ) => void;
  onRestoreVersion: (sceneId: number, versionId: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

export function useSceneAnalysis({
  scenes,
  onUpdateScene,
  onRestoreVersion,
  success,
  error,
}: UseSceneAnalysisOptions) {
  const [expandedSceneId, setExpandedSceneId] = useState<number | null>(
    scenes.length > 0 ? scenes[0].id : null
  );
  const [analyzingIds, setAnalyzingIds] = useState<Set<number>>(new Set());
  const [strategizingIds, setStrategizingIds] = useState<Set<number>>(new Set());
  const [showNavigatorForScene, setShowNavigatorForScene] = useState<number | null>(
    null
  );
  const [previewVersion, setPreviewVersion] = useState<Record<number, string | null>>(
    {}
  );

  const toggleScene = useCallback((id: number) => {
    setExpandedSceneId((prev) => (prev === id ? null : id));
  }, []);

  const handleAnalyzeScene = useCallback(
    async (scene: Scene) => {
      if (analyzingIds.has(scene.id)) {
        return;
      }

      setAnalyzingIds((prev) => new Set(prev).add(scene.id));
      setExpandedSceneId(scene.id);
      setPreviewVersion((prev) => ({ ...prev, [scene.id]: null }));

      try {
        const breakdown = await analyzeScene(scene.content);
        onUpdateScene(scene.id, breakdown, scene.scenarios);
        success("تم تحليل المشهد بنجاح");
      } catch (err) {
        logError("useSceneAnalysis.handleAnalyzeScene", err);
        const errorMessage = err instanceof Error ? err.message : "خطأ غير معروف";
        error(`فشل التحليل: ${errorMessage}`);
      } finally {
        setAnalyzingIds((prev) => {
          const next = new Set(prev);
          next.delete(scene.id);
          return next;
        });
      }
    },
    [analyzingIds, error, onUpdateScene, success]
  );

  const handleRunStrategy = useCallback(
    async (scene: Scene) => {
      if (strategizingIds.has(scene.id)) {
        return;
      }

      setStrategizingIds((prev) => new Set(prev).add(scene.id));

      try {
        const scenarios = await analyzeProductionScenarios(scene.content);
        onUpdateScene(scene.id, scene.analysis, scenarios);
        setShowNavigatorForScene(scene.id);
        success("تم توليد السيناريوهات بنجاح");
      } catch (err) {
        logError("useSceneAnalysis.handleRunStrategy", err);
        const errorMessage = err instanceof Error ? err.message : "خطأ غير معروف";
        error(`فشل تحليل السيناريوهات: ${errorMessage}`);
      } finally {
        setStrategizingIds((prev) => {
          const next = new Set(prev);
          next.delete(scene.id);
          return next;
        });
      }
    },
    [error, onUpdateScene, strategizingIds, success]
  );

  const handleVersionSelect = useCallback((sceneId: number, versionId: string | null) => {
    setPreviewVersion((prev) => ({ ...prev, [sceneId]: versionId }));
  }, []);

  const handleRestoreClick = useCallback(
    (sceneId: number, versionId: string) => {
      if (
        window.confirm(
          "هل أنت متأكد من استعادة هذه النسخة؟ سيتم حفظ الوضع الحالي كنسخة جديدة."
        )
      ) {
        onRestoreVersion(sceneId, versionId);
        setPreviewVersion((prev) => ({ ...prev, [sceneId]: null }));
        success("تم استعادة النسخة بنجاح");
      }
    },
    [onRestoreVersion, success]
  );

  const activeSceneForNavigator = useMemo(
    () => scenes.find((scene) => scene.id === showNavigatorForScene),
    [scenes, showNavigatorForScene]
  );

  const activeNavigatorVersionId = showNavigatorForScene
    ? previewVersion[showNavigatorForScene]
    : null;

  const activeNavigatorData = useMemo(() => {
    if (!activeSceneForNavigator) return null;
    return activeNavigatorVersionId
      ? activeSceneForNavigator.versions?.find(
          (version) => version.id === activeNavigatorVersionId
        )
      : activeSceneForNavigator;
  }, [activeNavigatorVersionId, activeSceneForNavigator]);

  const breakdownAgents = useMemo(
    () => AGENTS.filter((agent) => agent.type === "breakdown"),
    []
  );

  const resolveActiveSceneData = useCallback(
    (scene: Scene): Scene | Version | undefined => {
      const activeVersionId = previewVersion[scene.id];
      return activeVersionId
        ? scene.versions?.find((version) => version.id === activeVersionId)
        : scene;
    },
    [previewVersion]
  );

  return {
    expandedSceneId,
    analyzingIds,
    strategizingIds,
    showNavigatorForScene,
    previewVersion,
    activeNavigatorData,
    breakdownAgents,
    setShowNavigatorForScene,
    toggleScene,
    handleAnalyzeScene,
    handleRunStrategy,
    handleVersionSelect,
    handleRestoreClick,
    resolveActiveSceneData,
  };
}
