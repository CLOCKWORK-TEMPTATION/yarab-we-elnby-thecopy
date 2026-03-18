/**
 * @fileoverview أدوات ما بعد الإنتاج
 *
 * هذا المكون يوفر أدوات المعالجة النهائية لمرحلة ما بعد الإنتاج.
 * يتضمن تدريج الألوان، مساعد المونتاج، محلل المشاهد، ومدير التصدير.
 *
 * السبب وراء هذه الأدوات:
 * - توحيد الهوية البصرية للفيلم
 * - تسهيل عملية المونتاج وتحليل الإيقاع
 * - ضمان جودة التصدير للمنصات المختلفة
 *
 * @module cinematography-studio/components/tools/PostProductionTools
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
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { usePostProduction } from "../../hooks";
import type { PostProductionToolsProps, ExportSettings } from "../../types";

/**
 * مكون أدوات ما بعد الإنتاج
 *
 * يوفر هذا المكون:
 * - مساعد تدريج الألوان (Color Grading Assistant)
 * - مساعد المونتاج (Editorial Assistant)
 * - محلل المشاهد (Footage Analyzer)
 * - مدير التسليم (Delivery Manager)
 *
 * @param props - خصائص المكون
 * @param props.mood - المود البصري المحدد للمشروع
 * @returns مكون أدوات ما بعد الإنتاج
 */
const PostProductionTools: React.FC<PostProductionToolsProps> = ({ mood }) => {
  // استخدام الـ hook المخصص لإدارة الحالة
  const {
    sceneType,
    temperatureValue,
    colorPalette,
    isGeneratingPalette,
    editorialNotes,
    isAnalyzingRhythm,
    isUploadingFootage,
    footageAnalysisStatus,
    hasColorPalette,
    setSceneType,
    setTemperature,
    generateColorPalette,
    setEditorialNotes,
    analyzeRhythm,
    uploadFootage,
    createExportSettings,
  } = usePostProduction(mood);

  // ============================================
  // دوال مُحسنة للأداء
  // ============================================

  /**
   * معالج تغيير ملاحظات المونتاج
   */
  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditorialNotes(e.target.value);
    },
    [setEditorialNotes]
  );

  /**
   * معالج اختيار نوع المشهد
   */
  const handleSceneTypeSelect = useCallback(
    (type: string) => {
      setSceneType(type as Parameters<typeof setSceneType>[0]);
    },
    [setSceneType]
  );

  /**
   * معالج إنشاء إعدادات التصدير
   */
  const handleCreateExportSettings = useCallback(
    (platform: ExportSettings["platform"]) => {
      createExportSettings(platform);
    },
    [createExportSettings]
  );

  // ============================================
  // العرض
  // ============================================

  return (
    <div className="space-y-6">
      {/* مساعد تدريج الألوان */}
      <ColorGradingCard
        temperatureValue={temperatureValue}
        colorPalette={colorPalette}
        hasColorPalette={hasColorPalette}
        isGenerating={isGeneratingPalette}
        onTemperatureChange={setTemperature}
        onSceneTypeSelect={handleSceneTypeSelect}
        onGeneratePalette={generateColorPalette}
      />

      {/* مساعد المونتاج */}
      <EditorialCard
        notes={editorialNotes}
        isAnalyzing={isAnalyzingRhythm}
        onNotesChange={handleNotesChange}
        onAnalyze={analyzeRhythm}
      />

      {/* محلل المشاهد */}
      <FootageAnalyzerCard
        isUploading={isUploadingFootage}
        analysisStatus={footageAnalysisStatus}
        onUpload={uploadFootage}
      />

      {/* مدير التسليم */}
      <DeliveryManagerCard onCreateSettings={handleCreateExportSettings} />
    </div>
  );
};

// ============================================
// مكونات فرعية
// ============================================

/**
 * خصائص بطاقة تدريج الألوان
 */
