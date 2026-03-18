/**
 * @fileoverview مكوّن عرض قسم عدم وجود مشروع
 *
 * السبب في وجود هذا المكوّن: توجيه المستخدم الجديد
 * نحو إنشاء مشروع أول عبر رفع سيناريو.
 *
 * يُعرض هذا القسم عندما:
 * - لا يوجد مشروع مُختار حالياً
 * - المشروع المُختار فارغ من المشاهد
 */
"use client";

import ScriptUploadZone from "./ScriptUploadZone";

/**
 * مكوّن قسم عدم وجود مشروع
 *
 * السبب في التصميم البسيط: التركيز على الإجراء الوحيد المطلوب
 * من المستخدم وهو رفع سيناريو لبدء مشروع جديد.
 *
 * @returns عنصر React يعرض منطقة رفع السيناريو
 */
export function NoProjectSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <ScriptUploadZone />
    </div>
  );
}
