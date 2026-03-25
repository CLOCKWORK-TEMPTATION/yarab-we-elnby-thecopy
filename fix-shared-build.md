# خطة إصلاح تعطل بناء `@the-copy/shared`

## السياق (Context)

حزمة `@the-copy/shared` تفشل عند تشغيل `tsc` (الأمر `pnpm run build` في الحزمة). هذا يوقف بناء الـ monorepo بالكامل لأن `turbo build` يبني الحزم المشتركة أولاً.

**التقرير الأصلي** ذكر أن المشكلة في استيرادات `@/ai/genkit` و `@/lib/api` — لكن بعد الفحص الفعلي:
- هذه الاستيرادات موجودة في `apps/web/` وليس في `packages/shared/`
- مشاكل `packages/shared` الفعلية مختلفة (مُفصّلة أدناه)

---

## المشاكل المكتشفة فعلياً

### 1. استيراد `zkSchema` غير موجود (BUILD BREAKER)
- **الملف:** `packages/shared/src/db/schema.ts` (السطر 176)
- **السطر:** `export * from './zkSchema';`
- **المشكلة:** الملف `zkSchema.ts` لا يوجد في `packages/shared/src/db/`
- **ملاحظة:** `zkSchema` موجود في `apps/backend/src/db/zkSchema` — يبدو أنه نُقل أو لم يُنسخ عند فصل الحزمة

### 2. ملف `src/ai/index.ts` بترميز خاطئ (UTF-16)
- **الملف:** `packages/shared/src/ai/index.ts`
- **المشكلة:** الملف مُرمّز بـ UTF-16 LE بدل UTF-8. المحتوى يظهر كـ: `e x p o r t   *   f r o m   ' . / g e m i n i - s e r v i c e ' ;`
- **التأثير:** قد يفشل tsc في قراءته أو يعطي أخطاء غريبة

### 3. مجلد `dist/` يحتوي ملفات قديمة (stale)
- **الملفات:** `dist/ai/genkit.d.ts`, `dist/ai/gemini-core.d.ts`, `dist/ai/ai-team-brainstorming.d.ts`, `dist/ai/index.d.ts`
- **المشكلة:** هذه الملفات تشير لـ modules لم تعد موجودة في `src/`
- **التأثير:** المستهلكون قد يستوردون exports قديمة ثم يفشل التصريف

---

## خطة الإصلاح

### الخطوة 1: حذف مجلد `dist/` القديم
```
packages/shared/dist/  ← حذف كامل
```
السبب: يحتوي تعريفات أنواع قديمة لا تتطابق مع `src/` الحالي.

### الخطوة 2: إزالة استيراد `zkSchema` من `schema.ts`
- **الملف:** `packages/shared/src/db/schema.ts`
- **التعديل:** حذف السطر `export * from './zkSchema';` (السطر 176)
- **السبب:** الملف غير موجود في الحزمة المشتركة. `zkSchema` خاص بالـ backend فقط (`apps/backend/src/db/zkSchema`).

### الخطوة 3: إعادة كتابة `src/ai/index.ts` بترميز UTF-8
- **الملف:** `packages/shared/src/ai/index.ts`
- **التعديل:** إعادة كتابة الملف بنفس المحتوى لكن بترميز UTF-8:
```ts
export * from './gemini-service';
```

### الخطوة 4: التحقق بالبناء
```bash
cd packages/shared && pnpm run build
```
ثم:
```bash
# من الجذر
pnpm run build
```

---

## ملاحظة عن `apps/web`

الاستيرادات `@/ai/genkit` و `@/lib/api` في `apps/web/` هي مشكلة منفصلة عن حزمة `shared`. هذه تستخدم path aliases خاصة بـ Next.js/tsconfig وليست جزءاً من `@the-copy/shared`. إصلاحها خارج نطاق هذه الخطة.

---

## الملفات المُعدّلة

| الملف | التعديل | السبب |
|-------|---------|-------|
| `packages/shared/src/db/schema.ts` | حذف `export * from './zkSchema'` | الملف غير موجود |
| `packages/shared/src/ai/index.ts` | إعادة كتابة بـ UTF-8 | ترميز خاطئ |
| `packages/shared/dist/` | حذف المجلد | ملفات قديمة |

## التحقق
```bash
# 1. بناء الحزمة المشتركة
cd packages/shared && pnpm run build

# 2. فحص الأنواع
pnpm run type-check

# 3. بناء كامل من الجذر
cd ../.. && pnpm run build
```
