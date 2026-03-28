/**
 * @fileoverview الصفحة الرئيسية لاستوديو المخرجين
 *
 * السبب في تصميم هذه الصفحة كـ Client Component:
 * تحتاج إلى الوصول للمخزن المحلي (projectStore) و React Query hooks
 * لجلب بيانات المشروع الحالي بشكل ديناميكي.
 *
 * المنطق الرئيسي:
 * 1. جلب المشروع الحالي من المخزن المحلي
 * 2. تحميل المشاهد والشخصيات من الخادم
 * 3. عرض حالة التحميل أو المحتوى المناسب
 */
"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  hasActiveProject,
  prepareCharacterList,
  type CharacterTrackerProps,
  type ProjectCharacterInput,
  type SceneCardProps,
} from "./helpers/projectSummary";
import { PageLayout } from "./components/PageLayout";
import { LoadingSection } from "./components/LoadingSection";
import {
  useProjectScenes,
  useProjectCharacters,
} from "@/hooks/useProject";
import { getCurrentProject } from "@/lib/projectStore";

/**
 * القيم المسموحة لحالة المشهد
 * السبب: ضمان أمان النوع عند تحويل البيانات من API
 */
type ValidSceneStatus = "planned" | "in-progress" | "completed";
const VALID_SCENE_STATUSES: readonly ValidSceneStatus[] = [
  "planned",
  "in-progress",
  "completed",
] as const;
const DEFAULT_SCENE_STATUS: ValidSceneStatus = "planned";

/**
 * قسم عدم وجود مشروع - يُحمّل بشكل كسول
 * السبب: تقليل حجم الحزمة الأولية لأن هذا القسم لا يُعرض دائماً
 */
const NoProjectSection = dynamic(
  () =>
    import("./components/NoProjectSection").then(
      (mod) => ({ default: mod.NoProjectSection })
    ),
  {
    ssr: false,
  }
);

/**
 * محتوى المشروع - يُحمّل بشكل كسول
 * السبب: يحتوي على مكونات معقدة، والتحميل الكسول يحسن الأداء
 */
const ProjectContent = dynamic(
  () =>
    import("./components/ProjectContent").then(
      (mod) => ({ default: mod.ProjectContent })
    ),
  {
    ssr: false,
  }
);

/**
 * تطبيع حالة المشهد لضمان قيمة صالحة
 *
 * السبب: البيانات القادمة من API قد تحتوي على قيم غير صالحة
 * أو null، لذلك نحتاج التحقق والتحويل لقيمة آمنة
 *
 * @param status - حالة المشهد من API
 * @returns حالة المشهد المُطبّعة
 */
function normalizeSceneStatus(status?: string | null): ValidSceneStatus {
  if (
    status &&
    VALID_SCENE_STATUSES.includes(status as ValidSceneStatus)
  ) {
    return status as ValidSceneStatus;
  }
  return DEFAULT_SCENE_STATUS;
}

/**
 * الصفحة الرئيسية لاستوديو المخرجين
 *
 * السبب في وجود هذه الصفحة: توفير واجهة موحدة للمخرج
 * لإدارة المشاريع السينمائية بما في ذلك المشاهد والشخصيات واللقطات.
 *
 * تدفق البيانات:
 * 1. getCurrentProject() - جلب المشروع المُختار من المخزن المحلي
 * 2. useProjectScenes/useProjectCharacters - جلب البيانات من الخادم
 * 3. تحويل البيانات للأشكال المطلوبة للعرض
 * 4. عرض المحتوى المناسب حسب الحالة
 */
export default function DirectorsStudioPage() {
  const currentProject = getCurrentProject();
  const activeProjectKey = currentProject?.id ?? undefined;

  const { data: scenes, isLoading: scenesLoading } =
    useProjectScenes(activeProjectKey);
  const { data: characters, isLoading: charactersLoading } =
    useProjectCharacters(activeProjectKey);

  /**
   * تحويل قائمة المشاهد للشكل المطلوب
   * السبب في useMemo: تجنب إعادة الحساب في كل render
   * لأن التحويل قد يكون مكلفاً مع قوائم كبيرة
   */
  const scenesList: SceneCardProps[] = useMemo(() => {
    if (!Array.isArray(scenes)) {
      return [];
    }
    return scenes.map((scene) => ({
      ...scene,
      status: normalizeSceneStatus(scene.status),
    }));
  }, [scenes]);

  /**
   * تحويل قائمة الشخصيات للشكل المطلوب
   * السبب في useMemo: ملء القيم الافتراضية عملية يجب تجنب تكرارها
   */
  const charactersList: CharacterTrackerProps["characters"] = useMemo(() => {
    return prepareCharacterList(characters as ProjectCharacterInput | undefined);
  }, [characters]);

  /**
   * التحقق من حالة التحميل
   * السبب: عرض حالة تحميل موحدة أثناء جلب أي من البيانات
   */
  const isLoading = scenesLoading || charactersLoading;

  // حالة التحميل
  if (isLoading) {
    return (
      <PageLayout>
        <LoadingSection />
      </PageLayout>
    );
  }

  // حالة عدم وجود مشروع نشط
  if (!hasActiveProject(activeProjectKey ?? null, scenesList)) {
    return (
      <PageLayout>
        <NoProjectSection />
      </PageLayout>
    );
  }

  // عرض محتوى المشروع
  return (
    <PageLayout>
      <ProjectContent scenes={scenesList} characters={charactersList} />
    </PageLayout>
  );
}