interface ColorGradingCardProps {
  temperatureValue: number[];
  colorPalette: string[];
  hasColorPalette: boolean;
  isGenerating: boolean;
  onTemperatureChange: (value: number[]) => void;
  onSceneTypeSelect: (type: string) => void;
  onGeneratePalette: () => void;
}

/**
 * بطاقة مساعد تدريج الألوان
 */
const ColorGradingCard = React.memo<ColorGradingCardProps>(
  function ColorGradingCard({
    temperatureValue,
    colorPalette,
    hasColorPalette,
    isGenerating,
    onTemperatureChange,
    onSceneTypeSelect,
    onGeneratePalette,
  }) {
    /**
     * أزرار أنواع المشاهد (محسنة للأداء)
     */
    const sceneTypeButtons = useMemo(
      () => [
        { type: "morning", label: "🌅 صباحي" },
        { type: "night", label: "🌃 ليلي" },
        { type: "indoor", label: "🏢 داخلي" },
        { type: "outdoor", label: "🌳 خارجي" },
        { type: "happy", label: "😊 سعيد" },
        { type: "sad", label: "😔 حزين" },
      ],
      []
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <span className="text-2xl">🎨</span>
            <span>مساعد تدريج الألوان - Color Grading Assistant</span>
          </CardTitle>
          <CardDescription>اقتراحات ذكية لتدريج الألوان وLUTs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* اختيار نوع المشهد */}
          <div>
            <Label>نوع المشهد / Scene Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {sceneTypeButtons.map(({ type, label }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => onSceneTypeSelect(type)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* شريط درجة حرارة اللون */}
          <div>
            <Label>Color Temperature: {temperatureValue[0]}K</Label>
            <Slider
              value={temperatureValue}
              onValueChange={onTemperatureChange}
              min={2000}
              max={10000}
              step={100}
              className="mt-2"
            />
          </div>

          {/* زر توليد اللوحة */}
          <Button
            onClick={onGeneratePalette}
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating ? "جاري التوليد..." : "🎨 توليد لوحة ألوان"}
          </Button>

          {/* عرض لوحة الألوان */}
          {hasColorPalette && (
            <ColorPaletteDisplay colors={colorPalette} />
          )}
        </CardContent>
      </Card>
    );
  }
);

/**
 * خصائص عرض لوحة الألوان
 */
interface ColorPaletteDisplayProps {
  colors: string[];
}

/**
 * مكون عرض لوحة الألوان
 */
