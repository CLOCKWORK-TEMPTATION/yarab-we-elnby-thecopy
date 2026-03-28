"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "../../context/AppContext";

export function DashboardView() {
  const { user, scripts, recordings } = useApp();

  const averageScore =
    recordings.length > 0
      ? Math.round(
          recordings.reduce((sum, recording) => sum + recording.score, 0) /
            recordings.length
        )
      : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          📊 مرحباً، {user?.name || "ضيف"}!
        </h2>
        <Badge variant="secondary" className="mt-2">
          عضو منذ أكتوبر 2025
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📝 النصوص</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">
              {scripts.length}
            </p>
            <p className="text-gray-500 text-sm">نص تم تحليله</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎤 التسجيلات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">
              {recordings.length}
            </p>
            <p className="text-gray-500 text-sm">تسجيل محفوظ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⭐ متوسط التقييم</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600">
              {averageScore}%
            </p>
            <p className="text-gray-500 text-sm">من تحليل الأداء</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⏱️ ساعات التدريب</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-orange-600">12.5</p>
            <p className="text-gray-500 text-sm">ساعة تدريب</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
