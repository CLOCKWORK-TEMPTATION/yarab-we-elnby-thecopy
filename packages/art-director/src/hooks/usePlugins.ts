/**
 * usePlugins - Hook مخصص لإدارة الإضافات
 * 
 * @description يوفر هذا الـ Hook واجهة موحدة لجلب وإدارة الإضافات من API
 * يتضمن معالجة الأخطاء وحالات التحميل والبيانات الافتراضية
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { PluginInfo, PluginsApiResponseSchema } from "../types";

/**
 * الإضافات الافتراضية المستخدمة عند فشل الاتصال بـ API
 */
const DEFAULT_PLUGINS: PluginInfo[] = [
  { id: "visual-analyzer", name: "Visual Analyzer", nameAr: "محلل الاتساق البصري", category: "التحليل" },
  { id: "terminology-translator", name: "Terminology Translator", nameAr: "مترجم المصطلحات", category: "الترجمة" },
  { id: "budget-optimizer", name: "Budget Optimizer", nameAr: "محسّن الميزانية", category: "الإدارة" },
  { id: "lighting-simulator", name: "Lighting Simulator", nameAr: "محاكي الإضاءة", category: "التصميم" },
  { id: "risk-analyzer", name: "Risk Analyzer", nameAr: "محلل المخاطر", category: "التحليل" },
  { id: "creative-inspiration", name: "Creative Inspiration", nameAr: "الإلهام الإبداعي", category: "التصميم" },
  { id: "location-coordinator", name: "Location Coordinator", nameAr: "منسق المواقع", category: "الإدارة" },
  { id: "set-reusability", name: "Set Reusability", nameAr: "إعادة استخدام الديكور", category: "الاستدامة" },
  { id: "documentation-generator", name: "Documentation Generator", nameAr: "مولد التوثيق", category: "التوثيق" },
];

/**
 * واجهة حالة الـ Hook
 */
interface UsePluginsState {
  /** قائمة الإضافات */
  plugins: PluginInfo[];
  /** حالة التحميل */
  loading: boolean;
  /** رسالة الخطأ إن وجدت */
  error: string | null;
}

/**
 * واجهة قيمة الإرجاع من الـ Hook
 */
interface UsePluginsReturn extends UsePluginsState {
  /** دالة لإعادة جلب الإضافات */
  refetch: () => Promise<void>;
}

/**
 * Hook لجلب وإدارة الإضافات
 * 
 * @example
 * ```tsx
 * const { plugins, loading, error, refetch } = usePlugins();
 * 
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * 
 * return plugins.map(plugin => <PluginCard key={plugin.id} {...plugin} />);
 * ```
 */
export function usePlugins(): UsePluginsReturn {
  const [state, setState] = useState<UsePluginsState>({
    plugins: DEFAULT_PLUGINS,
    loading: true,
    error: null,
  });

  /**
   * جلب الإضافات من API مع معالجة الأخطاء والتحقق من البيانات
   */
  const fetchPlugins = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/plugins");
      
      if (!response.ok) {
        throw new Error(`فشل في جلب الإضافات: ${response.status}`);
      }

      const rawData: unknown = await response.json();
      
      // التحقق من صحة البيانات باستخدام Zod
      const validationResult = PluginsApiResponseSchema.safeParse(rawData);
      
      if (!validationResult.success) {
        // استخدام البيانات الافتراضية عند فشل التحقق
        setState({
          plugins: DEFAULT_PLUGINS,
          loading: false,
          error: null,
        });
        return;
      }

      const { plugins } = validationResult.data;
      
      setState({
        plugins: plugins && plugins.length > 0 ? plugins : DEFAULT_PLUGINS,
        loading: false,
        error: null,
      });
    } catch (err) {
      // معالجة الأخطاء مع الحفاظ على البيانات الافتراضية
      setState({
        plugins: DEFAULT_PLUGINS,
        loading: false,
        error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
      });
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  return {
    ...state,
    refetch: fetchPlugins,
  };
}

export default usePlugins;
