"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Download, Sparkles } from "lucide-react";
import ScriptUploadZone from "@/app/(main)/directors-studio/components/ScriptUploadZone";
import type { Project } from "@shared/schema";

export default function ScriptPage() {
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [scriptContent, setScriptContent] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return null;
      const res = await fetch(`/api/projects/${currentProjectId}`);
      const data = await res.json();
      return data.data as Project;
    },
    enabled: !!currentProjectId,
  });

  const updateScriptMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/projects/${currentProjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptContent: content }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project", currentProjectId],
      });
    },
  });

  const analyzeScriptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${currentProjectId}/analyze`, {
        method: "POST",
      });
      return res.json();
    },
  });

  const handleSave = async () => {
    if (scriptContent) {
      await updateScriptMutation.mutateAsync(scriptContent);
    }
  };

  const handleAnalyze = async () => {
    await analyzeScriptMutation.mutateAsync();
  };

  const handleDownload = () => {
    if (!project?.scriptContent) return;

    const blob = new Blob([project.scriptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "script"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Initialize script content when project loads
  useState(() => {
    if (project?.scriptContent) {
      setScriptContent(project.scriptContent);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <FileText className="h-10 w-10 text-primary" />
          السيناريو
        </h1>
        <p className="text-muted-foreground mt-2">
          قم برفع أو كتابة السيناريو الخاص بمشروعك
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>محرر السيناريو</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!project?.scriptContent}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تحميل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={!scriptContent}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    تحليل بـ AI
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateScriptMutation.isPending}
                  >
                    حفظ
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="ابدأ بكتابة السيناريو هنا..."
                className="min-h-[600px] font-mono text-sm"
              />

              {updateScriptMutation.isSuccess && (
                <p className="text-sm text-green-600 mt-2">تم الحفظ بنجاح!</p>
              )}

              {analyzeScriptMutation.isSuccess && (
                <p className="text-sm text-blue-600 mt-2">
                  تم بدء التحليل! سيتم إشعارك عند الانتهاء.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">رفع ملف</CardTitle>
            </CardHeader>
            <CardContent>
              <ScriptUploadZone />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">عدد الأحرف:</span>
                <span className="font-semibold">
                  {scriptContent.length.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">عدد الكلمات:</span>
                <span className="font-semibold">
                  {scriptContent
                    .split(/\s+/)
                    .filter(Boolean)
                    .length.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">عدد الأسطر:</span>
                <span className="font-semibold">
                  {scriptContent.split("\n").length.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                نصائح
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>• استخدم تنسيق السيناريو القياسي</p>
              <p>• حدد المشاهد بوضوح</p>
              <p>• اذكر أسماء الشخصيات قبل الحوار</p>
              <p>• استخدم تحليل AI لاستخراج المشاهد تلقائياً</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
