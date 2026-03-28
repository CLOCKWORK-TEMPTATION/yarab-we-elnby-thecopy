# أمر توجيهي: إعادة هيكلة تطبيق Next.js القائم وفق معمارية Next.js 16.2

> **الإصدار:** 1.0.0
> **التاريخ:** 27 مارس 2026
> **النطاق:** إعادة هيكلة كاملة لتطبيق Next.js قائم ليتبع أحدث المبادئ المعمارية لـ Next.js 16.2
> **الأولوية:** حرجة — لا يُسمح بأي تنفيذ جزئي أو اختصارات
> **المجلدات المستهدفة:**
> - `apps/web/src/app/(main)/brain-storm-ai`
> - `apps/web/src/app/(main)/BREAKAPP`
> - `apps/web/src/app/(main)/actorai-arabic`

---

## القسم صفر: بروتوكول التنفيذ الإلزامي

### 0.1 قواعد صارمة غير قابلة للتفاوض

1. **لا تنفذ أي خطوة قبل إكمال مرحلة التحليل بالكامل.** أي تعديل على الكود قبل فهم الحالة الراهنة = خطأ فادح.
2. **لا تحذف أي ملف قبل التأكد من عدم وجود أي import يشير إليه.** استخدم `grep -r` للتحقق.
3. **كل خطوة تنتهي بـ `git commit` برسالة واضحة.** لا يُسمح بتجميع عدة تغييرات في commit واحد.
4. **لا تُعدّل ملفات الاختبار ضمن نفس الـ commit الذي يُعدّل ملفات المصدر.** الاختبارات لها commits منفصلة.
5. **بعد كل مرحلة:** شغّل `pnpm build` و `pnpm test` (إن وُجد). لو فشل البناء، أصلح الخطأ قبل الانتقال.
6. **سجّل كل قرار معماري** في ملف `MIGRATION_LOG.md` مع السبب والبديل المرفوض.

### 0.2 ترتيب المراحل الإلزامي

```
المرحلة 1: التحليل والجرد         ← لا تعديل على الكود
المرحلة 2: الترقية التقنية          ← تحديث الحزم فقط
المرحلة 3: الهيكل الجذري          ← نقل الملفات الجذرية
المرحلة 4: إعادة هيكلة app/       ← الـ routing فقط
المرحلة 5: إعادة هيكلة lib/       ← المنطق الأساسي
المرحلة 6: إعادة هيكلة components/ ← واجهة المستخدم
المرحلة 7: ترحيل الأنظمة الفرعية  ← caching, proxy, actions
المرحلة 8: التنظيف والتحقق النهائي ← حذف القديم + اختبار شامل
```

### 0.3 سياق المشروع

هذا مشروع monorepo يستخدم:
- **pnpm 10.32.1** (ليس npm) — كل الأوامر تستخدم `pnpm`
- **Turbo 2.5** للبناء
- **Next.js 16.1.5** حالياً (الهدف: 16.2)
- **TypeScript strict mode**
- **ESLint 9 flat config** (ليس .eslintrc)
- المجلدات المستهدفة تقع تحت `apps/web/src/app/(main)/`

---

## القسم الأول: مرحلة التحليل والجرد (المرحلة 1)

### 1.1 جرد الحالة الراهنة

نفّذ الأوامر التالية وسجّل النتائج في `MIGRATION_LOG.md`:

