"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useApp } from "../../context/AppContext";
import { formatTime } from "../../lib/utils";
import { SAMPLE_SCRIPT, ACTING_METHODOLOGIES } from "../../types/constants";
import type { AnalysisResult, ChatMessage, Recording } from "../../types";
import {
  analyzeScriptText,
  buildPartnerResponse,
} from "../../lib/script-analysis";
import { buildTakeInsights } from "../../lib/self-tape";

const INITIAL_RECORDINGS: Recording[] = [
  { id: "1", title: "مشهد الحديقة - التجربة 3", duration: "3:42", date: "2025-10-30", score: 82 },
  { id: "2", title: "مشهد اللقاء - التجربة 1", duration: "4:15", date: "2025-10-29", score: 76 },
];

export function DemoView() {
  const { showNotification, addRecording } = useApp();

  // حالة تحليل النص
  const [scriptText, setScriptText] = useState("");
  const [selectedMethodology, setSelectedMethodology] = useState("stanislavsky");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // حالة شريك المشهد
  const [rehearsing, setRehearsing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // حالة التسجيل
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>(INITIAL_RECORDINGS);

  // تايمر التسجيل
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // وظائف تحليل النص
  const useSampleScript = useCallback(() => {
    setScriptText(SAMPLE_SCRIPT);
    showNotification("info", "تم تحميل النص التجريبي");
  }, [showNotification]);

  const analyzeScript = useCallback(() => {
    if (!scriptText.trim()) {
      showNotification("error", "يرجى إدخال نص أولاً");
      return;
    }
    setAnalyzing(true);
    const result: AnalysisResult = analyzeScriptText(
      scriptText,
      selectedMethodology,
    );
    setAnalysisResult(result);
    setAnalyzing(false);
    showNotification("success", "تم تحليل النص بنجاح!");
  }, [scriptText, selectedMethodology, showNotification]);

  // وظائف شريك المشهد
  const startRehearsal = useCallback(() => {
    setRehearsing(true);
    setChatMessages([
      {
        role: "ai",
        text: "مرحباً! أنا شريكك في المشهد. سأقوم بدور ليلى. ابدأ بقول سطرك الأول...",
      },
    ]);
  }, []);

  const sendMessage = useCallback(() => {
    if (!userInput.trim()) return;
    const newMessage: ChatMessage = { role: "user", text: userInput };
    const aiMessage = buildPartnerResponse({
      scriptText: scriptText || SAMPLE_SCRIPT,
      history: [...chatMessages, newMessage],
      userInput,
    });
    setChatMessages((prev) => [
      ...prev,
      newMessage,
      { role: "ai", text: aiMessage },
    ]);
    setUserInput("");
  }, [chatMessages, scriptText, userInput]);

  const endRehearsal = useCallback(() => {
    setRehearsing(false);
    setChatMessages([]);
    showNotification("success", "انتهت جلسة التدريب! أحسنت 👏");
  }, [showNotification]);

  // وظائف التسجيل
  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingTime(0);
    showNotification("info", "بدأ التسجيل... 🎥");
  }, [showNotification]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    const minutes = Math.floor(recordingTime / 60);
    const seconds = recordingTime % 60;
    const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    const insights = buildTakeInsights({
      durationSeconds: recordingTime,
      scriptText: scriptText || SAMPLE_SCRIPT,
      teleprompterUsed: false,
      hadRetake: recordings.length > 0,
    });
    const newRecording: Recording = {
      id: Date.now().toString(),
      title: `تسجيل جديد - ${new Date().toLocaleDateString("ar-EG")}`,
      duration,
      date: new Date().toISOString().split("T")[0] ?? new Date().toLocaleDateString(),
      score: insights.score,
    };
    setRecordings((prev) => [newRecording, ...prev]);
    addRecording(newRecording);
    showNotification("success", `تم حفظ التسجيل! النتيجة: ${newRecording.score}/100`);
  }, [addRecording, recordingTime, recordings.length, scriptText, showNotification]);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">🎬 التجربة التفاعلية</h2>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="analysis">📝 تحليل النص</TabsTrigger>
          <TabsTrigger value="partner">🎭 شريك المشهد</TabsTrigger>
          <TabsTrigger value="recording">🎥 التسجيل</TabsTrigger>
        </TabsList>

        {/* تاب تحليل النص */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تحليل النص</CardTitle>
              <CardDescription>
                ارفع نصاً للحصول على تحليل مدعوم بالذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>النص المسرحي/السينمائي</Label>
                  <Button variant="outline" size="sm" onClick={useSampleScript}>
                    📄 استخدم نص تجريبي
                  </Button>
                </div>
                <Textarea
                  placeholder="الصق نصك هنا أو استخدم النص التجريبي..."
                  className="min-h-[200px]"
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>منهجية التمثيل</Label>
                <Select value={selectedMethodology} onValueChange={setSelectedMethodology}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTING_METHODOLOGIES.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name} ({method.nameEn})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={analyzeScript}
                disabled={analyzing || !scriptText.trim()}
              >
                {analyzing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    جاري التحليل...
                  </>
                ) : (
                  "🔍 حلل النص"
                )}
              </Button>

              {analysisResult && (
                <Card className="bg-blue-50 mt-6">
                  <CardHeader>
                    <CardTitle className="text-blue-900">🎯 نتائج التحليل</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-lg">الأهداف:</h4>
                      <div className="space-y-2 bg-white p-4 rounded-lg">
                        <p><strong>الهدف الرئيسي:</strong> {analysisResult.objectives.main}</p>
                        <p><strong>هدف المشهد:</strong> {analysisResult.objectives.scene}</p>
                        <div>
                          <strong>النبضات:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {analysisResult.objectives.beats.map((beat, idx) => (
                              <li key={idx}>{beat}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-lg">العقبات:</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg">
                          <strong>داخلية:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {analysisResult.obstacles.internal.map((obs, idx) => (
                              <li key={idx}>{obs}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <strong>خارجية:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {analysisResult.obstacles.external.map((obs, idx) => (
                              <li key={idx}>{obs}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-lg">المسار العاطفي:</h4>
                      <div className="flex gap-4 flex-wrap">
                        {analysisResult.emotionalArc.map((arc, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg text-center">
                            <div className="text-2xl mb-2">
                              {arc.emotion === "شوق" ? "💭" : arc.emotion === "أمل" ? "✨" : "❤️"}
                            </div>
                            <Badge variant="outline">{arc.emotion}</Badge>
                            <Progress value={arc.intensity} className="mt-2 w-20" />
                            <span className="text-sm text-gray-600">{arc.intensity}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-lg">💡 نصائح التدريب:</h4>
                      <ul className="space-y-2">
                        {analysisResult.coachingTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-white p-3 rounded-lg">
                            <span className="text-green-500">✓</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تاب شريك المشهد */}
        <TabsContent value="partner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🎭 شريك المشهد الذكي</CardTitle>
              <CardDescription>تدرب على مشاهدك مع شريك ذكي يستجيب لأدائك</CardDescription>
            </CardHeader>
            <CardContent>
              {!rehearsing ? (
                <div className="text-center py-12">
                  <div className="text-8xl mb-6">🎭</div>
                  <h3 className="text-2xl font-semibold mb-4">مستعد للتدريب؟</h3>
                  <p className="text-gray-600 mb-6">
                    سيقوم الذكاء الاصطناعي بدور الشخصية الأخرى في المشهد
                  </p>
                  <Button size="lg" onClick={startRehearsal}>
                    🎬 ابدأ التدريب
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 h-[400px] overflow-y-auto bg-gray-50">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`mb-4 ${msg.role === "user" ? "text-left" : "text-right"}`}
                      >
                        <div
                          className={`inline-block p-4 rounded-lg max-w-[80%] ${msg.role === "user"
                            ? "bg-blue-100 text-blue-900"
                            : "bg-purple-100 text-purple-900"
                            }`}
                        >
                          <p className="font-medium mb-1">
                            {msg.role === "user" ? "أنت (أحمد):" : "ليلى (AI):"}
                          </p>
                          <p className={msg.typing ? "animate-pulse" : ""}>
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="اكتب سطرك هنا..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2">
                      <Button onClick={sendMessage} disabled={!userInput.trim()}>
                        📤 إرسال
                      </Button>
                      <Button variant="outline" onClick={endRehearsal}>
                        ⏹️ إنهاء
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تاب التسجيل */}
        <TabsContent value="recording" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🎥 تسجيل الأداء</CardTitle>
              <CardDescription>
                سجل أداءك واحصل على ملاحظات مدعومة بالذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                {!isRecording ? (
                  <>
                    <div className="text-8xl mb-6">🎥</div>
                    <h3 className="text-2xl font-semibold mb-4">مستعد لتسجيل أدائك؟</h3>
                    <Button size="lg" onClick={startRecording}>
                      ⏺️ ابدأ التسجيل
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-8xl mb-6 animate-pulse">🔴</div>
                    <h3 className="text-4xl font-mono font-bold text-red-600 mb-4">
                      {formatTime(recordingTime)}
                    </h3>
                    <p className="text-gray-600 mb-6">جاري التسجيل...</p>
                    <Button size="lg" variant="destructive" onClick={stopRecording}>
                      ⏹️ إيقاف التسجيل
                    </Button>
                  </>
                )}
              </div>

              {recordings.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-semibold mb-4">📚 تسجيلاتك السابقة:</h4>
                  <div className="space-y-3">
                    {recordings.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <h5 className="font-medium">{rec.title}</h5>
                          <p className="text-sm text-gray-600">
                            المدة: {rec.duration} • {rec.date}
                          </p>
                        </div>
                        <Badge
                          className={
                            rec.score >= 80
                              ? "bg-green-600"
                              : rec.score >= 70
                                ? "bg-yellow-600"
                                : "bg-red-600"
                          }
                        >
                          النتيجة: {rec.score}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
