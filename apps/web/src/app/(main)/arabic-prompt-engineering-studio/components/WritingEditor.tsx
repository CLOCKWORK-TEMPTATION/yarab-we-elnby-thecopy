// WritingEditor.tsx
// محرر الكتابة الذكي

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CreativeProject,
  CreativePrompt,
  AppSettings,
  TextAnalysis,
} from "@/app/(main)/arabic-creative-writing-studio/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

interface WritingEditorProps {
  project: CreativeProject | null;
  selectedPrompt: CreativePrompt | null;
  onProjectChange: (project: CreativeProject) => void;
  onSave: (project: CreativeProject) => void;
  onAnalyze: (text: string) => Promise<TextAnalysis | null>;
  onExport: (
    project: CreativeProject,
    format: "txt" | "json" | "html" | "rtf"
  ) => void;
  settings: AppSettings;
  loading: boolean;
}

export const WritingEditor: React.FC<WritingEditorProps> = ({
  project,
  selectedPrompt,
  onProjectChange,
  onSave,
  onAnalyze,
  onExport,
  settings,
  loading = false,
}) => {
  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null);
  const [writingTime, setWritingTime] = useState<number>(0);
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  // تحديث المحتوى عند تغيير المشروع
  useEffect(() => {
    if (project) {
      setContent(project.content);
      setTitle(project.title);
    } else {
      setContent("");
      setTitle("مشروع جديد");
    }
  }, [project]);

  // حساب إحصائيات النص
  const textStats = React.useMemo(() => {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characterCount = content.length;
    const paragraphCount = content.split("\n\n").filter((p) => p.trim()).length;
    const sentenceCount = content
      .split(/[.!?]+/)
      .filter((s) => s.trim()).length;

    return {
      wordCount,
      characterCount,
      paragraphCount,
      sentenceCount,
      averageWordsPerSentence:
        sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0,
    };
  }, [content]);

  // تحديث وقت الكتابة
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isWriting) {
      interval = setInterval(() => {
        setWritingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWriting]);

  // معالجة تغيير المحتوى
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setIsWriting(true);

      // تحديث المشروع
      if (project) {
        const updatedProject: CreativeProject = {
          ...project,
          title,
          content: newContent,
          wordCount: textStats.wordCount,
          characterCount: textStats.characterCount,
          paragraphCount: textStats.paragraphCount,
          updatedAt: new Date(),
        };
        onProjectChange(updatedProject);

        // حفظ تلقائي
        if (settings.autoSave && autoSaveTimer) {
          clearTimeout(autoSaveTimer);
        }

        if (settings.autoSave) {
          const timer = setTimeout(() => {
            onSave(updatedProject);
          }, settings.autoSaveInterval);
          setAutoSaveTimer(timer);
        }
      }
    },
    [
      project,
      title,
      textStats,
      onProjectChange,
      onSave,
      settings,
      autoSaveTimer,
    ]
  );

  // معالجة تحليل النص
  const handleAnalyze = useCallback(async () => {
    if (!content.trim()) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await onAnalyze(content);
      setAnalysis(result);
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, onAnalyze]);

  // حفظ المشروع
  const handleSave = useCallback(() => {
    if (project) {
      const updatedProject: CreativeProject = {
        ...project,
        title,
        content,
        wordCount: textStats.wordCount,
        characterCount: textStats.characterCount,
        paragraphCount: textStats.paragraphCount,
        updatedAt: new Date(),
      };
      onSave(updatedProject);
    }
  }, [project, title, content, textStats, onSave]);

  // تنسيق الوقت
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // عرض لوحة الإحصائيات
  const renderStatsPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle>📊 إحصائيات النص</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {textStats.wordCount}
            </div>
            <div className="text-sm text-gray-600">كلمة</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {textStats.characterCount}
            </div>
            <div className="text-sm text-gray-600">حرف</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {textStats.paragraphCount}
            </div>
            <div className="text-sm text-gray-600">فقرة</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatTime(writingTime)}
            </div>
            <div className="text-sm text-gray-600">وقت الكتابة</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // عرض لوحة التحليل
  const renderAnalysisPanel = () => {
    if (!analysis) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>🎯 تحليل جودة النص</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analysis.qualityMetrics).map(([key, value]) => {
              const labels: Record<string, string> = {
                clarity: "الوضوح",
                creativity: "الإبداع",
                coherence: "التماسك",
                impact: "التأثير",
              };

              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{labels[key]}</span>
                    <span className="text-sm font-bold">{value}/100</span>
                  </div>
                  <Progress value={value} className="w-full" />
                </div>
              );
            })}
          </div>

          {analysis.suggestions.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">💡 اقتراحات التحسين:</h4>
              <ul className="space-y-1">
                {analysis.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 flex items-start"
                  >
                    <span className="text-yellow-500 mr-2">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✍️</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          لا يوجد مشروع مفتوح
        </h3>
        <p className="text-gray-500">
          اختر محفزاً من المكتبة أو أنشئ مشروعاً جديداً
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* شريط الأدوات */}
      <Card className="p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold"
              placeholder="عنوان المشروع..."
            />
            {settings.autoSave && (
              <span className="text-sm text-green-600">💾 حفظ تلقائي مفعل</span>
            )}
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !content.trim()}
              variant="default"
            >
              {isAnalyzing ? "🔄 جاري التحليل..." : "🔍 تحليل النص"}
            </Button>

            <Button onClick={handleSave} variant="default">
              💾 حفظ
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default">📤 تصدير</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport(project, "txt")}>
                  📄 نص خالي (TXT)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(project, "html")}>
                  🌐 صفحة ويب (HTML)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(project, "json")}>
                  📋 بيانات منظمة (JSON)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(project, "rtf")}>
                  📝 نص غني (RTF)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* منطقة الكتابة */}
        <div className="lg:col-span-3">
          {/* عرض المحفز المحدد */}
          {selectedPrompt && (
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">
                📝 المحفز الإبداعي: {selectedPrompt.title}
              </h3>
              <p className="text-purple-700 leading-relaxed">
                {selectedPrompt.arabic}
              </p>
              {selectedPrompt.tips && selectedPrompt.tips.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-purple-800 mb-2">
                    💡 نصائح:
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    {selectedPrompt.tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* محرر النص */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <textarea
              ref={editorRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="ابدأ كتابة إبداعك هنا... 🖋️"
              className={`w-full h-96 p-6 border-none resize-none focus:outline-none ${
                settings.fontSize === "small"
                  ? "text-sm"
                  : settings.fontSize === "large"
                    ? "text-lg"
                    : "text-base"
              }`}
              style={{
                fontFamily:
                  "'Noto Sans Arabic', 'Cairo', 'Tajawal', Arial, sans-serif",
                lineHeight: 1.8,
                direction: settings.textDirection,
              }}
            />
          </div>
        </div>

        {/* اللوحة الجانبية */}
        <div className="space-y-6">
          {renderStatsPanel()}
          {analysis && renderAnalysisPanel()}

          {/* نصائح الكتابة */}
          <Card>
            <CardHeader>
              <CardTitle>💡 نصائح سريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  اكتب بدون توقف لأول 10 دقائق
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  لا تخف من المسودة الأولى السيئة
                </div>
                <div className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  استخدم الحواس الخمس في الوصف
                </div>
                <div className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  اقرأ النص بصوت عال للتدقيق
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WritingEditor;