```bash
# --- جرد الإصدارات ---
cat apps/web/package.json | grep -E '"next"|"react"|"react-dom"'

# --- جرد هيكل المجلدات المستهدفة ---
find apps/web/src/app/\(main\)/brain-storm-ai -maxdepth 3 -type d | sort
find apps/web/src/app/\(main\)/BREAKAPP -maxdepth 3 -type d | sort 2>/dev/null
find apps/web/src/app/\(main\)/actorai-arabic -maxdepth 3 -type d | sort

# --- جرد استخدام الـ caching القديم ---
grep -rn "unstable_cache\|revalidateTag\|revalidatePath\|export const revalidate\|export const dynamic" \
  apps/web/src/app/\(main\)/brain-storm-ai/ \
  apps/web/src/app/\(main\)/BREAKAPP/ \
  apps/web/src/app/\(main\)/actorai-arabic/ 2>/dev/null

# --- جرد الـ Server Actions ---
grep -rn '"use server"' \
  apps/web/src/app/\(main\)/brain-storm-ai/ \
  apps/web/src/app/\(main\)/BREAKAPP/ \
  apps/web/src/app/\(main\)/actorai-arabic/ 2>/dev/null

# --- جرد الـ Client Components ---
grep -rn '"use client"' \
  apps/web/src/app/\(main\)/brain-storm-ai/ \
  apps/web/src/app/\(main\)/BREAKAPP/ \
  apps/web/src/app/\(main\)/actorai-arabic/ 2>/dev/null

# --- عدد الملفات لكل نوع ---
echo "=== brain-storm-ai ==="
find apps/web/src/app/\(main\)/brain-storm-ai -name "*.tsx" | wc -l
find apps/web/src/app/\(main\)/brain-storm-ai -name "*.ts" | wc -l

echo "=== BREAKAPP ==="
find apps/web/src/app/\(main\)/BREAKAPP -name "*.tsx" 2>/dev/null | wc -l
find apps/web/src/app/\(main\)/BREAKAPP -name "*.ts" 2>/dev/null | wc -l

echo "=== actorai-arabic ==="
find apps/web/src/app/\(main\)/actorai-arabic -name "*.tsx" | wc -l
find apps/web/src/app/\(main\)/actorai-arabic -name "*.ts" | wc -l
```

### 1.2 تصنيف المخاطر لكل مجلد

| المجلد | المعمارية الحالية | مستوى المخاطرة | السبب |
|--------|-------------------|----------------|-------|
| brain-storm-ai | src/ مع components/hooks/lib/types | متوسط | هيكل منظم نسبياً، يحتاج ترقية caching |
| BREAKAPP | غير معروف (يجب فحصه) | عالي | مجلد جديد، قد يحتاج هيكلة كاملة |
| actorai-arabic | مكونات محلية + استيراد من @the-copy/actorai | عالي | 40+ useState hooks، Zod schemas، AR/MR features |

### 1.3 إنشاء خريطة الاعتمادات

```bash
# أنشئ خريطة imports لكل مجلد مستهدف
for dir in brain-storm-ai BREAKAPP actorai-arabic; do
  echo "=== $dir ==="
  grep -rn "from ['\"]" "apps/web/src/app/(main)/$dir/" --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v node_modules | sort
done > MIGRATION_LOG_IMPORTS.txt
```

---

## القسم الثاني: الترقية التقنية (المرحلة 2)

### 2.1 تحديث الحزم الأساسية

```bash
# من جذر المشروع
cd apps/web
pnpm install next@latest react@latest react-dom@latest

# التحقق من الإصدار
npx next --version
# المتوقع: 16.2.x أو أحدث

# تشغيل codemod الرسمي
npx @next/codemod@canary upgrade latest
```

### 2.2 تحديث next.config.ts

تحقق من `apps/web/next.config.ts` وأضف:

```typescript
// أضف هذه الإعدادات إن لم تكن موجودة
const nextConfig: NextConfig = {
  // ... الإعدادات الموجودة تبقى ...

  // React Compiler — مستقر في 16.2
  reactCompiler: true,

  // إعدادات الـ logging الجديدة
  logging: {
    browserToTerminal: 'error',
  },

  // ⚠️ أزل أي إعدادات قديمة:
  // - amp (تم إزالته نهائياً)
  // - swcMinify (أصبح الافتراضي)
  // - experimental.appDir (أصبح الافتراضي)
  // - experimental.serverActions (أصبح الافتراضي)
};
```

### 2.3 نقطة تحقق

```bash
cd ../..  # العودة لجذر المشروع
pnpm build
git add -A
git commit -m "chore: upgrade to Next.js 16.2 in apps/web"
```

---

## القسم الثالث: إعادة هيكلة المجلدات المستهدفة (المراحل 3-6)

> **ملاحظة مهمة:** لأن المجلدات المستهدفة هي تطبيقات فرعية تحت `(main)/`، نطبق مبادئ الهيكلة على كل مجلد داخلياً.

