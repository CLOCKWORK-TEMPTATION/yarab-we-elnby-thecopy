/**
 * @fileoverview مكوّن متتبع الشخصيات
 *
 * السبب في وجود هذا المكوّن: مساعدة المخرج في تتبع
 * ظهور الشخصيات والتأكد من اتساقها عبر المشاهد.
 *
 * يعرض لكل شخصية:
 * - الاسم والصورة الرمزية
 * - عدد مرات الظهور
 * - حالة الاتساق (جيد، تحذير، مشكلة)
 * - آخر ظهور في المشاهد
 */
"use client";

import { memo, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Eye } from "lucide-react";

/**
 * أنواع حالات اتساق الشخصية
 */
type ConsistencyStatus = "good" | "warning" | "issue";

/**
 * واجهة بيانات الشخصية
 */
interface Character {
  /** معرف الشخصية الفريد */
  id: string;
  /** اسم الشخصية */
  name: string;
  /** عدد مرات الظهور في المشاهد */
  appearances: number;
  /** حالة الاتساق الحالية */
  consistencyStatus: ConsistencyStatus;
  /** آخر مشهد ظهرت فيه الشخصية */
  lastSeen: string;
}

/**
 * واجهة خصائص مكوّن متتبع الشخصيات
 */
interface CharacterTrackerProps {
  /** قائمة الشخصيات المراد عرضها */
  characters: Character[];
}

/**
 * خريطة أيقونات حالات الاتساق
 * السبب: توحيد المظهر البصري لكل حالة
 */
const STATUS_ICONS: Record<ConsistencyStatus, JSX.Element> = {
  good: <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />,
  warning: (
    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
  ),
  issue: <AlertCircle className="w-4 h-4 text-destructive" />,
};

/**
 * خريطة تسميات حالات الاتساق بالعربية
 */
const STATUS_LABELS: Record<ConsistencyStatus, string> = {
  good: "متسق",
  warning: "تحذير",
  issue: "مشكلة",
};

/**
 * مكوّن عنصر شخصية فردية
 *
 * السبب في فصله: تحسين قابلية القراءة وإمكانية
 * إعادة الاستخدام والتذكير (memoization).
 */
const CharacterItem = memo(function CharacterItem({
  character,
}: {
  character: Character;
}) {
  const statusIcon = useMemo(
    () => STATUS_ICONS[character.consistencyStatus],
    [character.consistencyStatus]
  );

  const statusLabel = useMemo(
    () => STATUS_LABELS[character.consistencyStatus],
    [character.consistencyStatus]
  );

  /**
   * الحرف الأول من اسم الشخصية للصورة الرمزية
   */
  const avatarInitial = useMemo(
    () => character.name.charAt(0),
    [character.name]
  );

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-md border hover-elevate active-elevate-2"
      data-testid={`character-${character.id}`}
    >
      <Button
        size="icon"
        variant="ghost"
        data-testid={`button-view-${character.id}`}
      >
        <Eye className="w-4 h-4" />
      </Button>

      <div className="flex-1 text-right space-y-2">
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            {statusIcon}
            <Badge variant="secondary" className="text-xs">
              {statusLabel}
            </Badge>
          </div>
          <h4 className="font-semibold">{character.name}</h4>
        </div>

        <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
          <span>{character.lastSeen}</span>
          <span>•</span>
          <span>{character.appearances} ظهور</span>
        </div>
      </div>

      <Avatar className="w-12 h-12">
        <AvatarFallback className="text-lg font-semibold">
          {avatarInitial}
        </AvatarFallback>
      </Avatar>
    </div>
  );
});

/**
 * مكوّن متتبع الشخصيات
 *
 * السبب في وجوده: توفير رؤية شاملة لجميع شخصيات المشروع
 * مع إمكانية تتبع حالة كل منها.
 *
 * السبب في استخدام memo: قائمة الشخصيات قد تكون طويلة
 * ونريد تجنب إعادة العرض غير الضرورية.
 *
 * @param props - خصائص المكوّن
 * @returns بطاقة تحتوي على قائمة الشخصيات
 */
function CharacterTracker({ characters }: CharacterTrackerProps) {
  return (
    <Card data-testid="card-character-tracker">
      <CardHeader>
        <CardTitle className="text-right">متابعة الشخصيات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {characters.map((character) => (
            <CharacterItem key={character.id} character={character} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(CharacterTracker);
