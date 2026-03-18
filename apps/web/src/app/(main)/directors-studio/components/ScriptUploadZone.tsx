/**
 * @fileoverview مكوّن منطقة رفع السيناريو
 *
 * السبب في وجود هذا المكوّن: توفير واجهة سهلة الاستخدام
 * لرفع ملفات السيناريو وبدء عملية التحليل الآلي.
 *
 * يدعم:
 * - السحب والإفلات للملفات
 * - اختيار الملفات يدوياً
 * - أنواع الملفات: PDF, DOC, DOCX, TXT
 */
"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateProject, useAnalyzeScript } from "@/hooks/useProject";
import { setCurrentProject } from "@/lib/projectStore";
import { useToast } from "@/hooks/use-toast";

/**
 * معرف عنصر الإدخال للملفات
 */
const FILE_INPUT_ID = "script-upload";

/**
 * أنواع الملفات المدعومة
 */
const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.txt";

/**
 * رسائل الخطأ والنجاح
 * السبب: توحيد الرسائل وتسهيل الترجمة المستقبلية
 */
const MESSAGES = {
  success: {
    title: "تم التحليل بنجاح!",
    description: "تم تحليل السيناريو واستخراج المشاهد والشخصيات",
  },
  error: {
    title: "حدث خطأ",
    description: "فشل تحليل السيناريو. الرجاء المحاولة مرة أخرى.",
  },
} as const;

/**
 * مكوّن منطقة رفع السيناريو
 *
 * السبب في التصميم: توفير تجربة رفع ملفات سلسة
 * مع دعم السحب والإفلات والحالة البصرية للتحميل.
 *
 * تدفق العملية:
 * 1. اختيار أو سحب ملف السيناريو
 * 2. إنشاء مشروع جديد تلقائياً
 * 3. رفع وتحليل السيناريو بالذكاء الاصطناعي
 * 4. تحديث الصفحة لعرض النتائج
 *
 * @returns عنصر React يعرض منطقة رفع الملفات
 */
export default function ScriptUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const createProject = useCreateProject();
  const analyzeScript = useAnalyzeScript();

  /**
   * حالة التحميل الموحدة
   */
  const isUploading = createProject.isPending || analyzeScript.isPending;

  /**
   * معالجة الملف المرفوع
   *
   * السبب في useCallback: تجنب إنشاء دالة جديدة في كل render
   * والتي ستؤثر على أداء عناصر السحب والإفلات.
   *
   * @param file - ملف السيناريو المراد رفعه
   */
  const handleFile = useCallback(
    async (file: File) => {
      try {
        // إنشاء مشروع جديد
        const project = await createProject.mutateAsync({ title: "مشروع جديد" });

        if ("data" in project && project.data) {
          // حفظ المشروع الحالي
          setCurrentProject(project.data);

          // قراءة محتوى الملف وتحليله
          const scriptText = await file.text();
          await analyzeScript.mutateAsync({
            projectId: project.data.id,
            script: scriptText,
          });
        }

        toast(MESSAGES.success);
        window.location.reload();
      } catch (error) {
        // عرض رسالة خطأ تفصيلية للمستخدم
        const errorMessage =
          error instanceof Error ? error.message : MESSAGES.error.description;
        toast({
          ...MESSAGES.error,
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [createProject, analyzeScript, toast]
  );

  /**
   * معالج حدث السحب فوق المنطقة
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * معالج حدث مغادرة السحب للمنطقة
   */
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * معالج حدث إفلات الملف
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  /**
   * معالج اختيار الملف يدوياً
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  /**
   * فتح نافذة اختيار الملف
   */
  const openFileSelector = useCallback(() => {
    document.getElementById(FILE_INPUT_ID)?.click();
  }, []);

  return (
    <Card
      className={`p-12 border-2 border-dashed transition-all ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="card-script-upload"
    >
      <div className="flex flex-col items-center justify-center gap-6 min-h-[300px]">
        {isUploading ? (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <p className="text-xl text-muted-foreground">
              جاري تحميل السيناريو...
            </p>
          </>
        ) : (
          <>
            <div className="p-6 rounded-full bg-primary/10">
              <Upload className="w-12 h-12 text-primary" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">
                قم بتحميل السيناريو الخاص بك
              </h3>
              <p className="text-muted-foreground">
                اسحب وأفلت ملف PDF أو Word هنا، أو انقر للاختيار
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>الصيغ المدعومة: PDF, DOC, DOCX, TXT</span>
            </div>

            <input
              type="file"
              id={FILE_INPUT_ID}
              className="hidden"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileSelect}
            />
            <Button
              size="lg"
              onClick={openFileSelector}
              data-testid="button-choose-file"
            >
              اختيار ملف
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
