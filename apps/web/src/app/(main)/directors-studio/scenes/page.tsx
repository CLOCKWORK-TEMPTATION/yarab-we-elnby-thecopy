"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import SceneFormDialog from "@/app/(main)/directors-studio/components/SceneFormDialog";
import { VirtualizedGrid } from "@/components/ui/virtualized-grid";
import type { Scene } from "@shared/schema";

export default function ScenesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const queryClient = useQueryClient();

  // Get current project ID from URL or state
  const [currentProjectId, setCurrentProjectId] = useState<string>("");

  const { data: scenes, isLoading } = useQuery({
    queryKey: ["scenes", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await fetch(`/api/projects/${currentProjectId}/scenes`);
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
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenes"] });
    },
  });

  const handleEdit = (scene: Scene) => {
    setSelectedScene(scene);
    setIsDialogOpen(true);
  };

  const handleDelete = async (sceneId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المشهد؟")) {
      await deleteMutation.mutateAsync(sceneId);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedScene(null);
  };

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
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          مشهد جديد
        </Button>
      </div>

      {scenes && scenes.length > 10 ? (
        <VirtualizedGrid
          items={scenes}
          renderItem={(scene) => (
            <Card key={scene.id} className="h-full">
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
                      onClick={() => handleEdit(scene)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(scene.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">الموقع:</span>{" "}
                    {scene.location}
                  </div>
                  <div>
                    <span className="font-semibold">الوقت:</span>{" "}
                    {scene.timeOfDay}
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
                      <p className="text-muted-foreground">
                        {scene.description}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          columnCount={3}
          itemHeight={350}
          itemWidth={350}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenes?.map((scene) => (
            <Card key={scene.id}>
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
                      onClick={() => handleEdit(scene)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(scene.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">الموقع:</span>{" "}
                    {scene.location}
                  </div>
                  <div>
                    <span className="font-semibold">الوقت:</span>{" "}
                    {scene.timeOfDay}
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
                      <p className="text-muted-foreground">
                        {scene.description}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
