"use client";

import { useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useApp } from "../../context/AppContext";
import { useWebcamAnalysis } from "../../hooks/useWebcamAnalysis";
import { formatTime } from "../../lib/utils";

export function WebcamAnalysisView() {
  const { showNotification } = useApp();
  const {
    state,
    videoRef,
    canvasRef,
    requestPermission,
    stopWebcam,
    startAnalysis,
    stopAnalysis,
    getBlinkStatusColor,
    getBlinkStatusText,
    getEyeDirectionText,
  } = useWebcamAnalysis();

  const handlePermissionRequest = useCallback(async () => {
    try {
      await requestPermission();
      showNotification("success", "تم تفعيل الكاميرا بنجاح!");
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error ? error.message : "تعذر تفعيل الكاميرا",
      );
    }
  }, [requestPermission, showNotification]);

  const handleStartAnalysis = useCallback(() => {
    const result = startAnalysis();
    if (!result.success) {
      showNotification("error", result.error ?? "تعذر بدء التحليل");
      return;
    }

    showNotification("info", "بدأ التحليل البصري المحلي...");
  }, [showNotification, startAnalysis]);

  const handleStopAnalysis = useCallback(() => {
    const result = stopAnalysis();
    if (!result) {
      return;
    }

    showNotification("success", `تم التحليل! النتيجة: ${result.overallScore}/100`);
  }, [showNotification, stopAnalysis]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          📹 تحليل الأداء البصري
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          تحليل لغة الجسد وخط النظر والتعبيرات باستخدام الكاميرا
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الكاميرا المباشرة</CardTitle>
            <CardDescription>فعّل الكاميرا لبدء التحليل البصري</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${state.isActive ? "opacity-100" : "opacity-0"}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {!state.isActive && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📷</div>
                    <p>اضغط لتفعيل الكاميرا</p>
                  </div>
                </div>
              )}

              {state.isAnalyzing && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm">{formatTime(state.analysisTime)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {!state.isActive ? (
                <Button onClick={handlePermissionRequest} className="flex-1">
                  📹 تفعيل الكاميرا
                </Button>
              ) : (
                <>
                  <Button onClick={stopWebcam} variant="destructive" className="flex-1">
                    ⏹ إيقاف الكاميرا
                  </Button>
                  {!state.isAnalyzing ? (
                    <Button onClick={handleStartAnalysis} className="flex-1">
                      🔍 بدء التحليل
                    </Button>
                  ) : (
                    <Button onClick={handleStopAnalysis} variant="outline" className="flex-1">
                      ⏹ إنهاء التحليل
                    </Button>
                  )}
                </>
              )}
            </div>

            {state.permission === "denied" && (
              <Alert variant="destructive">
                <AlertDescription>
                  تم رفض إذن الكاميرا. يرجى السماح بالوصول من إعدادات المتصفح.
                </AlertDescription>
              </Alert>
            )}

            {state.isAnalyzing && (
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 text-center">
                  <div className="text-2xl">👁️</div>
                  <div className="text-xs text-gray-600">خط النظر</div>
                  <div className="text-sm font-bold text-green-600">يراقب</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl">😊</div>
                  <div className="text-xs text-gray-600">التعبيرات</div>
                  <div className="text-sm font-bold text-blue-600">يحسب</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl">👀</div>
                  <div className="text-xs text-gray-600">الرمش</div>
                  <div className="text-sm font-bold text-purple-600">يقيس</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl">🎭</div>
                  <div className="text-xs text-gray-600">الحركة</div>
                  <div className="text-sm font-bold text-orange-600">يحلل</div>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نتائج التحليل</CardTitle>
            <CardDescription>
              {state.analysisResult ? "آخر تحليل" : "ابدأ التحليل لرؤية النتائج"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.analysisResult ? (
              <>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                  <div className="text-4xl font-bold text-purple-700">
                    {state.analysisResult.overallScore}
                  </div>
                  <div className="text-sm text-gray-600">النتيجة الإجمالية</div>
                  <Badge
                    className="mt-2"
                    variant={
                      state.analysisResult.overallScore >= 80 ? "default" : "secondary"
                    }
                  >
                    {state.analysisResult.overallScore >= 90
                      ? "ممتاز"
                      : state.analysisResult.overallScore >= 80
                        ? "جيد جداً"
                        : state.analysisResult.overallScore >= 70
                          ? "جيد"
                          : "يحتاج تحسين"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">👁️ خط النظر</h4>
                  <div className="flex justify-between text-sm">
                    <span>الاتجاه:</span>
                    <span>{getEyeDirectionText(state.analysisResult.eyeLine.direction)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>الاتساق:</span>
                    <span>{state.analysisResult.eyeLine.consistency}%</span>
                  </div>
                  <Progress value={state.analysisResult.eyeLine.consistency} className="h-2" />
                  {state.analysisResult.eyeLine.alerts.map((alert, index) => (
                    <p key={index} className="text-xs text-orange-600">
                      ⚠️ {alert}
                    </p>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">😊 تزامن التعبيرات</h4>
                  <div className="flex justify-between text-sm">
                    <span>النتيجة:</span>
                    <span>{state.analysisResult.expressionSync.score}%</span>
                  </div>
                  <Progress value={state.analysisResult.expressionSync.score} className="h-2" />
                  <div className="flex gap-1 flex-wrap">
                    {state.analysisResult.expressionSync.matchedEmotions.map((emotion, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        ✓ {emotion}
                      </Badge>
                    ))}
                  </div>
                  {state.analysisResult.expressionSync.mismatches.map((mismatch, index) => (
                    <p key={index} className="text-xs text-red-600">
                      ✗ {mismatch}
                    </p>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">👀 معدل الرمش</h4>
                  <div className="flex justify-between text-sm">
                    <span>المعدل:</span>
                    <span>{state.analysisResult.blinkRate.rate} مرة/دقيقة</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>الحالة:</span>
                    <span className={getBlinkStatusColor(state.analysisResult.blinkRate.status)}>
                      {getBlinkStatusText(state.analysisResult.blinkRate.status)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>مؤشر التوتر:</span>
                    <span>{state.analysisResult.blinkRate.tensionIndicator}%</span>
                  </div>
                  <Progress
                    value={state.analysisResult.blinkRate.tensionIndicator}
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">🎭 استخدام المساحة</h4>
                  <div className="flex justify-between text-sm">
                    <span>نسبة الاستخدام:</span>
                    <span>{state.analysisResult.blocking.spaceUsage}%</span>
                  </div>
                  <Progress value={state.analysisResult.blocking.spaceUsage} className="h-2" />
                  {state.analysisResult.blocking.movements.map((movement, index) => (
                    <p key={index} className="text-xs text-gray-600">
                      • {movement}
                    </p>
                  ))}
                  {state.analysisResult.blocking.suggestions.map((suggestion, index) => (
                    <p key={index} className="text-xs text-blue-600">
                      💡 {suggestion}
                    </p>
                  ))}
                </div>

                {state.analysisResult.alerts.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      <ul className="space-y-1">
                        {state.analysisResult.alerts.map((alert, index) => (
                          <li key={index} className="text-sm">
                            📌 {alert}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">📊</div>
                <p>ابدأ التحليل لرؤية النتائج التفصيلية</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الجلسات السابقة</CardTitle>
        </CardHeader>
        <CardContent>
          {state.sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد جلسات محفوظة بعد
            </div>
          ) : (
            <div className="space-y-3">
              {state.sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{session.date}</div>
                    <div className="text-sm text-gray-500">المدة: {session.duration}</div>
                  </div>
                  <div className="text-left">
                    <Badge variant={session.score >= 80 ? "default" : "secondary"}>
                      {session.score}/100
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {session.alerts[0] ?? "لا توجد تنبيهات"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💡 نصائح للتحليل البصري</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400">خط النظر</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                حافظ على نقطة بصرية ثابتة قريبة من العدسة عندما تحتاج إلى حضور مباشر.
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-semibold text-green-700 dark:text-green-400">التعبيرات</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                اجعل التغيير التعبيري مرتبطاً بالحدث أو النية لا بمجرد نهاية الجملة.
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-semibold text-purple-700 dark:text-purple-400">معدل الرمش</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                الزيادة المفاجئة في الرمش قد تعني إجهاداً أو توتراً بصرياً يحتاج إلى تهدئة.
              </p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h4 className="font-semibold text-orange-700 dark:text-orange-400">الحركة</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                كل انتقال داخل الكادر يجب أن يخدم المعنى ويُقرأ بوضوح من دون تشويش.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
