"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import SceneFormDialog from "@/app/(main)/directors-studio/components/SceneFormDialog";
import { VirtualizedGrid } from "@/components/ui/virtualized-grid";
import { getCurrentProject } from "@/lib/projectStore";
import type { Scene } from "@shared/schema";

/**
 * مكوّن بطاقة المشهد — مُعاد استخدامه في العرض العادي والافتراضي
 */
const SceneCard = memo(function SceneCard({
  scene,
  onEdit,
  onDelete,
  deleteConfirmId,
  onCancelDelete,
}: {
  scene: Scene;
  onEdit: (scene: Scene) => void;
  onDelete: (sceneId: string) => void;
  deleteConfirmId: string | null;
  onCancelDelete: () => void;
}) {
  const isConfirming = deleteConfirmId === scene.id;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>المشهد {scene.sceneNumber}</CardTitle>
            <CardDescription>{scene.title}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(scene)}
              aria-label={`تعديل المشهد ${scene.sceneNumber}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {isConfirming ? (
              <div className="flex gap-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(scene.id)}
                  aria-label="تأكيد الحذف"
                >
                  تأكيد
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancelDelete}
                  aria-label="إلغاء الحذف"
                >
                  إلغاء
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(scene.id)}
                aria-label={`حذف المشهد ${scene.sceneNumber}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">الموقع:</span> {scene.location}
          </div>
          <div>
            <span className="font-semibold">الوقت:</span> {scene.timeOfDay}
          </div>
          <div>
            <span className="font-semibold">الشخصيات:</span>{" "}
            {scene.characters.join(", ")}
          </div>
          <div>
            <span className="font-semibold">عدد اللقطات:</span>{" "}
            {scene.shotCount}
          </div>
          <div>
            <span className="font-semibold">الحالة:</span>{" "}
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                scene.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : scene.status === "in-progress"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {scene.status === "planned"
                ? "مخطط"
                : scene.status === "in-progress"
                  ? "قيد التنفيذ"
                  : "مكتمل"}
            </span>
          </div>
          {scene.description && (
            <div className="pt-2">
              <p className="text-muted-foreground">{scene.description}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default function ScenesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  /**
   * ربط معرّف المشروع الحالي من projectStore
   * السبب: الإصدار السابق كان يُنشئ useState فارغ بدون آلية ملء
   */
  const [currentProjectId, setCurrentProjectId] = useState<string>("");

  useEffect(() => {
    const project = getCurrentProject();
    if (project?.id) {
      setCurrentProjectId(String(project.id));
    }
  }, []);

  const { data: scenes, isLoading } = useQuery({
    queryKey: ["scenes", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await fetch(`/api/projects/${currentProjectId}/scenes`);
      if (!res.ok) {
        throw new Error(`فشل تحميل المشاهد: ${res.status}`);
      }
      const data = await res.json();
      return data.data as Scene[];
    },
    enabled: !!currentProjectId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (sceneId: string) => {
      const res = await fetch(`/api/scenes/${sceneId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`فشل حذف المشهد: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenes"] });
      setDeleteConfirmId(null);
    },
  });

  const handleEdit = useCallback((scene: Scene) => {
    setSelectedScene(scene);
    setIsDialogOpen(true);
  }, []);

  /**
   * نظام حذف بخطوتين — الضغطة الأولى تعرض التأكيد، الثانية تحذف فعلاً
   */
  const handleDelete = useCallback(
    async (sceneId: string) => {
      if (deleteConfirmId === sceneId) {
        await deleteMutation.mutateAsync(sceneId);
      } else {
        setDeleteConfirmId(sceneId);
      }
    },
    [deleteConfirmId, deleteMutation]
  );

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedScene(null);
  }, []);

  if (!currentProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">
          لا يوجد مشروع محدد. يرجى اختيار مشروع أولاً.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">المشاهد</h1>
          <p className="text-muted-foreground mt-2">إدارة مشاهد المشروع</p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          aria-label="إنشاء مشهد جديد"
        >
          <Plus className="mr-2 h-4 w-4" />
          مشهد جديد
        </Button>
      </div>

      {scenes && scenes.length > 10 ? (
        <VirtualizedGrid
          items={scenes}
          renderItem={(scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deleteConfirmId={deleteConfirmId}
              onCancelDelete={handleCancelDelete}
            />
          )}
          columnCount={3}
          itemHeight={350}
          itemWidth={350}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenes?.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deleteConfirmId={deleteConfirmId}
              onCancelDelete={handleCancelDelete}
            />
          ))}
        </div>
      )}

      {scenes?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد مشاهد حتى الآن</p>
          <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            إنشاء مشهد جديد
          </Button>
        </div>
      )}

      <SceneFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        {...(selectedScene && { scene: selectedScene })}
        projectId={currentProjectId}
      />
    </div>
  );
}