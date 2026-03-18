/**
 * @fileoverview صفحة استوديو التصوير السينمائي (النسخة التجريبية)
 *
 * هذه الصفحة تمثل النسخة التجريبية/الاحتياطية من استوديو التصوير السينمائي.
 * تُعرض للمستخدمين عندما تكون الميزة قيد التطوير أو في حالة فشل تحميل
 * الاستوديو الرئيسي.
 *
 * السبب وراء وجود هذه الصفحة:
 * - توفير تجربة احتياطية للمستخدم
 * - عرض خارطة طريق الميزات القادمة
 * - إعلام المستخدم بحالة التطوير
 *
 * @module cinematography-studio/components/CinematographyStudio
 */

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * قائمة الميزات المخطط لها
 *
 * السبب وراء تعريفها كثابت:
 * - تجنب إعادة إنشاء المصفوفة في كل render
 * - سهولة التحديث والصيانة
 */
const PLANNED_FEATURES = [
  {
    icon: "📷",
    title: "تحليل الإضاءة",
    description: "أدوات لتحليل وتخطيط إضاءة المشاهد",
  },
  {
    icon: "🎨",
    title: "لوحات الألوان",
    description: "إنشاء وإدارة لوحات الألوان السينمائية",
  },
  {
    icon: "📐",
    title: "تخطيط اللقطات",
    description: "أدوات لتخطيط زوايا الكاميرا وحركتها",
  },
  {
    icon: "🎬",
    title: "مرجع اللقطات",
    description: "مكتبة مرجعية للقطات السينمائية الشهيرة",
  },
  {
    icon: "⚙️",
    title: "حاسبة المعدات",
    description: "حسابات العدسات والإضاءة والمعدات",
  },
] as const;

/**
 * مكون استوديو التصوير السينمائي (النسخة التجريبية)
 *
 * يعرض هذا المكون:
 * - رسالة "قيد التطوير"
 * - قائمة الميزات المخطط لها
 * - معلومات التواصل مع فريق التطوير
 *
 * @returns مكون الصفحة التجريبية
 */
export const CinematographyStudio: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* الرأسية */}
      <header className="bg-gradient-to-r from-slate-900 to-zinc-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-4 space-x-reverse justify-center">
            <span className="text-6xl">🎥</span>
            <div>
              <h1 className="text-4xl font-bold mb-2">استوديو مديري التصوير</h1>
              <p className="text-xl text-gray-300">Cinematography Studio</p>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* بطاقة قيد التطوير */}
          <Card className="border-4 border-dashed border-yellow-400 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">
                    🚧 قيد التطوير
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Under Development
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  قريباً
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-xl text-gray-700">
                هذه الصفحة محجوزة لاستوديو مديري التصوير - قيد التطوير حالياً
              </p>

              {/* قائمة الميزات */}
              <div className="bg-white rounded-lg p-6 space-y-4">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  الميزات المخطط لها:
                </h3>
                <ul className="space-y-3">
                  {PLANNED_FEATURES.map((feature) => (
                    <li
                      key={feature.title}
                      className="flex items-start space-x-3 space-x-reverse"
                    >
                      <span className="text-2xl">{feature.icon}</span>
                      <div>
                        <strong className="text-lg">{feature.title}:</strong>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* زر "قريباً" */}
              <div className="flex justify-center pt-6">
                <Button size="lg" variant="outline" disabled>
                  <span className="text-xl mr-2">🔜</span>
                  قريباً
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* نص التواصل */}
          <div className="mt-8 text-center text-gray-600">
            <p>
              للاستفسارات أو المساهمة في التطوير، يرجى التواصل مع فريق التطوير
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
