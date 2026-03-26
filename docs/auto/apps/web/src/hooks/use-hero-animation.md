# توثيق: `apps\web\src\hooks\use-hero-animation.ts`

> مُولَّد تلقائياً — لا تعدّله يدوياً.  
> آخر تحديث: `٢٦‏/٣‏/٢٠٢٦، ٦:٥٧:١٢ ص`

---

<!-- فشل توليد التوثيق: fetch failed -->

---

إليك التوثيق التقني الشامل للوحدة البرمجية `useHeroAnimation`:

# توثيق `useHeroAnimation`

## الوصف
خطاف مخصص (Custom Hook) في React مسؤول عن إدارة وتشغيل سلسلة حركات (Animations) معقدة ومتعددة المراحل للقسم الرئيسي (Hero Section) بالاعتماد على تمرير الصفحة (Scroll). يستخدم مكتبة GSAP إضافة إلى إضافة `ScrollTrigger` للتحكم في الحركات (تكبير الفيديو، ظهور النصوص، دخول وترتيب البطاقات بشكل متجاوب، وتلاشي النصوص). 
كما يتعامل الخطاف مع التحديثات المتجاوبة (Responsive) عند تغيير حجم الشاشة، ويقوم بتنظيف الذاكرة (Cleanup) بشكل آمن لمنع تسرب الذاكرة.

---

## المعاملات (Parameters)

| اسم المعامل | النوع | الغرض |
| :--- | :--- | :--- |
| `containerRef` | `RefObject<HTMLDivElement \| null>` | مرجع (Ref) للحاوية الرئيسية للمكون. يُستخدم لتحديد نطاق (Scope) محرك GSAP بحيث يقتصر البحث عن العناصر (مثل `.phase-3-img`) داخل هذه الحاوية فقط. |
| `triggerRef` | `RefObject<HTMLDivElement \| null>` | مرجع للعنصر الذي سيبدأ حركة التمرير. يُستخدم لتثبيت الشاشة (Pinning) عبر `ScrollTrigger` وربط تقدم الخط الزمني (Timeline) بمدى تمرير المستخدم للصفحة. |

---

## القيمة المُعادة (Return Value)

| القيمة | النوع | الوصف |
| :--- | :--- | :--- |
| `responsiveValues` | `{ responsiveValues: ResponsiveConfig \| null }` | كائن يحتوي على إعدادات التموضع، الدوران، والحجم (Scale) للبطاقات، والتي يتم حسابها ديناميكياً بناءً على عرض شاشة المستخدم عبر الكائن الخارجي `heroConfig`. |

---

## الاستثناءات والحالات الحدية (Edge Cases & Exceptions)

1. **القيم الفارغة للمراجع:** إذا كانت `containerRef.current` أو `triggerRef.current` تساوي `null`، أو إذا لم يتم حساب `responsiveValues` بعد، سيتوقف الخطاف مبكراً (Early Return) ولن يتم تهيئة محرك GSAP لمنع حدوث أخطاء (Errors).
2. **تغيير حجم الشاشة (Window Resize):** يعالج الخطاف تغييرات حجم الشاشة ديناميكياً عبر مستمع للأحداث `resize`. يتم إعادة حساب `responsiveValues` وتستفيد إعدادات GSAP من خاصية `invalidateOnRefresh: true` لإعادة ضبط الحركات لتناسب الأبعاد الجديدة.
3. **تسرب الذاكرة والأداء (Memory & Performance):** 
   - لضمان الأداء السلس، يتم إضافة وحذف خاصية `will-change: transform, opacity` للعناصر المتحركة ديناميكياً.
   - عند إزالة المكون (Unmount)، يقوم الخطاف بحذف خط `ScrollTrigger` الزمني، واستدعاء `ctx.revert()` لإلغاء كافة تأثيرات GSAP، بالإضافة إلى إزالة مستمع حدث الـ `resize`.

---

## مثال للاستخدام (Usage Example)

```tsx
import React, { useRef } from 'react';
import { useHeroAnimation } from '@/hooks/use-hero-animation';

const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // استدعاء الخطاف وتمرير المراجع
  const { responsiveValues } = useHeroAnimation(containerRef, triggerRef);

  return (
    <div ref={containerRef} className="hero-container relative">
      <div ref={triggerRef} className="scroll-trigger-element h-screen">
        {/* Phase 1 Elements */}
        <div className="video-mask-wrapper">...</div>
        <header className="fixed-header opacity-0">...</header>

        {/* Phase 2 & 5 Elements */}
        <div className="text-content-wrapper">...</div>
        <div className="dedication-wrapper">...</div>
        <div className="phase-5-wrapper opacity-0">...</div>

        {/* Phase 3 Elements (Cards) */}
        {responsiveValues && (
          <div className="cards-container">
            {[...Array(7)].map((_, index) => (
              <img key={index} src={`/card-${index}.png`} className="phase-3-img absolute" alt="card" />
            ))}
          </div>
        )}
        
        {/* CTA */}
        <button className="hero-cta opacity-0 pointer-events-none">Explore</button>
      </div>
    </div>
  );
};

export default HeroSection;
```
