/**
 * @fileoverview أدوات أثناء التصوير
 *
 * هذا المكون يوفر أدوات التحليل والمراقبة لمرحلة التصوير الفعلي.
 * يتضمن تحليل اللقطات الحي ونظام التحذيرات الذكي.
 *
 * السبب وراء هذه الأدوات:
 * - توفير ردود فعل فورية لمدير التصوير
 * - ضمان تناسق الأسلوب البصري
 * - اكتشاف المشاكل التقنية قبل الانتهاء من التصوير
 *
 * @module cinematography-studio/components/tools/ProductionTools
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ScanLine,
  AlertTriangle,
  CheckCircle,
  Focus,
  Aperture,
  Thermometer,
} from "lucide-react";
import { useProduction } from "../../hooks";
import type { ProductionToolsProps } from "../../types";

/**
 * مكون أدوات أثناء التصوير
 *
 * يوفر هذا المكون:
 * - تحليل اللقطات الحي (Live Shot Analysis)
 * - لوحة الإعدادات التقنية (Technical Specs)
 * - نظام تحذيرات رادي (Rady's Warning System)
 *
 * @param props - خصائص المكون
 * @param props.mood - المود البصري المحدد للمشروع
 * @returns مكون أدوات أثناء التصوير
 */
const ProductionTools: React.FC<ProductionToolsProps> = ({ mood = "noir" }) => {
  // استخدام الـ hook المخصص لإدارة الحالة
  const {
    analysis,
    isAnalyzing,
    question,
    technicalSettings,
    hasAnalysis,
    hasIssues,
    isReadyToShoot,
    handleAnalyzeShot,
    setQuestion,
    askAssistant,
    toggleFocusPeaking,
    toggleFalseColor,
  } = useProduction(mood);

  // ============================================
  // دوال مُحسنة للأداء
  // ============================================

  /**
   * معالج تغيير السؤال
   */
  const handleQuestionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuestion(e.target.value);
    },
    [setQuestion]
  );

  /**
   * معالج إرسال السؤال بالضغط على Enter
   */
  const handleQuestionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        askAssistant();
      }
    },
    [askAssistant]
  );

  /**
   * قائمة المشاكل المكتشفة (محسنة للأداء)
   */
  const issuesList = useMemo(() => {
    if (!analysis || analysis.issues.length === 0) return null;

    return (
      <ul className="list-disc pl-4 space-y-1 text-red-400">
        {analysis.issues.map((issue, i) => (
          <li key={`issue-${i}`}>{issue}</li>
        ))}
      </ul>
    );
  }, [analysis]);

  // ============================================
  // العرض
  // ============================================

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* بطاقة تحليل اللقطة الحي */}
      <Card className="col-span-1 md:col-span-2 bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex justify-between items-center">
            <span className="flex items-center gap-2">
              <ScanLine className="text-amber-500" />
              تحليل اللقطة الحي
            </span>
            {isReadyToShoot && (
              <Badge
                variant="outline"
                className="text-green-400 border-green-900 bg-green-900/20"
              >
                READY TO SHOOT
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* منطقة معاينة الفيديو */}
          <div className="aspect-video bg-black rounded-lg border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
            {/* مؤشر التسجيل */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <div className="bg-red-600 w-2 h-2 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-500">
                REC 4K
              </span>
            </div>

            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              onClick={handleAnalyzeShot}
              disabled={isAnalyzing}
            >
              {isAnalyzing
                ? "جاري المسح الطيفي..."
                : "ارفع لقطة اختبار (Test Shot)"}
            </Button>
          </div>

          {/* نتائج التحليل */}
          {hasAnalysis && analysis && (
            <AnalysisResults
              exposure={analysis.exposure}
              grainLevel={analysis.grainLevel}
              score={analysis.score}
            />
          )}
        </CardContent>
      </Card>

      {/* العمود الجانبي */}
      <div className="space-y-6">
        {/* بطاقة الإعدادات التقنية */}
        <TechnicalSpecsCard
          focusPeaking={technicalSettings.focusPeaking}
          falseColor={technicalSettings.falseColor}
          colorTemp={technicalSettings.colorTemp}
          onToggleFocusPeaking={toggleFocusPeaking}
          onToggleFalseColor={toggleFalseColor}
        />

        {/* بطاقة نظام التحذيرات */}
        <WarningSystemCard
          hasIssues={hasIssues}
          issuesList={issuesList}
          question={question}
          onQuestionChange={handleQuestionChange}
          onQuestionKeyDown={handleQuestionKeyDown}
        />
      </div>
    </div>
  );
};

