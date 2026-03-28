"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "../../context/AppContext";
import { SAMPLE_SCRIPT } from "../../types/constants";
import type { AlertSeverity, SceneRhythmAnalysis, TempoLevel } from "../../types";
import { analyzeSceneRhythmText } from "../../lib/script-analysis";

type RhythmTab = "map" | "comparison" | "monotony" | "suggestions";

export function SceneRhythmView() {
  const { showNotification } = useApp();
  const [rhythmScriptText, setRhythmScriptText] = useState("");
  const [analyzingRhythm, setAnalyzingRhythm] = useState(false);
  const [rhythmAnalysis, setRhythmAnalysis] = useState<SceneRhythmAnalysis | null>(null);
  const [selectedRhythmTab, setSelectedRhythmTab] = useState<RhythmTab>("map");

  const useRhythmSampleScript = useCallback(() => {
    setRhythmScriptText(SAMPLE_SCRIPT);
    showNotification("info", "تم تحميل النص التجريبي لتحليل الإيقاع");
  }, [showNotification]);

  const analyzeSceneRhythm = useCallback(() => {
    if (!rhythmScriptText.trim()) {
      showNotification("error", "يرجى إدخال نص أولاً لتحليل الإيقاع");
      return;
    }

    setAnalyzingRhythm(true);
    const analysis: SceneRhythmAnalysis = analyzeSceneRhythmText(rhythmScriptText);
    setRhythmAnalysis(analysis);
    setAnalyzingRhythm(false);
    showNotification("success", "تم تحليل إيقاع المشهد بنجاح!");
  }, [rhythmScriptText, showNotification]);

  const getTempoColor = (tempo: TempoLevel): string => {
    switch (tempo) {
      case "slow":
        return "bg-blue-400";
      case "medium":
        return "bg-green-400";
      case "fast":
        return "bg-orange-400";
      case "very-fast":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getTempoLabel = (tempo: TempoLevel): string => {
    switch (tempo) {
      case "slow":
        return "بطيء";
      case "medium":
        return "متوسط";
      case "fast":
        return "سريع";
      case "very-fast":
        return "سريع جداً";
      default:
        return tempo;
    }
  };

  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case "low":
        return "bg-yellow-100 border-yellow-400 text-yellow-800";
      case "medium":
        return "bg-orange-100 border-orange-400 text-orange-800";
      case "high":
        return "bg-red-100 border-red-400 text-red-800";
      default:
        return "bg-gray-100 border-gray-400 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">🎵</span>
        <h2 className="text-3xl font-bold text-gray-800">تحليل إيقاع المشهد</h2>
      </div>
      <p className="text-gray-600 mb-8">اكتشف إيقاع أدائك وحسّنه بأدوات التحليل المتقدمة</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📝 النص المسرحي</CardTitle>
            <CardDescription>أدخل نصك لتحليل الإيقاع</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={useRhythmSampleScript}>
                📄 نص تجريبي
              </Button>
            </div>
            <Textarea
              placeholder="الصق نصك هنا..."
              className="min-h-[300px]"
              value={rhythmScriptText}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRhythmScriptText(e.target.value)}
            />
            <Button className="w-full" onClick={analyzeSceneRhythm} disabled={analyzingRhythm || !rhythmScriptText.trim()}>
              {analyzingRhythm ? "⏳ جاري تحليل الإيقاع..." : "🎵 تحليل الإيقاع"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📊 نتائج التحليل</CardTitle>
            {rhythmAnalysis && (
              <div className="flex items-center gap-4 mt-2">
                <Badge className="text-lg px-4 py-1">النتيجة: {rhythmAnalysis.rhythmScore}/100</Badge>
                <Badge variant="outline" className="text-lg px-4 py-1">
                  الإيقاع: {getTempoLabel(rhythmAnalysis.overallTempo)}
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!rhythmAnalysis ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-8xl mb-4 opacity-30">🎵</div>
                <p className="text-xl">أدخل نصاً وابدأ التحليل لرؤية النتائج</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-6 flex-wrap">
                  <Button variant={selectedRhythmTab === "map" ? "default" : "outline"} onClick={() => setSelectedRhythmTab("map")} size="sm">🗺️ خريطة الإيقاع</Button>
                  <Button variant={selectedRhythmTab === "comparison" ? "default" : "outline"} onClick={() => setSelectedRhythmTab("comparison")} size="sm">📊 المقارنة</Button>
                  <Button variant={selectedRhythmTab === "monotony" ? "default" : "outline"} onClick={() => setSelectedRhythmTab("monotony")} size="sm">⚠️ اكتشاف الرتابة</Button>
                  <Button variant={selectedRhythmTab === "suggestions" ? "default" : "outline"} onClick={() => setSelectedRhythmTab("suggestions")} size="sm">🎨 التلوين العاطفي</Button>
                </div>

                {selectedRhythmTab === "map" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">📋 ملخص التحليل:</h4>
                      <p className="text-gray-700">{rhythmAnalysis.summary}</p>
                    </div>
                    <div className="space-y-2">
                      {rhythmAnalysis.rhythmMap.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                          <div className={`w-10 h-10 rounded-full ${getTempoColor(point.tempo)} flex items-center justify-center text-white font-bold`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{point.beat}</div>
                            <div className="text-sm text-gray-600">{point.emotion} • {getTempoLabel(point.tempo)}</div>
                          </div>
                          <div className="text-left">
                            <Progress value={point.intensity} className="w-20" />
                            <span className="text-xs text-gray-500">{point.intensity}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRhythmTab === "comparison" && (
                  <div className="space-y-4">
                    {rhythmAnalysis.comparisons.map((comp, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-semibold">{comp.aspect}</h5>
                          <Badge variant={comp.difference >= 0 ? "default" : "outline"}>
                            {comp.difference >= 0 ? `+${comp.difference}` : comp.difference}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">💡 {comp.feedback}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRhythmTab === "monotony" && (
                  <div className="space-y-4">
                    {rhythmAnalysis.monotonyAlerts.map((alert, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}>
                        <h5 className="font-semibold mb-1">{alert.description}</h5>
                        <p className="text-sm">💡 {alert.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRhythmTab === "suggestions" && (
                  <div className="space-y-4">
                    {rhythmAnalysis.emotionalSuggestions.map((sugg, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-base">"{sugg.segment}"</CardTitle>
                          <CardDescription>{sugg.currentEmotion} ← {sugg.suggestedEmotion}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p><strong>التقنية:</strong> {sugg.technique}</p>
                          <p><strong>مثال:</strong> {sugg.example}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