### 3.1 الهيكل المستهدف لكل تطبيق فرعي

```
apps/web/src/app/(main)/[app-name]/
├── page.tsx                      # Thin page — dynamic import أو استدعاء مكون فقط
├── loading.tsx                   # Loading UI
├── error.tsx                     # Error boundary
│
├── components/                   # UI Components خاصة بالتطبيق
│   ├── ui/                       # عناصر بدائية محلية (إن وُجدت)
│   └── features/                 # مكونات Feature
│
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── constants/                    # ثوابت ومعاملات
├── lib/                          # منطق أساسي وخدمات
│   ├── api/                      # API clients
│   └── cache/                    # «جديد» — "use cache" strategies
│
├── actions/                      # Server Actions (إن وُجدت)
└── services/                     # خدمات خارجية
```

### 3.2 brain-storm-ai — خطة التنفيذ

**الحالة الراهنة:** هيكل جيد مع `src/` يحتوي components, hooks, lib, types, constants

**الخطوات:**
1. **page.tsx** — تأكد أنه thin (21 سطر حالياً — جيد)
2. **أضف loading.tsx و error.tsx**
3. **تحقق من brain-storm-content.tsx** — إذا > 300 سطر، فككه إلى مكونات أصغر
4. **ترحيل أي caching قديم** إلى `"use cache"` + `cacheLife()` + `cacheTag()`
5. **تحقق من `'use client'`** — هل كل مكون يحتاجه فعلاً؟

```bash
# فحص حجم الملفات
wc -l apps/web/src/app/\(main\)/brain-storm-ai/brain-storm-content.tsx
wc -l apps/web/src/app/\(main\)/brain-storm-ai/src/components/*.tsx
```

### 3.3 BREAKAPP — خطة التنفيذ

**الحالة الراهنة:** يجب فحصه أولاً

```bash
# فحص وجود المجلد ومحتواه
ls -la apps/web/src/app/\(main\)/BREAKAPP/ 2>/dev/null
find apps/web/src/app/\(main\)/BREAKAPP -type f 2>/dev/null | head -30
```

**الخطوات (بعد الفحص):**
1. طبق نفس الهيكل المستهدف أعلاه
2. أنشئ page.tsx thin + loading.tsx + error.tsx
3. فصل المنطق عن العرض

### 3.4 actorai-arabic — خطة التنفيذ

**الحالة الراهنة:** مكونات محلية + استيراد من `@the-copy/actorai` + 40+ useState hooks

**الخطوات:**
1. **page.tsx** — حالياً 25 سطر مع dynamic import — جيد
2. **أضف loading.tsx و error.tsx**
3. **ActorAiArabicStudio.tsx** — تفكيك الـ 40+ useState:
   - استخرج مجموعات state مرتبطة إلى custom hooks:
     - `useScriptAnalysis()` — حالة تحليل النص
     - `useVocalTraining()` — حالة التمارين الصوتية
     - `useWebcamSession()` — حالة الكاميرا والتحليل
     - `useMemorizationDrill()` — حالة تمارين الحفظ
     - `useARSession()` — حالة AR/MR
   - كل hook يُوضع في `hooks/`
4. **types/index.ts** (612 سطر) — قسّمه:
   - `types/script.ts` — أنواع السيناريو والتحليل
   - `types/vocal.ts` — أنواع التمارين الصوتية
   - `types/webcam.ts` — أنواع تحليل الكاميرا
   - `types/ar.ts` — أنواع AR/MR
   - `types/index.ts` — barrel re-exports

---

## القسم الرابع: ترحيل نظام الـ Caching (المرحلة 7)

### 4.1 لكل مجلد مستهدف

**الخطوة أ:** حدد كل استخدام caching قديم:

```bash
for dir in brain-storm-ai BREAKAPP actorai-arabic; do
  echo "=== $dir ==="
  grep -rn "unstable_cache\|export const revalidate\|export const dynamic\|{ next: { revalidate\|{ next: { tags" \
    "apps/web/src/app/(main)/$dir/" 2>/dev/null
done
```

**الخطوة ب:** جدول التحويل

