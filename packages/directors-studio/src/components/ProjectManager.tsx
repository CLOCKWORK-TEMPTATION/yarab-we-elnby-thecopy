/**
 * @fileoverview مكوّن إدارة المشاريع
 *
 * السبب في وجود هذا المكوّن: توفير واجهة لإدارة المشاريع
 * المتاحة بما في ذلك التحديد والتعديل والحذف.
 *
 * يدعم:
 * - عرض قائمة المشاريع المتاحة
 * - اختيار المشروع النشط
 * - تعديل عنوان المشروع
 * - حذف المشروع مع تأكيد
 */
"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useProjects,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProject";
import {
  getCurrentProject,
  setCurrentProject,
  clearCurrentProject,
} from "@/lib/projectStore";
import { FolderOpen, Trash2, Edit2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@/types/api";

/**
 * رسائل الإشعارات
 * السبب: توحيد الرسائل وتسهيل الصيانة
 */
const MESSAGES = {
  updateSuccess: {
    title: "تم التحديث",
    description: "تم تحديث عنوان المشروع بنجاح",
  },
  updateError: {
    title: "حدث خطأ",
    defaultDescription: "فشل تحديث المشروع",
  },
  deleteSuccess: {
    title: "تم الحذف",
    description: "تم حذف المشروع بنجاح",
  },
  deleteError: {
    title: "حدث خطأ",
    defaultDescription: "فشل حذف المشروع",
  },
} as const;

/**
 * واجهة خصائص بطاقة المشروع
 */
interface ProjectCardProps {
  project: Project;
  isCurrentProject: boolean;
  isEditing: boolean;
  editTitle: string;
  isPending: boolean;
  onEditStart: (id: string, title: string) => void;
  onEditSave: (id: string) => void;
  onEditTitleChange: (value: string) => void;
  onDeleteClick: (id: string) => void;
  onSelect: (project: Project) => void;
}

/**
 * مكوّن بطاقة المشروع الفردية
 */
const ProjectCard = memo(function ProjectCard({
  project,
  isCurrentProject,
  isEditing,
  editTitle,
  isPending,
  onEditStart,
  onEditSave,
  onEditTitleChange,
  onDeleteClick,
  onSelect,
}: ProjectCardProps) {
  /**
   * تنسيق تاريخ الإنشاء بالعربية
   */
  const formattedDate = useMemo(
    () => new Date(project.createdAt).toLocaleDateString("ar-SA"),
    [project.createdAt]
  );

  return (
    <Card
      className={isCurrentProject ? "border-primary" : ""}
      data-testid={`card-project-${project.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              className="flex-1"
              dir="rtl"
              data-testid="input-edit-project-title"
            />
          ) : (
            <div className="flex-1 text-right">
              <h3 className="font-semibold">{project.title}</h3>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
          )}

          <div className="flex gap-2">
            {isEditing ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEditSave(project.id)}
                disabled={isPending}
                data-testid="button-save-edit"
              >
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEditStart(project.id, project.title)}
                  data-testid={`button-edit-${project.id}`}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDeleteClick(project.id)}
                  data-testid={`button-delete-${project.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
                {!isCurrentProject && (
                  <Button
                    variant="outline"
                    onClick={() => onSelect(project)}
                    data-testid={`button-select-${project.id}`}
                  >
                    اختيار
                  </Button>
                )}
                {isCurrentProject && (
                  <Button
                    variant="default"
                    disabled
                    data-testid="button-current-project"
                  >
                    المشروع الحالي
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * مكوّن إدارة المشاريع
 *
 * السبب في التصميم: توفير واجهة مركزية لإدارة المشاريع
 * مع دعم العمليات الأساسية (اختيار، تعديل، حذف).
 *
 * @returns عنصر React يعرض زر وحوار إدارة المشاريع
 */
export default function ProjectManager() {
  const { data: projects, isLoading } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();
  const currentProject = getCurrentProject();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  /**
   * معالج اختيار المشروع
   */
  const handleSelectProject = useCallback((project: Project) => {
    setCurrentProject(project);
    window.location.reload();
  }, []);

  /**
   * معالج بدء التعديل
   */
  const handleStartEdit = useCallback((id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  }, []);

  /**
   * معالج تغيير عنوان التعديل
   */
  const handleEditTitleChange = useCallback((value: string) => {
    setEditTitle(value);
  }, []);

  /**
   * معالج حفظ التعديل
   *
   * السبب في try/catch: التعامل مع أخطاء الشبكة
   * وعرض رسائل واضحة للمستخدم.
   */
  const handleSaveEdit = useCallback(
    async (id: string) => {
      try {
        await updateProject.mutateAsync({ id, data: { title: editTitle } });
        setEditingId(null);
        toast(MESSAGES.updateSuccess);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : MESSAGES.updateError.defaultDescription;
        toast({
          title: MESSAGES.updateError.title,
          description: message,
          variant: "destructive",
        });
      }
    },
    [editTitle, updateProject, toast]
  );

  /**
   * معالج النقر على زر الحذف
   */
  const handleDeleteClick = useCallback((id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  /**
   * معالج تأكيد الحذف
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject.mutateAsync(projectToDelete);

      // مسح المشروع الحالي إذا تم حذفه
      if (currentProject && currentProject.id === projectToDelete) {
        clearCurrentProject();
        window.location.reload();
      }

      toast(MESSAGES.deleteSuccess);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : MESSAGES.deleteError.defaultDescription;
      toast({
        title: MESSAGES.deleteError.title,
        description: message,
        variant: "destructive",
      });
    }
  }, [projectToDelete, deleteProject, currentProject, toast]);

  // حالة التحميل
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  // تحويل البيانات لمصفوفة آمنة
  const projectsList = Array.isArray(projects) ? projects : [];

  // لا تعرض شيئاً إذا لم تكن هناك مشاريع
  if (!projectsList || projectsList.length === 0) {
    return null;
  }

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" data-testid="button-manage-projects">
            <FolderOpen className="w-4 h-4 ml-2" />
            إدارة المشاريع ({projectsList.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">المشاريع المتاحة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {projectsList.map((project: Project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isCurrentProject={
                  currentProject !== null && currentProject.id === project.id
                }
                isEditing={editingId === project.id}
                editTitle={editTitle}
                isPending={updateProject.isPending}
                onEditStart={handleStartEdit}
                onEditSave={handleSaveEdit}
                onEditTitleChange={handleEditTitleChange}
                onDeleteClick={handleDeleteClick}
                onSelect={handleSelectProject}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف هذا المشروع؟ سيتم حذف جميع المشاهد والشخصيات
              واللقطات المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              حذف
            </AlertDialogAction>
            <AlertDialogCancel data-testid="button-cancel-delete">
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
