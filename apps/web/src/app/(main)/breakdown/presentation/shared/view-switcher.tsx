'use client';

/**
 * مكون التبديل بين العروض — ViewSwitcher
 *
 * @description
 * يتيح للمستخدم التبديل بين عرض مساحة التفكيك وعرض التقرير
 * مع مؤشر بصري واضح للعرض النشط
 */

import { Clapperboard, FileText } from 'lucide-react';

export type BreakdownView = 'workspace' | 'report';

export const VIEW_CONFIG: Array<{
  id: BreakdownView;
  label: string;
  description: string;
  icon: typeof Clapperboard;
}> = [
  {
    id: 'workspace',
    label: 'مساحة التفكيك',
    description: 'واجهة تفكيك السيناريو الكاملة متعددة الوكلاء داخل المنصة.',
    icon: Clapperboard,
  },
  {
    id: 'report',
    label: 'التقرير',
    description: 'عرض تقرير التحليل النهائي من نفس مسار المنصة.',
    icon: FileText,
  },
];

interface ViewSwitcherProps {
  activeView: BreakdownView;
  onSelect: (view: BreakdownView) => void;
}

export function ViewSwitcher({ activeView, onSelect }: ViewSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {VIEW_CONFIG.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onSelect(view.id)}
            aria-pressed={isActive}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{view.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
