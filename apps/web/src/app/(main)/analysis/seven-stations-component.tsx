/**
 * @module app/(main)/analysis/seven-stations-component
 * @description مكون واجهة المستخدم لنظام المحطات السبع للتحليل الدرامي
 * 
 * السبب: هذا المكون يقدم واجهة تفاعلية للمستخدم لتحليل السيناريوهات
 * عبر نظام المحطات السبع المتقدم، مع دعم تحليل التدفقات (Flows)
 * وتقنية RAG للنصوص الطويلة.
 * 
 * الهيكلية:
 * - يستخدم useSevenStationsAnalysis hook لإدارة الحالة
 * - مكونات فرعية مُذكّرة (memoized) لتحسين الأداء
 * - معالجة أخطاء موحدة مع Toast Notifications
 */

"use client";

import { memo, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  Network,
  FileText,
  Sparkles,
} from "lucide-react";
import { useSevenStationsAnalysis } from "@/hooks/useSevenStationsAnalysis";
import type {
  AnalysisResult,
  Station1Result,
  FlowsResult,
  RAGResult,
  AnalysisMetadata,
} from "@/types/analysis";

// ==========================================
// المكونات الفرعية المُذكّرة (Memoized)
// ==========================================

/**
 * مكون عرض رسالة الخطأ
 * السبب: فصل عرض الأخطاء لتسهيل الصيانة وإعادة الاستخدام
 */
interface ErrorMessageProps {
  message: string;
}

const ErrorMessage = memo(function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
      <p className="text-red-600">{message}</p>
    </div>
  );
});

/**
 * مكون عرض رسالة النجاح
 * السبب: توحيد عرض رسائل النجاح
 */
const SuccessMessage = memo(function SuccessMessage() {
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
      <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
      <p className="text-green-600 font-medium">تم التحليل بنجاح!</p>
    </div>
  );
});

/**
 * مكون عرض نتائج المحطة الأولى
 * السبب: عرض التحليل النصي الأساسي بشكل منظم
 */
interface Station1CardProps {
  data: Station1Result;
}