| النمط القديم | البديل الجديد |
|---|---|
| `export const revalidate = N` | `cacheLife('hours')` داخل دالة `"use cache"` |
| `export const dynamic = 'force-static'` | `"use cache"` على مستوى الصفحة |
| `export const dynamic = 'force-dynamic'` | احذفه — الافتراضي أصبح dynamic |
| `unstable_cache(fn, keys, opts)` | `"use cache"` + `cacheLife()` + `cacheTag()` |
| `fetch(url, { next: { revalidate: N } })` | `"use cache"` + `cacheLife()` على الدالة |
| `revalidateTag('x')` | يبقى كما هو |
| `revalidatePath('/x')` | يبقى كما هو |

### 4.2 إنشاء cache tags مركزي (إن لزم)

```typescript
// apps/web/src/lib/cache/tags.ts
export const CACHE_TAGS = {
  brainstorm: 'brainstorm',
  brainstormSession: (id: string) => `brainstorm-${id}`,
  breakdown: 'breakdown',
  actor: 'actor',
} as const;
```

---

## القسم الخامس: التنظيف والتحقق النهائي (المرحلة 8)

### 5.1 التحقق من سلامة الـ imports

```bash
# من apps/web/
npx tsc --noEmit

# تحقق من عدم وجود imports معطلة
pnpm build
```

### 5.2 إزالة الأيتام

```bash
# ابحث عن مجلدات فارغة
find apps/web/src/app/\(main\)/brain-storm-ai -type d -empty
find apps/web/src/app/\(main\)/BREAKAPP -type d -empty 2>/dev/null
find apps/web/src/app/\(main\)/actorai-arabic -type d -empty
```

### 5.3 قائمة التحقق النهائية

```
□ pnpm build — ينجح بدون أخطاء
□ pnpm lint — ينجح بدون أخطاء
□ pnpm test — ينجح بدون أخطاء (إن وُجد)
□ التطبيق يعمل محلياً: pnpm dev
□ brain-storm-ai يعمل بشكل صحيح
□ BREAKAPP يعمل بشكل صحيح
□ actorai-arabic يعمل بشكل صحيح
□ لا يوجد أي استخدام لـ unstable_cache في المجلدات المستهدفة
□ كل page.tsx أقل من 50 سطر (thin pages)
□ كل مكون 'use client' يحتاجه فعلاً
□ كل الـ commits لها رسائل واضحة
□ MIGRATION_LOG.md مكتمل
```

### 5.4 Commit النهائي

```bash
git add -A
git commit -m "refactor: complete migration of brain-storm-ai, BREAKAPP, actorai-arabic to Next.js 16.2 architecture"
```

---

## القسم السادس: ملاحظات خاصة بالمشروع

### خصوصيات هذا الـ monorepo

1. **استخدم `pnpm` وليس `npm`** — كل الأوامر تكون `pnpm build` وليس `npm run build`
2. **الـ tsconfig.json يحتوي 42+ path alias** — تأكد من تحديث أي alias عند نقل ملفات
3. **ESLint 9 flat config** — لا تنشئ `.eslintrc.*` — الملف هو `eslint.config.js`
4. **Named exports مطلوبة** في ESLint — لا تستخدم `export default` في ملفات src/ (ماعدا pages)
5. **middleware.ts موجود بالفعل** — يضيف security headers. عند ترحيله لـ proxy.ts، حافظ على كل CSP headers
6. **packages workspace** — بعض المجلدات تستورد من `@the-copy/*` packages. لا تنقل هذه الملفات بل حافظ على imports
7. **Tiptap Pro** — يتطلب .npmrc token. لا تحذف أو تعدل .npmrc

### أوامر الطوارئ

```bash
# لو فشل البناء بعد أي خطوة
git stash
pnpm build
# لو نجح: المشكلة في التغييرات الأخيرة
git stash pop
# أصلح وأعد المحاولة

# لو ضاع import
grep -rn "المسار_القديم" apps/web/src/ --include="*.ts" --include="*.tsx"
```

---

> **نهاية الأمر التوجيهي.**
> هذا المستند يُنفَّذ بالترتيب. لا يُسمح بتخطي أي مرحلة.
> كل مرحلة تنتهي بـ build ناجح و commit منفصل.
