/**
 * @fileoverview محتوى صفحة تقرير التحليل
 * 
 * هذا المكون يعرض تقرير التحليل النهائي للنص
 * بما في ذلك التقييم العام ونقاط القوة والضعف.
 * 
 * السبب: نفصل محتوى الصفحة لتمكين التحميل الديناميكي
 * وتحسين أداء التطبيق.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { logError } from "./config";
import { validateAnalysisReport, AnalysisReportOutput } from "./schemas";

/**
 * مكون محتوى تقرير التحليل
 * 
 * يجلب تقرير التحليل من الخادم ويعرضه بشكل منظم.
 */
export default function BreakdownContent() {
  const [report, setReport] = useState<AnalysisReportOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * يجلب تقرير التحليل من الخادم
   * 
   * السبب: نستخدم Zod للتحقق من صحة البيانات
   * ونوفر معالجة أخطاء واضحة للمستخدم
   */
  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch("/analysis_output/final-report.json");
      
      if (!res.ok) {
        throw new Error(`فشل في تحميل التقرير: ${res.status}`);
      }
      
      const data = await res.json();
      
      // التحقق من صحة البيانات باستخدام Zod
      const validationResult = validateAnalysisReport(data);
      
      if (!validationResult.success) {
        logError('BreakdownContent.fetchReport', new Error(validationResult.error));
        setError('تنسيق التقرير غير صحيح');
        return;
      }
      
      setReport(validationResult.data);
    } catch (err) {
      logError('BreakdownContent.fetchReport', err);
      setError('فشل في تحميل تقرير التحليل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل تقرير التحليل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">تحليل النص</h1>
          <p className="text-muted-foreground">
            {error || 'لم يتم العثور على تقرير تحليل.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">📊 تحليل شامل للنص</h1>
        <p className="text-muted-foreground">
          تقرير مفصل عن جودة النص ونقاط القوة والضعف
        </p>
      </div>

      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>التقييم العام</CardTitle>
          <CardDescription>نظرة شاملة على جودة النص</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {report.overallAssessment.narrativeQualityScore}
              </div>
              <div className="text-sm text-muted-foreground">جودة السرد</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {report.overallAssessment.structuralIntegrityScore}
              </div>
              <div className="text-sm text-muted-foreground">
                السلامة الهيكلية
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {report.overallAssessment.characterDevelopmentScore}
              </div>
              <div className="text-sm text-muted-foreground">
                تطوير الشخصيات
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {report.overallAssessment.conflictEffectivenessScore}
              </div>
              <div className="text-sm text-muted-foreground">فعالية الصراع</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {report.overallAssessment.overallScore}
              </div>
              <div className="text-sm text-muted-foreground">
                النتيجة الإجمالية
              </div>
            </div>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-lg px-4 py-2">
              التصنيف: {report.overallAssessment.rating}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>الملخص التنفيذي</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{report.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* Strengths */}
      {report.strengthsAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">💪 نقاط القوة</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.strengthsAnalysis.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Weaknesses */}
      {report.weaknessesIdentified.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">⚠️ نقاط الضعف</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.weaknessesIdentified.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {weakness}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      {report.opportunitiesForImprovement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">🚀 فرص التحسين</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.opportunitiesForImprovement.map((opportunity, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {opportunity}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Threats */}
      {report.threatsToCohesion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-700">
              ⚡ التهديدات للتماسك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.threatsToCohesion.map((threat, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  {threat}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
