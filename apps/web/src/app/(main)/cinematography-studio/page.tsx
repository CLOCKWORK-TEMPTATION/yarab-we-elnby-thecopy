/**
 * @fileoverview صفحة استوديو التصوير السينمائي (CineAI Vision)
 *
 * هذه الصفحة تمثل نقطة الدخول الرئيسية لاستوديو التصوير السينمائي.
 * تستخدم التحميل الديناميكي (Dynamic Import) لتحسين أداء التحميل الأولي
 * عن طريق فصل كود الاستوديو الثقيل عن الحزمة الرئيسية.
 *
 * السبب وراء استخدام "use client":
 * - الاستوديو يحتاج تفاعلات معقدة مع المستخدم
 * - يستخدم React hooks للحالة والتأثيرات
 * - يحتاج الوصول إلى APIs المتصفح
 *
 * @module cinematography-studio/page
 */

"use client";

import dynamic from "next/dynamic";

/**
 * مكون التحميل (Loading State)
 *
 * يُعرض أثناء تحميل مكون الاستوديو الرئيسي.
 * التصميم يتوافق مع الهوية البصرية للتطبيق (Zinc + Amber)
 */
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-950">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
      <p className="text-zinc-400">جاري تحميل استوديو السينما...</p>
    </div>
  </div>
);

/**
 * استوديو السينما - محمل ديناميكياً
 *
 * السبب وراء التحميل الديناميكي:
 * - تقليل حجم الحزمة الأولية (Initial Bundle)
 * - تحسين مقاييس Core Web Vitals
 * - الاستوديو يحتوي على مكونات ثقيلة (محاكاة العدسات، معاينة الألوان)
 *
 * السبب وراء تعطيل SSR:
 * - المكون يستخدم APIs خاصة بالمتصفح
 * - يعتمد على تفاعلات المستخدم المباشرة
 */
const CineAIStudio = dynamic(
  () =>
    import("@the-copy/cinematography").then((mod) => ({
      default: mod.CineAIStudio,
    })),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

/**
 * صفحة استوديو التصوير السينمائي
 *
 * توفر هذه الصفحة واجهة متكاملة لمديري التصوير تشمل:
 * - أدوات ما قبل الإنتاج (توليد الرؤية البصرية)
 * - أدوات أثناء التصوير (تحليل اللقطات)
 * - أدوات ما بعد الإنتاج (تدريج الألوان والتصدير)
 *
 * @returns مكون الاستوديو المحمل ديناميكياً
 */
export default function CinematographyStudioPage() {
  return <CineAIStudio />;
}
