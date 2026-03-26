# PROGRESS

## Scope

- Project type: مستودع أحادي يضم تطبيق ويب وخادومًا خلفيًا وحزم مساحة عمل متعددة.
- Primary audience: المطور الجديد، المطور الحالي، والمراجع الفني.
- In scope:
  - `README.md`
  - `docs/ARCHITECTURE.md`
  - `docs/FILE_RELATIONS.md`
  - `docs/API_REFERENCE.md`
  - `docs/_project_tree.txt`
  - الجذر، `apps/web`، `apps/backend`، `packages`، والملفات التشغيلية في `scripts` و `redis`.
- Out of scope:
  - `node_modules`
  - `dist`
  - `.next`
  - `output`
  - الوثائق المحلية داخل بعض المسارات الفرعية إلا بوصفها دليلًا على البنية
  - القيم الفعلية للأسرار وبيئات النشر الحية
- Documentation version: 1

## Final Status

| Area | Status | Notes |
|---|---|---|
| Inventory | DONE | تم تثبيت بنية المستودع وملفات الإعداد الرئيسية |
| Entry points | DONE | تم توثيق نقاط دخول الويب والخلفية والحزم |
| Architecture | DONE | تم توثيق الطبقات والمسارات والقرارات المثبتة |
| File relations | DONE | تم تثبيت العلاقات الحرجة بين الويب والخلفية والحزم |
| README | DONE | أضيف ملف دخول جذري عملي |
| API reference | DONE | أضيف مرجع لمسارات الويب والخلفية والسطوح العامة |
| In-code docs | DONE | تم توثيق سجل التطبيقات المركزي داخل الكود |

## Verified Facts

- Package manager: `pnpm@10.32.1`
- Workspace layout: `apps/*` و `packages/*`
- Main run commands:
  - `pnpm dev`
  - `pnpm dev:web`
  - `pnpm dev:backend`
  - `pnpm build`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm type-check`
  - `pnpm start`
- Entry points:
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/app/ui/page.tsx`
  - `apps/web/src/app/api/**/route.ts`
  - `apps/backend/src/server.ts`
  - `apps/backend/src/mcp-server.ts`
  - `packages/*/src/index.ts`
- Public surface:
  - مسارات المستخدم في `apps/web/src/config/apps.config.ts`
  - واجهات الويب البرمجية في `apps/web/src/app/api`
  - واجهات الخلفية في `apps/backend/src/server.ts`
  - خرائط التصدير في ملفات `package.json` للحزم

## Unknowns

- ما إذا كانت جميع المشاريع الفرعية المضمنة داخل بعض مسارات الويب ما زالت تُعامل كمسارات إنتاجية كاملة أم كمنابع نقل مرحلية.
- طوبولوجيا النشر الفعلية خارج البيئة المحلية ليست مثبتة من الكود وحده.
- قاعدة البيانات المستخدمة حاليًا في التشغيل الحي غير مثبتة من المستودع وحده، رغم وجود دعم واضح لقواعد مختلفة.

## Remaining Limits

- لم يتم توحيد أو تنظيف الوثائق الفرعية القديمة داخل بعض المسارات؛ التركيز كان على التوثيق الجذري.
- لم تُجر مراجعة سطرية لكل رمز مصدّر داخل كل حزمة؛ المرجع الحالي يوثق السطح العام ونقاط الدمج الأعلى قيمة.
- لا توجد وثيقة جذرية سابقة للمقارنة، لذلك هذا الإصدار يؤسس الخط الأساسي بدل تحديث هيكل قائم.
