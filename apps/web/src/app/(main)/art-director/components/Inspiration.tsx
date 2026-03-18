/**
 * Inspiration - صفحة الإلهام البصري
 * 
 * @description يوفر هذا المكون أدوات لإنشاء لوحات مزاجية وباليتات ألوان للمشاهد
 * يساعد مديري الفن في تصور الهوية البصرية للمشروع
 * 
 * @architecture
 * - يدعم تحليل المشهد باستخدام AI
 * - يولد باليتات ألوان مقترحة
 * - يعرض النتائج بشكل تفاعلي
 */

"use client";

import { useState, useCallback } from "react";
import { Palette, Sparkles, Image, Wand2 } from "lucide-react";
import type { ColorPaletteInspiration, MoodBoard, ApiResponse } from "../types";

/**
 * واجهة نتيجة التحليل من API
 */
interface AnalysisApiResponse extends ApiResponse<MoodBoard> {
  data?: MoodBoard;
}

/**
 * واجهة نتيجة الباليت من API
 */
interface PaletteApiResponse extends ApiResponse<{ palettes: ColorPaletteInspiration[] }> {
  data?: { palettes: ColorPaletteInspiration[] };
}

/**
 * مكون عرض الألوان
 */
interface ColorSwatchProps {
  color: string;
}

function ColorSwatch({ color }: ColorSwatchProps) {
  return (
    <div
      className="art-color-swatch"
      style={{ background: color }}
      title={color}
      role="presentation"
    />
  );
}

/**
 * مكون صف الألوان
 */
interface ColorRowProps {
  colors: string[];
}

function ColorRow({ colors }: ColorRowProps) {
  return (
    <div className="art-color-row">
      {colors.map((color, index) => (
        <ColorSwatch key={index} color={color} />
      ))}
    </div>
  );
}

/**
 * مكون بطاقة الباليت
 */
interface PaletteCardProps {
  palette: ColorPaletteInspiration;
}

function PaletteCard({ palette }: PaletteCardProps) {
  return (
    <div className="art-card">
      <h4 style={{ marginBottom: "4px" }}>{palette.nameAr}</h4>
      <p style={{ color: "var(--art-text-muted)", fontSize: "12px", marginBottom: "12px" }}>
        {palette.name}
      </p>
      <ColorRow colors={palette.colors} />
    </div>
  );
}

/**
 * مكون عرض نتائج التحليل
 */
interface AnalysisResultProps {
  result: MoodBoard;
}

function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="art-card" style={{ marginBottom: "24px", animation: "fadeIn 0.3s ease-in-out" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <Image size={20} aria-hidden="true" /> نتائج التحليل
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <span style={{ color: "var(--art-text-muted)" }}>الموضوع: </span>
        <span style={{ fontWeight: 600 }}>{result.themeAr}</span>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <span style={{ color: "var(--art-text-muted)", display: "block", marginBottom: "8px" }}>
          الكلمات المفتاحية:
        </span>
        <div>
          {result.keywords.map((keyword, index) => (
            <span key={index} className="art-keyword-tag">{keyword}</span>
          ))}
        </div>
      </div>

      {result.suggestedPalette && (
        <div>
          <span style={{ color: "var(--art-text-muted)", display: "block", marginBottom: "8px" }}>
            الباليت المقترح: {result.suggestedPalette.nameAr}
          </span>
          <ColorRow colors={result.suggestedPalette.colors} />
        </div>
      )}
    </div>
  );
}

/**
 * مكون شبكة الباليتات
 */
interface PalettesGridProps {
  palettes: ColorPaletteInspiration[];
}

function PalettesGrid({ palettes }: PalettesGridProps) {
  if (palettes.length === 0) return null;

  return (
    <div className="art-grid-3" style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {palettes.map((palette, index) => (
        <PaletteCard key={index} palette={palette} />
      ))}
    </div>
  );
}

/**
 * المكون الرئيسي لصفحة الإلهام
 */
