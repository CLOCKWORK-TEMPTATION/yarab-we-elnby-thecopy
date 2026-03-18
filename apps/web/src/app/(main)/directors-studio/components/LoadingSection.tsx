/**
 * @fileoverview مكوّن عرض حالة التحميل
 *
 * السبب في وجود هذا المكوّن: توفير تجربة بصرية متسقة
 * للمستخدم أثناء انتظار تحميل البيانات من الخادم.
 *
 * يُستخدم Skeleton لأنه يوفر إحساساً بتقدم التحميل
 * أفضل من مؤشر دوران بسيط.
 */
"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * مكوّن عرض حالة التحميل
 *
 * السبب في التصميم: يحاكي شكل المحتوى الفعلي (إحصائيات + قائمة)
 * مما يقلل من التحول المفاجئ عند اكتمال التحميل.
 *
 * @returns عنصر React يعرض هياكل عظمية للتحميل
 */
export function LoadingSection() {
  return (
    <div className="space-y-4">
      {/* هيكل عظمي للإحصائيات */}
      <Skeleton className="h-32 w-full" />
      {/* هيكل عظمي للمحتوى الرئيسي */}
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