const Station1Card = memo(function Station1Card({ data }: Station1CardProps) {
  const majorCharacters = useMemo(() => data.majorCharacters ?? [], [data.majorCharacters]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="secondary">المحطة 1</Badge>
          التحليل النصي الأساسي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.logline && (
          <div>
            <h5 className="font-medium mb-1">Logline:</h5>
            <p className="text-sm text-muted-foreground">{data.logline}</p>
          </div>
        )}
        {majorCharacters.length > 0 && (
          <div>
            <h5 className="font-medium mb-1">الشخصيات الرئيسية:</h5>
            <div className="flex flex-wrap gap-1">
              {majorCharacters.map((char, i) => (
                <Badge key={`char-${char}-${i}`} variant="outline">{char}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

/**
 * مكون عرض نتائج التدفقات (Flows)
 * السبب: عرض تحليلات متقدمة للشخصيات والمواضيع والكفاءة
 */
interface FlowsCardProps {
  data: FlowsResult;
}

const FlowsCard = memo(function FlowsCard({ data }: FlowsCardProps) {
  const { charactersRelationships, themesGenres, efficiency, conflictNetwork } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-600" />
          تحليل Flows المتقدم
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* قسم الشخصيات والعلاقات */}
        {charactersRelationships && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h5 className="font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              الشخصيات والعلاقات
            </h5>
            {charactersRelationships.characters?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">الشخصيات:</p>
                <div className="flex flex-wrap gap-1">
                  {charactersRelationships.characters.map((char, i) => (
                    <Badge key={`flow-char-${char}-${i}`} variant="secondary">{char}</Badge>
                  ))}
                </div>
              </div>
            )}
            {charactersRelationships.relationships?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">العلاقات:</p>
                <ul className="text-xs space-y-1">
                  {charactersRelationships.relationships.map((rel, i) => (
                    <li key={`rel-${rel.substring(0, 20)}-${i}`} className="text-muted-foreground">• {rel}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* قسم المواضيع والأنواع */}
        {themesGenres && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <h5 className="font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              المواضيع والأنواع
            </h5>
            {themesGenres.themes?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">المواضيع:</p>
                <div className="flex flex-wrap gap-1">
                  {themesGenres.themes.map((theme, i) => (
                    <Badge key={`theme-${theme}-${i}`} variant="secondary">{theme}</Badge>
                  ))}
                </div>
              </div>
            )}
            {themesGenres.genres?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">الأنواع:</p>
                <div className="flex flex-wrap gap-1">
                  {themesGenres.genres.map((genre, i) => (
                    <Badge key={`genre-${genre}-${i}`} variant="outline">{genre}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* قسم الكفاءة والفعالية */}
        {efficiency && (
          <div className="p-3 bg-green-50 rounded-lg">
            <h5 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              الكفاءة والفعالية
            </h5>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${efficiency.efficiencyScore}%` }}
                />
              </div>
              <span className="text-sm font-medium">{efficiency.efficiencyScore}%</span>
            </div>
            <p className="text-xs text-muted-foreground">{efficiency.effectivenessAnalysis}</p>
          </div>
        )}

        {/* قسم شبكة الصراع */}
        {conflictNetwork && (
          <div className="p-3 bg-red-50 rounded-lg">
            <h5 className="font-medium mb-2 flex items-center gap-2">
              <Network className="w-4 h-4" />
              شبكة الصراع
            </h5>
            <p className="text-xs text-muted-foreground">
              تم توليد شبكة الصراع بنجاح. البيانات متاحة بصيغة JSON.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

/**
 * مكون عرض نتائج RAG
 * السبب: عرض نتائج معالجة النصوص الطويلة
 */
interface RAGCardProps {
  data: RAGResult;
}

const RAGCard = memo(function RAGCard({ data }: RAGCardProps) {
  const chunks = useMemo(() => data.chunks ?? [], [data.chunks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          تحليل RAG (للنصوص الطويلة)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={data.needsChunking ? "default" : "secondary"}>
              {data.needsChunking ? "تم التقسيم" : "لا يحتاج تقسيم"}
            </Badge>
          </div>
          {data.needsChunking && chunks.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                عدد الأجزاء: {chunks.length}
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {chunks.map((chunk, i) => (
                  <div key={chunk.id} className="text-xs p-2 bg-background rounded">
                    <span className="font-medium">جزء {i + 1}:</span> {chunk.content}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-2">
            <p className="text-xs font-medium mb-1">الملخص:</p>
            <p className="text-xs text-muted-foreground">{data.summary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * مكون عرض البيانات الوصفية
 * السبب: عرض معلومات تقنية عن عملية التحليل
 */
interface MetadataCardProps {
  data: AnalysisMetadata;
}

const MetadataCard = memo(function MetadataCard({ data }: MetadataCardProps) {
  const agentsUsedText = useMemo(
    () => data.agentsUsed?.join(", ") ?? "",
    [data.agentsUsed]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">بيانات الوصفية</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">الحالة</p>
            <p className="font-medium">{data.status}</p>
          </div>
          <div>
            <p className="text-muted-foreground">وقت التنفيذ</p>
            <p className="font-medium">{data.executionTime}ms</p>
          </div>
          <div>
            <p className="text-muted-foreground">التوكنز</p>
            <p className="font-medium">{data.tokensUsed}</p>
          </div>
          <div>
            <p className="text-muted-foreground">الوكلاء</p>
            <p className="font-medium">{agentsUsedText}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">الميزات المفعلة:</p>
          <div className="flex gap-2">
            <Badge variant={data.features.station1 ? "default" : "secondary"}>
              Station 1
            </Badge>
            <Badge variant={data.features.flows ? "default" : "secondary"}>
              Flows
            </Badge>
            <Badge variant={data.features.rag ? "default" : "secondary"}>
              RAG
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * مكون عرض نتائج التحليل
 * السبب: تجميع كل مكونات النتائج في مكون واحد
 */
interface AnalysisResultsProps {
  result: AnalysisResult;
}

const AnalysisResults = memo(function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <div className="space-y-4 mt-6">
      <SuccessMessage />
      
      {result.station1 && <Station1Card data={result.station1} />}
      {result.flows && <FlowsCard data={result.flows} />}
      {result.rag && <RAGCard data={result.rag} />}
      {result.metadata && <MetadataCard data={result.metadata} />}
    </div>
  );
});

// ==========================================
// المكون الرئيسي
// ==========================================

/**
 * مكون نظام المحطات السبع للتحليل الدرامي
 * 
 * السبب: المكون الرئيسي الذي يجمع كل العناصر معاً ويوفر
 * تجربة مستخدم متكاملة لتحليل السيناريوهات.
 * 
 * الميزات:
 * - إدخال نص السيناريو
 * - تنفيذ التحليل عبر المحطات السبع
 * - عرض نتائج التحليل بشكل منظم
 * - معالجة الأخطاء وعرض رسائل توضيحية
 */
export default function SevenStationsComponent() {
  const {
    text,
    setText,
    isAnalyzing,
    result,
    error,
    analyze,
    canAnalyze,
  } = useSevenStationsAnalysis();

  /**
   * معالج تغيير النص
   * السبب: تحديث قيمة النص عند تغييره
   */
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
    },
    [setText]
  );

  /**
   * معالج زر التحليل
   * السبب: بدء عملية التحليل عند الضغط على الزر
   */
  const handleAnalyze = useCallback(() => {
    analyze();
  }, [analyze]);

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600" />
            نظام المحطات السبع للتحليل الدرامي
          </CardTitle>
          <CardDescription>
            تحليل متقدم للسيناريو عبر 7 محطات متتابعة مع دعم Flows و RAG
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* حقل إدخال النص */}
          <div>
            <label htmlFor="screenplay-input" className="block text-sm font-medium mb-2">
              نص السيناريو
            </label>
            <Textarea
              id="screenplay-input"
              value={text}
              onChange={handleTextChange}
              placeholder="أدخل نص السيناريو هنا..."
              className="min-h-[200px]"
              disabled={isAnalyzing}
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

          {/* عرض رسالة الخطأ */}
          {error && (
            <div id="error-message">
              <ErrorMessage message={error} />
            </div>
          )}

          {/* زر بدء التحليل */}
          <Button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="w-full"
            size="lg"
            aria-busy={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                جاري التحليل عبر المحطات السبع...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 ml-2" />
                بدء التحليل الشامل
              </>
            )}
          </Button>

          {/* عرض النتائج */}
          {result && <AnalysisResults result={result} />}
        </CardContent>
      </Card>
    </div>
  );
}
