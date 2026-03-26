import { useCallback, useMemo, useState } from "react";
import type {
  Scene,
  SceneBreakdown,
  ScenarioAnalysis,
  Version,
} from "../../domain/models";
import { validateScriptSegmentResponse } from "../../domain/schemas";
import { logError } from "../../domain/errors";
import { MOCK_SCRIPT } from "../../domain/constants";
import { AGENTS } from "../../constants";
import { segmentScript } from "../../infrastructure/gemini/segment-script";
import { useToastQueue } from "./use-toast-queue";

export interface ScriptError {
  message: string;
  code:
    | "EMPTY_SCRIPT"
    | "API_ERROR"
    | "PARSE_ERROR"
    | "VALIDATION_ERROR"
    | "NO_SCENES";
}

export function useScriptWorkspace() {
  const [scriptText, setScriptText] = useState(MOCK_SCRIPT);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [error, setError] = useState<ScriptError | null>(null);
  const [view, setView] = useState<"input" | "results">("input");
  const toast = useToastQueue();

  const processScript = useCallback(async () => {
    if (!scriptText.trim()) {
      const nextError: ScriptError = {
        message: "الرجاء إدخال نص السيناريو",
        code: "EMPTY_SCRIPT",
      };
      setError(nextError);
      toast.error(nextError.message);
      return false;
    }

    setIsSegmenting(true);
    setError(null);

    try {
      const response = await segmentScript(scriptText);
      const validationResult = validateScriptSegmentResponse(response);

      if (!validationResult.success) {
        const nextError: ScriptError = {
          message: `خطأ في تنسيق البيانات: ${validationResult.error}`,
          code: "VALIDATION_ERROR",
        };
        setError(nextError);
        toast.error(nextError.message);
        return false;
      }

      const nextScenes: Scene[] = validationResult.data.scenes.map(
        (scene, index) => ({
          id: index + 1,
          header: scene.header,
          content: scene.content,
          isAnalyzed: false,
          versions: [],
        })
      );

      if (nextScenes.length === 0) {
        const nextError: ScriptError = {
          message:
            "لم يتم اكتشاف أي مشاهد في السيناريو. تأكد من تنسيق السيناريو.",
          code: "NO_SCENES",
        };
        setError(nextError);
        toast.error(nextError.message);
        return false;
      }

      setScenes(nextScenes);
      setView("results");
      return true;
    } catch (err) {
      logError("useScriptWorkspace.processScript", err);
      const nextError: ScriptError = {
        message: `خطأ في معالجة السيناريو: ${
          err instanceof Error ? err.message : "خطأ غير معروف"
        }`,
        code: "API_ERROR",
      };
      setError(nextError);
      toast.error(nextError.message);
      return false;
    } finally {
      setIsSegmenting(false);
    }
  }, [scriptText, toast]);

  const updateScene = useCallback(
    (
      id: number,
      breakdown?: SceneBreakdown,
      scenarios?: ScenarioAnalysis
    ) => {
      setScenes((prev) =>
        prev.map((scene) => {
          if (scene.id !== id) return scene;

          const oldVersions = scene.versions || [];
          const newVersions = [...oldVersions];

          if (scene.isAnalyzed && (scene.analysis || scene.scenarios)) {
            const newVersion: Version = {
              id: Date.now().toString(),
              timestamp: Date.now(),
              label: `نسخة ${oldVersions.length + 1} - ${new Date().toLocaleTimeString(
                "ar-EG"
              )}`,
              analysis: scene.analysis,
              scenarios: scene.scenarios,
            };
            newVersions.unshift(newVersion);
          }

          return {
            ...scene,
            isAnalyzed: !!breakdown || !!scene.analysis,
            analysis: breakdown || scene.analysis,
            scenarios: scenarios || scene.scenarios,
            versions: newVersions,
          };
        })
      );
    },
    []
  );

  const restoreVersion = useCallback((sceneId: number, versionId: string) => {
    setScenes((prev) =>
      prev.map((scene) => {
        if (scene.id !== sceneId || !scene.versions) return scene;

        const versionToRestore = scene.versions.find(
          (version) => version.id === versionId
        );
        if (!versionToRestore) return scene;

        const currentVersion: Version = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          label: `نسخة ما قبل الاستعادة (${new Date().toLocaleTimeString(
            "ar-EG"
          )})`,
          analysis: scene.analysis,
          scenarios: scene.scenarios,
        };

        return {
          ...scene,
          analysis: versionToRestore.analysis,
          scenarios: versionToRestore.scenarios,
          versions: [currentVersion, ...scene.versions],
        };
      })
    );
  }, []);

  const resetWorkspace = useCallback(() => {
    setView("input");
    setScenes([]);
    setError(null);
  }, []);

  const previewAgents = useMemo(
    () => AGENTS.filter((agent) => agent.type === "breakdown").slice(0, 4),
    []
  );

  return {
    scriptText,
    setScriptText,
    scenes,
    setScenes,
    isSegmenting,
    error,
    view,
    processScript,
    updateScene,
    restoreVersion,
    resetWorkspace,
    clearError: () => setError(null),
    previewAgents,
    toast,
  };
}