export default function Inspiration() {
  const [sceneDescription, setSceneDescription] = useState("");
  const [mood, setMood] = useState("");
  const [era, setEra] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MoodBoard | null>(null);
  const [palettes, setPalettes] = useState<ColorPaletteInspiration[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * تحليل المشهد وتوليد لوحة المزاج
   */
  const handleAnalyze = useCallback(async () => {
    if (!sceneDescription.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/inspiration/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneDescription,
          mood: mood || undefined,
          era: era || undefined,
        }),
      });
      
      const data: AnalysisApiResponse = await response.json();
      
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError(data.error ?? "فشل في تحليل المشهد");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sceneDescription, mood, era]);

  /**
   * توليد باليتات ألوان مقترحة
   */
  const handleGeneratePalette = useCallback(async () => {
    if (!mood) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/inspiration/palette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, count: 3 }),
      });
      
      const data: PaletteApiResponse = await response.json();
      
      if (data.success && data.data?.palettes) {
        setPalettes(data.data.palettes);
      } else {
        setError(data.error ?? "فشل في توليد الباليتات");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mood]);

  return (
    <div className="art-director-page">
      {/* رأس الصفحة */}
      <header className="art-page-header">
        <Palette size={32} className="header-icon" aria-hidden="true" />
        <div>
          <h1>الإلهام البصري</h1>
          <p>إنشاء لوحات مزاجية وباليتات ألوان للمشاهد</p>
        </div>
      </header>

      <div className="art-grid-2" style={{ gap: "24px" }}>
        {/* قسم تحليل المشهد */}
        <section className="art-card">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Wand2 size={20} aria-hidden="true" /> تحليل المشهد
          </h2>

          <div className="art-form-group">
            <label htmlFor="scene-description">وصف المشهد</label>
            <textarea
              id="scene-description"
              className="art-input"
              placeholder="صف المشهد بالتفصيل... مثال: مشهد رومانسي في مقهى قديم بباريس في الثلاثينيات"
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              rows={4}
              style={{ resize: "none" }}
            />
          </div>

          <div className="art-form-grid">
            <div className="art-form-group">
              <label htmlFor="mood-select">المزاج العام</label>
              <select
                id="mood-select"
                className="art-input"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              >
                <option value="">اختر المزاج</option>
                <option value="romantic">رومانسي</option>
                <option value="dramatic">درامي</option>
                <option value="mysterious">غامض</option>
                <option value="cheerful">مرح</option>
                <option value="melancholic">حزين</option>
                <option value="tense">متوتر</option>
              </select>
            </div>

            <div className="art-form-group">
              <label htmlFor="era-select">الحقبة الزمنية</label>
              <select
                id="era-select"
                className="art-input"
                value={era}
                onChange={(e) => setEra(e.target.value)}
              >
                <option value="">اختر الحقبة</option>
                <option value="ancient">قديمة</option>
                <option value="medieval">عصور وسطى</option>
                <option value="victorian">فيكتورية</option>
                <option value="1920s">العشرينيات</option>
                <option value="1950s">الخمسينيات</option>
                <option value="1980s">الثمانينيات</option>
                <option value="modern">حديثة</option>
                <option value="futuristic">مستقبلية</option>
              </select>
            </div>
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div 
              className="art-alert art-alert-error" 
              style={{ marginTop: "12px" }} 
              role="alert"
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button 
              className="art-btn" 
              onClick={handleAnalyze} 
              disabled={loading || !sceneDescription.trim()}
            >
              <Sparkles size={18} aria-hidden="true" />
              {loading ? "جاري التحليل..." : "تحليل المشهد"}
            </button>
            <button 
              className="art-btn art-btn-secondary" 
              onClick={handleGeneratePalette} 
              disabled={loading || !mood}
            >
              <Palette size={18} aria-hidden="true" />
              اقتراح ألوان
            </button>
          </div>
        </section>

        {/* قسم النتائج */}
        <section>
          {result && <AnalysisResult result={result} />}
          <PalettesGrid palettes={palettes} />
        </section>
      </div>
    </div>
  );
}
