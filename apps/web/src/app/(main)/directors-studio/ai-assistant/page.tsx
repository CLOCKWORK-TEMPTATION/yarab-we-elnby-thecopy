"use client";

import AIChatPanel from "@/app/(main)/directors-studio/components/AIChatPanel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, Sparkles, Film, Users } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Bot className="h-10 w-10 text-primary" />
          مساعد AI للإخراج
        </h1>
        <p className="text-muted-foreground mt-2">
          احصل على مساعدة ذكية في تخطيط المشاهد واللقطات
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">تحليل السيناريو</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              قم بتحليل السيناريو واستخراج المشاهد والشخصيات تلقائياً
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <Film className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">اقتراحات اللقطات</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              احصل على اقتراحات احترافية للقطات والزوايا المناسبة
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">تتبع الشخصيات</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              تحليل ظهور الشخصيات والتأكد من الاتساق
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <AIChatPanel />
        </div>
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-3">أمثلة على الأسئلة:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• حلل السيناريو واستخرج المشاهد الرئيسية</li>
          <li>• اقترح لقطات للمشهد الافتتاحي</li>
          <li>• ما هي أفضل زاوية كاميرا لمشهد درامي؟</li>
          <li>• كيف يمكنني تحسين الإضاءة في المشهد الليلي؟</li>
          <li>• اقترح تسلسل لقطات لمشهد حوار بين شخصيتين</li>
        </ul>
      </div>
    </div>
  );
}
