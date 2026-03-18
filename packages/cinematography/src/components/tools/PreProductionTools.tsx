/**
 * @fileoverview أدوات ما قبل الإنتاج
 *
 * هذا المكون يوفر أدوات التخطيط البصري لمرحلة ما قبل الإنتاج.
 * يتضمن مولد الرؤية البصرية الذي يحول وصف المشهد إلى كادر سينمائي.
 *
 * السبب وراء فصل هذه الأدوات:
 * - كل مرحلة إنتاجية لها احتياجات مختلفة
 * - تسهيل الصيانة والتطوير المستقل
 * - تحسين الأداء عبر lazy loading
 *
 * @module cinematography-studio/components/tools/PreProductionTools
 */

"use client";

import React, { useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Eye, Sparkles, Zap, Image as ImageIcon } from "lucide-react";
import { usePreProduction } from "../../hooks";
import type { PreProductionToolsProps } from "../../types";

/**
 * مكون أدوات ما قبل الإنتاج
 *
 * يوفر هذا المكون:
 * - مولد الرؤية البصرية (Concept Art Generator)
 * - إعدادات الغموض والفوضى البصرية
 * - معاينة الكادر المولد مع اقتراحات تقنية
 *
 * @param props - خصائص المكون
 * @param props.mood - المود البصري المحدد للمشروع
 * @returns مكون أدوات ما قبل الإنتاج
 */
const PreProductionTools: React.FC<PreProductionToolsProps> = ({
  mood = "noir",
}) => {
  // استخدام الـ hook المخصص لإدارة الحالة
  const {
    prompt,
    darkness,
    complexity,
    isGenerating,
    result,
    setPrompt,
    setDarkness,
    setComplexity,
    handleGenerate,
    canGenerate,
  } = usePreProduction(mood);

  // ============================================
  // دوال مُحسنة للأداء
  // ============================================

  /**
   * معالج تغيير النص
   *
   * السبب وراء useCallback:
   * - تجنب إعادة إنشاء الدالة في كل render
   * - تحسين أداء مكون Textarea
   */
  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
    },
    [setPrompt]
  );

  /**
   * البيانات التقنية للعرض
   *
   * السبب وراء useMemo:
   * - تجنب إعادة حساب البيانات في كل render
   * - البيانات تعتمد فقط على نتيجة التوليد
   */
  const technicalData = useMemo(
    () => ({
      lens: result?.lens ?? "35mm Anamorphic",
      lighting: result?.lighting ?? "Low-Key / Chiaroscuro",
      angle: result?.angle ?? "Dutch Angle (Low)",
    }),
    [result]
  );

  // ============================================
  // العرض
  // ============================================

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* لوحة التحكم */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              مولد الرؤية البصرية
            </CardTitle>
            <CardDescription className="text-zinc-400">
              حول المشهد المكتوب إلى كادر سينمائي (Concept Art)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* حقل وصف المشهد */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                وصف المشهد
              </label>
              <Textarea
                placeholder="مثال: غرفة تحقيق مظلمة، ضوء واحد مسلط على وجه المتهم، دخان سجائر يملأ المكان..."
                className="bg-black/20 border-zinc-700 text-zinc-100 min-h-[120px] focus:border-amber-500"
                value={prompt}
                onChange={handlePromptChange}
              />
            </div>

            {/* إعدادات التوليد */}
            <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/5">
              {/* شريط الغموض */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">
                    Shadows & Mystery (الغموض)
                  </span>
                  <span className="text-amber-500 font-mono">
                    {darkness[0]}%
                  </span>
                </div>
                <Slider
                  value={darkness}
                  onValueChange={setDarkness}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>

              {/* شريط الفوضى البصرية */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">
                    Visual Chaos (الفوضى البصرية)
                  </span>
                  <span className="text-amber-500 font-mono">
                    {complexity[0]}%
                  </span>
                </div>
                <Slider
                  value={complexity}
                  onValueChange={setComplexity}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            {/* زر التوليد */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold py-6"
            >
              {isGenerating ? (
                <>
                  جاري التخيل <Sparkles className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  توليد الكادر <Zap className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* منطقة المعاينة */}
      <div className="lg:col-span-8">
        <Card className="bg-zinc-900 border-zinc-800 h-full min-h-[500px] flex flex-col relative overflow-hidden group">
          {/* طبقة الضوضاء البصرية */}
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none mix-blend-overlay" />

          {/* منطقة الصورة */}
          <div className="flex-1 flex items-center justify-center bg-black/40 relative">
            {!isGenerating ? (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto border-2 border-dashed border-zinc-700 group-hover:border-amber-500/50 transition-colors">
                  <ImageIcon className="h-10 w-10 text-zinc-500" />
                </div>
                <p className="text-zinc-500 max-w-sm mx-auto px-4">
                  الصورة ستظهر هنا. الذكاء الاصطناعي سيقترح زاوية الكاميرا
                  وتوزيع الإضاءة بناءً على "مود" {mood}.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4 animate-pulse">
                <div className="w-full max-w-md h-64 bg-zinc-800/50 rounded-lg mx-auto" />
                <p className="text-amber-500 font-mono text-sm">
                  جاري هندسة الضوء والظلال...
                </p>
              </div>
            )}
          </div>

          {/* شريط المعلومات التقنية */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 grid grid-cols-3 gap-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">LENS:</span>
              {isGenerating ? "..." : technicalData.lens}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-600">LIGHT:</span>
              {isGenerating ? "..." : technicalData.lighting}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-600">ANGLE:</span>
              {isGenerating ? "..." : technicalData.angle}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PreProductionTools;