const ColorPaletteDisplay = React.memo<ColorPaletteDisplayProps>(
  function ColorPaletteDisplay({ colors }) {
    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-3 text-sm">لوحة الألوان المقترحة:</h4>
        <div className="flex gap-2">
          {colors.map((color, idx) => (
            <div key={`color-${idx}`} className="flex-1 text-center">
              <div
                className="h-20 rounded-lg mb-2 border-2 border-gray-200"
                style={{ backgroundColor: color }}
              />
              <p className="text-xs font-mono">{color}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

/**
 * خصائص بطاقة المونتاج
 */
interface EditorialCardProps {
  notes: string;
  isAnalyzing: boolean;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAnalyze: () => void;
}

/**
 * بطاقة مساعد المونتاج
 */
const EditorialCard = React.memo<EditorialCardProps>(function EditorialCard({
  notes,
  isAnalyzing,
  onNotesChange,
  onAnalyze,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 space-x-reverse">
          <span className="text-2xl">✂️</span>
          <span>مساعد المونتاج - Editorial Assistant</span>
        </CardTitle>
        <CardDescription>اقتراحات للإيقاع والانتقالات</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="edit-notes">ملاحظات المونتاج</Label>
          <Textarea
            id="edit-notes"
            placeholder="وصف المشهد أو نوع المونتاج المطلوب..."
            rows={4}
            className="mt-2"
            value={notes}
            onChange={onNotesChange}
          />
        </div>
        <Button
          className="w-full"
          variant="outline"
          onClick={onAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? "جاري التحليل..." : "🎬 تحليل الإيقاع"}
        </Button>
      </CardContent>
    </Card>
  );
});

/**
 * خصائص بطاقة محلل المشاهد
 */
interface FootageAnalyzerCardProps {
  isUploading: boolean;
  analysisStatus: {
    exposure: "pending" | "analyzing" | "complete";
    colorConsistency: "pending" | "analyzing" | "complete";
    focusQuality: "pending" | "analyzing" | "complete";
    motionBlur: "pending" | "analyzing" | "complete";
  };
  onUpload: () => void;
}

/**
 * بطاقة محلل المشاهد
 */
const FootageAnalyzerCard = React.memo<FootageAnalyzerCardProps>(
  function FootageAnalyzerCard({ isUploading, analysisStatus, onUpload }) {
    /**
     * عناصر التحليل (محسنة للأداء)
     */
    const analysisItems = useMemo(
      () => [
        { key: "exposure", label: "Exposure Analysis" },
        { key: "colorConsistency", label: "Color Consistency" },
        { key: "focusQuality", label: "Focus Quality" },
        { key: "motionBlur", label: "Motion Blur" },
      ] as const,
      []
    );

    /**
     * تحويل الحالة إلى نص للعرض
     */
    const getStatusLabel = useCallback(
      (status: "pending" | "analyzing" | "complete") => {
        const labels = {
          pending: "Pending",
          analyzing: "Analyzing...",
          complete: "Complete ✓",
        };
        return labels[status];
      },
      []
    );

    /**
     * تحويل الحالة إلى variant للـ Badge
     */
    const getStatusVariant = useCallback(
      (status: "pending" | "analyzing" | "complete") => {
        if (status === "complete") return "default";
        return "outline";
      },
      []
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <span className="text-2xl">📹</span>
            <span>محلل المشاهد - Footage Analyzer</span>
          </CardTitle>
          <CardDescription>تحليل تقني للفيديو المصور</CardDescription>
        </CardHeader>
        <CardContent>
          {/* منطقة الرفع */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🎞️</div>
            <p className="text-gray-600 mb-4">ارفع ملف فيديو للتحليل</p>
            <Button onClick={onUpload} disabled={isUploading}>
              {isUploading ? "جاري الرفع..." : "📤 رفع فيديو"}
            </Button>
          </div>

          {/* نتائج التحليل */}
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold text-sm">التحليل التقني:</h4>
            <div className="grid grid-cols-2 gap-3">
              {analysisItems.map(({ key, label }) => (
                <Card key={key} className="p-3 bg-gray-50">
                  <p className="text-xs text-gray-500">{label}</p>
                  <Badge
                    variant={getStatusVariant(analysisStatus[key])}
                    className="mt-1"
                  >
                    {getStatusLabel(analysisStatus[key])}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

/**
 * خصائص بطاقة مدير التسليم
 */
interface DeliveryManagerCardProps {
  onCreateSettings: (platform: ExportSettings["platform"]) => void;
}

/**
 * بطاقة مدير التسليم
 */
const DeliveryManagerCard = React.memo<DeliveryManagerCardProps>(
  function DeliveryManagerCard({ onCreateSettings }) {
    /**
     * أزرار المنصات (محسنة للأداء)
     */
    const platformButtons = useMemo(
      () => [
        { platform: "cinema-dcp" as const, label: "🎬 Cinema DCP" },
        { platform: "broadcast-hd" as const, label: "📺 Broadcast HD" },
        { platform: "web-social" as const, label: "🌐 Web / Social" },
        { platform: "bluray" as const, label: "💿 Blu-ray" },
      ],
      []
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <span className="text-2xl">📦</span>
            <span>مدير التسليم - Delivery Manager</span>
          </CardTitle>
          <CardDescription>إعدادات التصدير والتسليم</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label>Platform / المنصة</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {platformButtons.map(({ platform, label }) => (
                  <Button
                    key={platform}
                    variant="outline"
                    size="sm"
                    onClick={() => onCreateSettings(platform)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full mt-4">⚙️ إنشاء إعدادات التصدير</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
);

export default PostProductionTools;
