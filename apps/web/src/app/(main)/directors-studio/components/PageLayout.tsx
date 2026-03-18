/**
 * @fileoverview مكوّن تخطيط الصفحة الأساسي
 *
 * السبب في وجود هذا المكوّن: توفير هيكل موحد
 * لجميع صفحات استوديو المخرجين مع عنصر الـ Hero المشترك.
 */
"use client";

import type { ReactNode } from "react";
import DashboardHero from "./DashboardHero";

/**
 * واجهة خصائص مكوّن التخطيط
 */
interface PageLayoutProps {
  /** محتوى الصفحة الذي يُعرض تحت عنصر الـ Hero */
  children: ReactNode;
}

/**
 * مكوّن تخطيط الصفحة الأساسي
 *
 * السبب في استخدام هذا النمط: ضمان تناسق التصميم
 * عبر جميع حالات الصفحة (تحميل، فارغ، محتوى).
 *
 * البنية:
 * 1. DashboardHero - الصورة الرئيسية مع أزرار الإجراءات
 * 2. children - المحتوى المُمرر للصفحة
 *
 * @param props - خصائص المكوّن
 * @returns عنصر React يحتوي على التخطيط الأساسي
 */
export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="space-y-8">
      <DashboardHero />
      {children}
    </div>
  );
}
