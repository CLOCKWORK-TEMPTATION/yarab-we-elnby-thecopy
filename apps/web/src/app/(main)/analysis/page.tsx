/**
 * @module app/(main)/analysis/page
 * @description صفحة التحليل الدرامي الرئيسية
 * 
 * السبب: هذه الصفحة تعمل كنقطة دخول لنظام التحليل الدرامي،
 * وتقوم بتحميل المكونات بشكل كسول (lazy) لتحسين الأداء الأولي للصفحة.
 * 
 * تستخدم تقنية Dynamic Import لتأخير تحميل المكونات الثقيلة
 * حتى يحتاجها المستخدم فعلياً.
 */

"use client";

import dynamic from "next/dynamic";

/**
 * مكون V0 - يُحمّل بشكل كسول
 * السبب: تقليل حجم الحزمة الأولية وتحسين وقت التحميل
 */
const V0Component = dynamic(() => import("@/components/v0-component"), {
  ssr: false,
});

/**
 * مكون المحطات السبع - يُحمّل بشكل كسول مع مؤشر تحميل
 * السبب: المكون ثقيل ويحتوي على منطق معقد، لذا نؤخر تحميله
 */
const SevenStations = dynamic(() => import("./seven-stations"), {
  loading: () => (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
            role="status"
            aria-label="جاري التحميل"
          />
          <p className="text-muted-foreground">جاري تحميل المحطات السبع...</p>
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

/**
 * صفحة التحليل الدرامي
 * 
 * السبب: تجميع مكونات واجهة التحليل في صفحة واحدة
 * مع تحميل كسول لتحسين تجربة المستخدم.
 * 
 * @returns عنصر JSX يحتوي على مكونات التحليل
 */
export default function AnalysisPage() {
  return (
    <div>
      <V0Component />
      <SevenStations />
    </div>
  );
}
