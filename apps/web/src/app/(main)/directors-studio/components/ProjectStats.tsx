/**
 * @fileoverview مكوّن عرض إحصائيات المشروع
 *
 * السبب في وجود هذا المكوّن: توفير نظرة سريعة
 * على حالة المشروع للمخرج في لوحة التحكم الرئيسية.
 *
 * يعرض أربع بطاقات إحصائية:
 * - إجمالي المشاهد
 * - عدد الشخصيات
 * - اللقطات المخططة
 * - المشاهد المكتملة (مع نسبة الإنجاز)
 */
"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Users, Camera, CheckCircle } from "lucide-react";

/**
 * واجهة خصائص بطاقة الإحصائية الفردية
 */
interface StatCardProps {
  /** عنوان البطاقة */
  title: string;
  /** القيمة المعروضة (رقم أو نص) */
  value: string | number;
  /** أيقونة البطاقة */
  icon: React.ReactNode;
  /** وصف إضافي اختياري */
  description?: string;
}

/**
 * مكوّن بطاقة إحصائية فردية
 *
 * السبب في فصله: إعادة الاستخدام عبر إحصائيات مختلفة
 * مع الحفاظ على تصميم متسق.
 *
 * السبب في استخدام memo: تجنب إعادة العرض
 * عندما لا تتغير قيم البطاقة.
 */
const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  description,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="p-2 rounded-md bg-primary/10 text-primary">{icon}</div>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-right">
          <div className="text-3xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * واجهة خصائص مكوّن إحصائيات المشروع
 */
interface ProjectStatsProps {
  /** العدد الإجمالي للمشاهد */
  totalScenes: number;
  /** العدد الإجمالي للشخصيات */
  totalCharacters: number;
  /** العدد الإجمالي للقطات المخططة */
  totalShots: number;
  /** عدد المشاهد المكتملة */
  completedScenes: number;
}

/**
 * مكوّن عرض إحصائيات المشروع
 *
 * السبب في وجوده: توفير ملخص بصري سريع
 * يساعد المخرج في تتبع تقدم المشروع.
 *
 * السبب في استخدام شبكة 4 أعمدة: عرض جميع الإحصائيات
 * الأساسية في صف واحد على الشاشات الكبيرة.
 *
 * @param props - خصائص الإحصائيات
 * @returns شبكة من بطاقات الإحصائيات
 */
function ProjectStats({
  totalScenes,
  totalCharacters,
  totalShots,
  completedScenes,
}: ProjectStatsProps) {
  /**
   * حساب نسبة الإنجاز
   * السبب في useMemo: تجنب إعادة الحساب عند كل render
   */
  const completionPercentage = useMemo(() => {
    if (totalScenes === 0) return 0;
    return Math.round((completedScenes / totalScenes) * 100);
  }, [completedScenes, totalScenes]);

  return (
    <div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      data-testid="project-stats"
    >
      <StatCard
        title="إجمالي المشاهد"
        value={totalScenes}
        icon={<Film className="w-4 h-4" />}
        description="في السيناريو الحالي"
      />
      <StatCard
        title="الشخصيات"
        value={totalCharacters}
        icon={<Users className="w-4 h-4" />}
        description="شخصية رئيسية وثانوية"
      />
      <StatCard
        title="اللقطات المخططة"
        value={totalShots}
        icon={<Camera className="w-4 h-4" />}
        description="لقطة تم تخطيطها"
      />
      <StatCard
        title="مشاهد مكتملة"
        value={`${completedScenes}/${totalScenes}`}
        icon={<CheckCircle className="w-4 h-4" />}
        description={`${completionPercentage}% مكتمل`}
      />
    </div>
  );
}

export default memo(ProjectStats);
