"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, User } from "lucide-react";
import CharacterFormDialog from "@/app/(main)/directors-studio/components/CharacterFormDialog";
import { VirtualizedGrid } from "@/components/ui/virtualized-grid";
import type { Character } from "@/types/api";

export default function CharactersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const queryClient = useQueryClient();

  // Get current project ID from URL or state
  const [currentProjectId, setCurrentProjectId] = useState<string>("");

  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await fetch(`/api/projects/${currentProjectId}/characters`);
      const data = await res.json();
      return data.data as Character[];
    },
    enabled: !!currentProjectId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const res = await fetch(`/api/characters/${characterId}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });

  const handleEdit = (character: Character) => {
    setSelectedCharacter(character);
    setIsDialogOpen(true);
  };

  const handleDelete = async (characterId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الشخصية؟")) {
      await deleteMutation.mutateAsync(characterId);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedCharacter(null);
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
          <h1 className="text-4xl font-bold">الشخصيات</h1>
          <p className="text-muted-foreground mt-2">إدارة شخصيات المشروع</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          شخصية جديدة
        </Button>
      </div>

      {characters && characters.length > 10 ? (
        <VirtualizedGrid
          items={characters}
          renderItem={(character) => (
            <Card key={character.id} className="h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{character.name}</CardTitle>
                      <CardDescription>
                        {character.appearances} ظهور
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(character)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(character.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">حالة الاتساق:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        character.consistencyStatus === "good"
                          ? "bg-green-100 text-green-800"
                          : character.consistencyStatus === "warning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {character.consistencyStatus === "good"
                        ? "جيد"
                        : character.consistencyStatus === "warning"
                          ? "تحذير"
                          : "ضعيف"}
                    </span>
                  </div>
                  {character.lastSeen && (
                    <div>
                      <span className="font-semibold">آخر ظهور:</span>{" "}
                      {character.lastSeen}
                    </div>
                  )}
                  {character.notes && (
                    <div className="pt-2">
                      <span className="font-semibold">ملاحظات:</span>
                      <p className="text-muted-foreground mt-1">
                        {character.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          columnCount={3}
          itemHeight={280}
          itemWidth={350}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {characters?.map((character) => (
            <Card key={character.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{character.name}</CardTitle>
                      <CardDescription>
                        {character.appearances} ظهور
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(character)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(character.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">حالة الاتساق:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        character.consistencyStatus === "good"
                          ? "bg-green-100 text-green-800"
                          : character.consistencyStatus === "warning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {character.consistencyStatus === "good"
                        ? "جيد"
                        : character.consistencyStatus === "warning"
                          ? "تحذير"
                          : "ضعيف"}
                    </span>
                  </div>
                  {character.lastSeen && (
                    <div>
                      <span className="font-semibold">آخر ظهور:</span>{" "}
                      {character.lastSeen}
                    </div>
                  )}
                  {character.notes && (
                    <div className="pt-2">
                      <span className="font-semibold">ملاحظات:</span>
                      <p className="text-muted-foreground mt-1">
                        {character.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {characters?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد شخصيات حتى الآن</p>
          <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            إنشاء شخصية جديدة
          </Button>
        </div>
      )}

      <CharacterFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        {...(selectedCharacter && { character: selectedCharacter })}
        projectId={currentProjectId}
      />
    </div>
  );
}