// ============================================
// مكونات فرعية
// ============================================

/**
 * خصائص نتائج التحليل
 */
interface AnalysisResultsProps {
  exposure: number;
  grainLevel: string;
  score: number;
}

/**
 * مكون نتائج التحليل
 */
const AnalysisResults = React.memo<AnalysisResultsProps>(
  function AnalysisResults({ exposure, grainLevel, score }) {
    return (
      <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
        <div className="bg-zinc-950 p-3 rounded border-l-2 border-amber-500">
          <p className="text-[10px] text-zinc-500 uppercase">Exposure</p>
          <p className="font-mono text-lg text-white">{exposure}%</p>
        </div>
        <div className="bg-zinc-950 p-3 rounded border-l-2 border-blue-500">
          <p className="text-[10px] text-zinc-500 uppercase">Grain</p>
          <p className="font-mono text-sm text-white truncate">{grainLevel}</p>
        </div>
        <div className="bg-zinc-950 p-3 rounded border-l-2 border-purple-500">
          <p className="text-[10px] text-zinc-500 uppercase">Mood Fit</p>
          <p className="font-mono text-lg text-white">{score}/100</p>
        </div>
      </div>
    );
  }
);

/**
 * خصائص بطاقة الإعدادات التقنية
 */
interface TechnicalSpecsCardProps {
  focusPeaking: boolean;
  falseColor: boolean;
  colorTemp: number;
  onToggleFocusPeaking: () => void;
  onToggleFalseColor: () => void;
}

/**
 * مكون بطاقة الإعدادات التقنية
 */
const TechnicalSpecsCard = React.memo<TechnicalSpecsCardProps>(
  function TechnicalSpecsCard({
    focusPeaking,
    falseColor,
    colorTemp,
    onToggleFocusPeaking,
    onToggleFalseColor,
  }) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-400 uppercase tracking-widest">
            Technical Specs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Focus Peaking */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-2 bg-zinc-950 rounded hover:bg-zinc-800 transition-colors"
            onClick={onToggleFocusPeaking}
          >
            <div className="flex items-center gap-2">
              <Focus className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-300">Focus Peaking</span>
            </div>
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
              {focusPeaking ? "ON" : "OFF"}
            </Badge>
          </button>

          {/* False Color */}
          <button
            type="button"
            className="w-full flex items-center justify-between p-2 bg-zinc-950 rounded hover:bg-zinc-800 transition-colors"
            onClick={onToggleFalseColor}
          >
            <div className="flex items-center gap-2">
              <Aperture className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-300">False Color</span>
            </div>
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
              {falseColor ? "ON" : "OFF"}
            </Badge>
          </button>

          {/* Color Temperature */}
          <div className="flex items-center justify-between p-2 bg-zinc-950 rounded">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-300">Color Temp</span>
            </div>
            <span className="font-mono text-xs text-amber-500">{colorTemp}K</span>
          </div>
        </CardContent>
      </Card>
    );
  }
);

/**
 * خصائص بطاقة نظام التحذيرات
 */
interface WarningSystemCardProps {
  hasIssues: boolean;
  issuesList: React.ReactNode;
  question: string;
  onQuestionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuestionKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * مكون بطاقة نظام التحذيرات
 */
const WarningSystemCard = React.memo<WarningSystemCardProps>(
  function WarningSystemCard({
    hasIssues,
    issuesList,
    question,
    onQuestionChange,
    onQuestionKeyDown,
  }) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-amber-500 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Rady's Warning System
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            المحلل الفوري يعطي ملاحظات بناءً على ستايل التصوير الخاص بك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-zinc-400 mb-4">
            {hasIssues ? (
              issuesList
            ) : (
              <p className="text-green-500/80 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> لا توجد مشاكل حرجة. الجو
                العام متناسق.
              </p>
            )}
          </div>
          <Input
            placeholder="اسأل عن الإضاءة، العدسات..."
            className="bg-zinc-950 border-zinc-800 text-xs"
            value={question}
            onChange={onQuestionChange}
            onKeyDown={onQuestionKeyDown}
          />
        </CardContent>
      </Card>
    );
  }
);

export default ProductionTools;
