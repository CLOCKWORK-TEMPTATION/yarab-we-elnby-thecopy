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
import { Plus, Edit, Trash2, Camera, Lightbulb } from "lucide-react";
import ShotPlanningCard from "@/app/(main)/directors-studio/components/ShotPlanningCard";
import { VirtualizedGrid } from "@/components/ui/virtualized-grid";
import type { Shot, Scene } from "@shared/schema";

export default function ShotsPage() {
  const [selectedSceneId, setSelectedSceneId] = useState<string>("");
  const queryClient = useQueryClient();

  // Get current project ID from URL or state
  const [currentProjectId, setCurrentProjectId] = useState<string>("");

  const { data: scenes } = useQuery({
    queryKey: ["scenes", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await fetch(`/api/projects/${currentProjectId}/scenes`);
      const data = await res.json();
      return data.data as Scene[];
    },
    enabled: !!currentProjectId,
  });

  const { data: shots, isLoading } = useQuery({
    queryKey: ["shots", selectedSceneId],
    queryFn: async () => {
      if (!selectedSceneId) return [];
      const res = await fetch(`/api/scenes/${selectedSceneId}/shots`);
      const data = await res.json();
      return data.data as Shot[];
    },
    enabled: !!selectedSceneId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (shotId: string) => {
      const res = await fetch(`/api/shots/${shotId}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shots"] });
      queryClient.invalidateQueries({ queryKey: ["scenes"] });
    },
  });

  const handleDelete = async (shotId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه اللقطة؟")) {
      await deleteMutation.mutateAsync(shotId);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">اللقطات</h1>
        <p className="text-muted-foreground mt-2">تخطيط اللقطات للمشاهد</p>
      </div>

      {/* Scene Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">اختر المشهد</label>
        <select
          value={selectedSceneId}
          onChange={(e) => setSelectedSceneId(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-md bg-background"
        >
          <option value="">-- اختر مشهد --</option>
          {scenes?.map((scene) => (
            <option key={scene.id} value={scene.id}>
              المشهد {scene.sceneNumber}: {scene.title}
            </option>
          ))}
        </select>
      </div>

      {selectedSceneId ? (
        <>
          {shots && shots.length > 10 ? (
            <VirtualizedGrid
              items={shots}
              renderItem={(shot) => (
                <Card key={shot.id} className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Camera className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>لقطة #{shot.shotNumber}</CardTitle>
                          <CardDescription>{shot.shotType}</CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(shot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-24">
                          زاوية الكاميرا:
                        </span>
                        <span className="text-muted-foreground">
                          {shot.cameraAngle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-24">الحركة:</span>
                        <span className="text-muted-foreground">
                          {shot.cameraMovement}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-24">الإضاءة:</span>
                        <span className="text-muted-foreground">
                          {shot.lighting}
                        </span>
                      </div>
                      {shot.aiSuggestion && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                              <p className="font-semibold text-xs text-blue-600 dark:text-blue-400 mb-1">
                                اقتراح AI
                              </p>
                              <p className="text-xs text-blue-800 dark:text-blue-200">
                                {shot.aiSuggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              columnCount={3}
              itemHeight={320}
              itemWidth={350}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shots?.map((shot) => (
                <Card key={shot.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Camera className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>لقطة #{shot.shotNumber}</CardTitle>
                          <CardDescription>{shot.shotType}</CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(shot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-24">
                          زاوية الكاميرا:
                        </span>
                        <span className="text-muted-foreground">
                          {shot.cameraAngle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-24">الحركة:</span>
                        <span className="text-muted-foreground">
                          {shot.cameraMovement}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold w-24">الإضاءة:</span>
                        <span className="text-muted-foreground">
                          {shot.lighting}
                        </span>
                      </div>
                      {shot.aiSuggestion && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                              <p className="font-semibold text-xs text-blue-600 dark:text-blue-400 mb-1">
                                اقتراح AI
                              </p>
                              <p className="text-xs text-blue-800 dark:text-blue-200">
                                {shot.aiSuggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {shots?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                لا توجد لقطات لهذا المشهد حتى الآن
              </p>
            </div>
          )}

          {/* Shot Planning Component */}
          {/* Temporarily disabled - needs proper props
          <div className="mt-8">
            <ShotPlanningCard shotNumber={1} sceneNumber={1} />
          </div>
          */}
        </>
      ) : (
        <div className="text-center py-12">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">اختر مشهد لعرض اللقطات</p>
        </div>
      )}
    </div>
  );
}
