/**
 * @fileoverview مكوّن بطاقة المشهد
 *
 * السبب في وجود هذا المكوّن: عرض معلومات المشهد
 * بشكل منظم مع إمكانية التعديل والحذف.
 *
 * يدعم:
 * - عرض تفاصيل المشهد (العنوان، الموقع، الوقت، الشخصيات)
 * - تغيير الحالة (مخطط، قيد التنفيذ، مكتمل)
 * - حذف المشهد مع تأكيد
 * - التنقل لتخطيط اللقطات
 */
"use client";

import { useState, memo, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Users,
  MoreVertical,
  Camera,
  Trash2,
  Edit2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDeleteScene } from "@/hooks/useProject";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/**
 * أنواع حالات المشهد المدعومة
 */
type SceneStatus = "planned" | "in-progress" | "completed";

/**
 * واجهة خصائص مكوّن بطاقة المشهد
 */
interface SceneCardProps {
  /** معرف المشهد الفريد */
  id: string;
  /** رقم المشهد في السيناريو */
  sceneNumber: number;
  /** عنوان المشهد */
  title: string;
  /** موقع المشهد */
  location: string;
  /** وقت اليوم في المشهد */
  timeOfDay: string;
  /** قائمة أسماء الشخصيات في المشهد */
  characters: string[];
  /** عدد اللقطات المخططة (اختياري) */
  shotCount?: number;
  /** حالة المشهد الحالية */
  status?: SceneStatus;
  /** وصف المشهد (اختياري) */
  description?: string | null;
  /** دالة استدعاء للتعديل */
  onEdit?: () => void;
}

/**
 * خريطة ألوان حالات المشهد
 * السبب: توحيد الألوان وتسهيل الصيانة
 */
const STATUS_COLORS: Record<SceneStatus, string> = {
  planned: "bg-muted text-muted-foreground",
  "in-progress": "bg-primary/10 text-primary",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
} as const;

/**
 * خريطة تسميات حالات المشهد بالعربية
 */
const STATUS_LABELS: Record<SceneStatus, string> = {
  planned: "مخطط",
  "in-progress": "قيد التنفيذ",
  completed: "مكتمل",
} as const;

/**
 * مكوّن بطاقة المشهد
 *
 * السبب في استخدام memo: بطاقات المشاهد تُعرض في قائمة
 * ونريد تجنب إعادة عرض جميع البطاقات عند تغيير واحدة منها.
 *
 * @param props - خصائص المشهد
 * @returns بطاقة تعرض معلومات المشهد مع خيارات التحكم
 */
const SceneCard = memo(function SceneCard({
  id,
  sceneNumber,
  title,
  location,
  timeOfDay,
  characters,
  shotCount = 0,
  status = "planned",
  description,
  onEdit,
}: SceneCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteScene = useDeleteScene();
  const { toast } = useToast();

  /**
   * معالج حذف المشهد
   *
   * السبب في useCallback: تجنب إنشاء دالة جديدة في كل render
   * مما يحسن أداء المكونات الفرعية التي تستقبل هذه الدالة.
   */
  const handleDelete = useCallback(async () => {
    try {
      await deleteScene.mutateAsync(id);
      toast({
        title: "تم الحذف",
        description: "تم حذف المشهد بنجاح",
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      // عرض رسالة خطأ واضحة للمستخدم
      const errorMessage =
        error instanceof Error ? error.message : "فشل حذف المشهد";
      toast({
        title: "حدث خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [id, deleteScene, toast]);

  /**
   * معالج فتح نافذة تأكيد الحذف
   */
  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  /**
   * الحصول على لون وتسمية الحالة
   * السبب في useMemo: تجنب البحث في الكائنات في كل render
   */
  const statusColor = useMemo(() => STATUS_COLORS[status], [status]);
  const statusLabel = useMemo(() => STATUS_LABELS[status], [status]);

  return (
    <>
      <Card
        className="hover-elevate active-elevate-2"
        data-testid={`card-scene-${sceneNumber}`}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  data-testid="button-scene-menu"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/shots">تخطيط اللقطات</Link>
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem
                    onClick={onEdit}
                    data-testid="button-edit-scene"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    تعديل المشهد
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDeleteClick}
                  data-testid="button-delete-scene"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف المشهد
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge className={statusColor}>{statusLabel}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Badge variant="outline" className="text-base px-3">
              المشهد {sceneNumber}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-end gap-6 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <span>{location}</span>
              <MapPin className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2">
              <span>{timeOfDay}</span>
              <Clock className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2">
              <span>{characters.length} شخصيات</span>
              <Users className="w-4 h-4" />
            </div>

            {shotCount > 0 && (
              <div className="flex items-center gap-2">
                <span>{shotCount} لقطات</span>
                <Camera className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            {characters.map((character, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {character}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف "{title}"؟ سيتم حذف جميع اللقطات المرتبطة به.
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-scene"
            >
              حذف
            </AlertDialogAction>
            <AlertDialogCancel data-testid="button-cancel-delete-scene">
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

export default SceneCard;
