## [LRN-20260317-001] correction

**Logged**: 2026-03-17T15:46:20.0066064+02:00
**Priority**: high
**Status**: pending
**Area**: frontend

### Summary
لا تغيّر بنية مشهد الواجهة كاملة عندما يكون طلب المستخدم محصورًا في التموضع فقط.

### Details
في هذه المهمة تم استبدال المشهد النهائي في الصفحة الرئيسية بتركيب بصري مختلف اعتمادًا على بطاقة مرجعية داخلية. هذا غيّر التوازن العام للتصميم وأنتج نتيجة أبعد من المطلوب. التصحيح الصحيح هنا هو تثبيت التصميم الأصلي أولًا، ثم تعديل إحداثيات العناصر المطلوبة فقط ضمن نفس البنية.

### Suggested Action
عند وجود مرجع بصري من المستخدم، ابدأ بتحديد العنصر المنحرف داخل نفس المكوّن الأصلي، وامنع أي توحيد هيكلي أو إعادة تركيب قبل إثبات أن الخلل لا يمكن إصلاحه محليًا.

### Metadata
- Source: user_feedback
- Related Files: apps/web/src/components/HeroAnimation.tsx, apps/web/src/components/LauncherCenterCard.tsx, apps/web/src/hooks/use-hero-animation.ts
- Tags: frontend, layout, positioning, correction

---
