/**
 * @fileoverview مكوّن تبويبات المشروع
 *
 * السبب في فصل هذا المكوّن: توفير واجهة تنقل سهلة
 * بين المشاهد والشخصيات مع الحفاظ على حالة التبويب النشط.
 */
"use client";

import { memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CharacterTracker from "@/app/(main)/directors-studio/components/CharacterTracker";
import SceneCard from "@/app/(main)/directors-studio/components/SceneCard";
import type {
  CharacterTrackerProps,
  SceneCardProps,
} from "@/app/(main)/directors-studio/helpers/projectSummary";

/**
 * واجهة خصائص مكوّن التبويبات
 */
interface ProjectTabsProps {
  /** قائمة مشاهد المشروع */
  scenes: SceneCardProps[];
  /** قائمة شخصيات المشروع */
  characters: CharacterTrackerProps["characters"];
}

/**
 * مكوّن التبويبات الرئيسي للتنقل بين المشاهد والشخصيات
 *
 * السبب في استخدام Tabs من Radix: توفير تجربة تنقل سلسة
 * مع دعم لوحة المفاتيح وإمكانية الوصول.
 *
 * @param props - خصائص المكوّن
 * @returns تبويبات للتنقل بين المشاهد والشخصيات
 */
export function ProjectTabs({ scenes, characters }: ProjectTabsProps) {
  return (
    <Tabs defaultValue="scenes" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 mr-auto">
        <TabsTrigger value="scenes" data-testid="tab-scenes">
          المشاهد
        </TabsTrigger>
        <TabsTrigger value="characters" data-testid="tab-characters">
          الشخصيات
        </TabsTrigger>
      </TabsList>

      <TabsContent value="scenes" className="space-y-4 mt-6">
        <ScenesTabContent scenes={scenes} />
      </TabsContent>

      <TabsContent value="characters" className="mt-6">
        <CharactersTabContent characters={characters} />
      </TabsContent>
    </Tabs>
  );
}

/**
 * واجهة خصائص محتوى تبويب المشاهد
 */
interface ScenesTabContentProps {
  /** قائمة المشاهد المراد عرضها */
  scenes: SceneCardProps[];
}

/**
 * محتوى تبويب المشاهد
 *
 * السبب في فصله كمكوّن فرعي: تحسين قابلية القراءة
 * وتمكين التحميل الشرطي للمحتوى.
 *
 * السبب في استخدام memo: تجنب إعادة العرض غير الضرورية
 * عند تغيير التبويب النشط دون تغيير البيانات.
 */
const ScenesTabContent = memo(function ScenesTabContent({
  scenes,
}: ScenesTabContentProps) {
  if (!scenes.length) {
    return (
      <p className="text-center text-muted-foreground py-12">
        لا توجد مشاهد بعد. قم بتحميل سيناريو للبدء.
      </p>
    );
  }

  return (
    <>
      {scenes.map((scene) => {
        const { status, ...sceneProps } = scene;
        return (
          <SceneCard
            key={scene.id}
            {...sceneProps}
            status={status ?? "planned"}
          />
        );
      })}
    </>
  );
});

/**
 * واجهة خصائص محتوى تبويب الشخصيات
 */
interface CharactersTabContentProps {
  /** قائمة الشخصيات المراد عرضها */
  characters: CharacterTrackerProps["characters"];
}

/**
 * محتوى تبويب الشخصيات
 *
 * السبب في فصله: توفير معالجة منفصلة للحالة الفارغة
 * وتحسين تجربة المستخدم عند عدم وجود شخصيات.
 */
const CharactersTabContent = memo(function CharactersTabContent({
  characters,
}: CharactersTabContentProps) {
  if (!characters.length) {
    return (
      <p className="text-center text-muted-foreground py-12">
        لا توجد شخصيات بعد.
      </p>
    );
  }

  return <CharacterTracker characters={characters} />;
});

export default ProjectTabs;
