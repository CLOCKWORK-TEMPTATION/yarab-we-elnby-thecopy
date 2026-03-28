# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**النسخة (The Copy)** — unified Arab cinema production platform. A full-stack monorepo with a Next.js 16 frontend, Express 5 backend, and 15+ specialized tool packages for screenwriting, cinematography, directing, and acting.

**Language:** Arabic-first (RTL). All UI text, labels, and user-facing content are in Arabic.

## Monorepo Structure

```
apps/
  web/          → Next.js 16.1.5 + React 19 (port 5000)
  backend/      → Express 5 API + BullMQ + Drizzle ORM (port 3001)

packages/
  actorai, art-director, brain-storm-ai, breakapp, breakdown,
  budget, cinefit, cinematography, creative-writing,
  directors-studio, editor, prompt-engineering, styleist
  shared/       → Cross-package utilities
  ui/           → Shared Radix UI + Tailwind component library
  tsconfig/     → Shared TypeScript configurations
```

## Commands

```bash
# Development (from monorepo root)
pnpm dev                  # web + backend concurrently
pnpm dev:web              # Next.js only (port 5000)
pnpm dev:backend          # Express only (port 3001)

# Build & Validate
pnpm build                # Turbo full build
pnpm lint                 # Turbo lint all packages
pnpm type-check           # Turbo TypeScript check
pnpm ci                   # Full pipeline: lint + type-check + test + build

# Testing
pnpm test                 # Vitest across all packages

# Web app specific (cd apps/web)
pnpm dev:next-only        # Next.js without file-import server
pnpm test:smoke           # Smoke tests
pnpm e2e                  # Playwright end-to-end
pnpm lighthouse           # Performance audit
pnpm analyze              # Bundle analysis (ANALYZE=true)
```

## Architecture

### Web App (apps/web)

**Routing:** Next.js App Router with route groups:
- `(auth)/` — login, register (no sidebar)
- `(main)/` — all tool apps (with sidebar + header)
- `api/` — route handlers (AI chat, analysis, breakdown, budget, etc.)

**Layout bypass:** `(main)/layout.tsx` is a client component that checks `pathname.startsWith("/editor")` and renders children without the sidebar wrapper. All other `(main)` routes get the `SidebarProvider` shell.

**Sub-applications under (main)/:**
Each major tool lives as its own directory with independent architecture:
- `editor/` — Tiptap 3 screenplay editor (hybrid React + imperative class pattern, has its own CLAUDE.md)
- `breakdown/` — DDD architecture (domain/infrastructure/application/presentation layers)
- `brain-storm-ai/` — Multi-agent constitutional AI brainstorming (own src/ with components/hooks/lib/types)
- `actorai-arabic/` — Actor training studio (imports from @the-copy/actorai package)
- `directors-studio/` — Scene/character/shot management
- `cinematography-studio/`, `art-director/`, `styleIST/`, etc.

### Backend (apps/backend)

- Express 5 with Drizzle ORM (Neon PostgreSQL)
- BullMQ job queues with Redis
- MCP server support (`pnpm dev:mcp`)
- File processing (DOCX via Mammoth, PDF via pdfjs-dist)
- Observability: Sentry + OpenTelemetry + Winston + Prometheus metrics

### Key Shared Libraries (apps/web/src/lib/)

- `ai/` — AI orchestration: constitutional AI, RAG, seven-stations analysis, flows
- `drama-analyst/` — agents, orchestration, services for screenplay analysis
- `screenplay/` — parsing and processing
- `security/` — security utilities
- `cache-middleware.ts`, `redis.ts` — caching layer

### State Management

- **Zustand** for client stores
- **TanStack React Query** for server state
- **React Hook Form + Zod** for form validation
- **localStorage** for editor auto-save and settings

## Configuration Details

| Key | Value |
|-----|-------|
| Package Manager | pnpm 10.32.1 (strict) |
| Node | >= 20.0.0 |
| TypeScript | 5.x strict mode |
| Build | Turbo 2.5 + Turbopack |
| Output | standalone (next.config.ts) |
| Linter | ESLint 9 flat config (apps/web) |

### Path Aliases (tsconfig.json)

- `@/*` → `./src/*`
- `@editor/*` → `./src/app/(main)/editor/src/*`
- `@core/*`, `@agents/*`, `@services/*`, `@orchestration/*` → drama-analyst paths
- All `@the-copy/*` packages → `../../packages/*/src`

### Environment Variables

Copy `.env.example` at root. Key variables:
- `DATABASE_URL` — Neon PostgreSQL
- `REDIS_URL` — Redis (embedded server available via `pnpm start:redis`)
- `GOOGLE_GENAI_API_KEY` — primary AI provider (Gemini)
- `ANTHROPIC_API_KEY` — Claude for review models
- `NEXT_PUBLIC_API_URL` — backend URL (default http://localhost:3001)
- `TIPTAP_PRO_TOKEN` — required for Tiptap 3 Pro extensions (configured in .npmrc)

### Security Headers

`middleware.ts` adds CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection. CSP is relaxed in development mode.

### npm Registry

Tiptap Pro packages require authenticated registry access. The `.npmrc` file configures `@tiptap-pro:registry=https://registry.tiptap.dev/` with an auth token.

## Conventions

- **Server Components are default.** Only add `'use client'` when using hooks, event handlers, or browser APIs.
- **Arabic RTL:** Root `<html lang="ar" dir="rtl">`. Cairo font from Google Fonts.
- **Named exports enforced** in ESLint for `src/` files (except app routes, middleware, components).
- **Directors Studio complexity limits:** max complexity 8, max 50 lines/function, max 300 lines/file.
- **Each tool app may have its own internal architecture** (DDD for breakdown, barrel exports for brain-storm-ai, package import for actorai). Respect each app's patterns when modifying.
- **Workspace packages** are imported as `@the-copy/[name]` and resolved to `packages/[name]/src`.

## AI Providers

Multiple AI SDKs integrated: Google Genkit (primary), @ai-sdk (Anthropic, OpenAI), LangChain, Groq, Mistral. Check the specific tool's config for which provider it uses.

---

## 🔴 أمر توجيهي: إعادة هيكلة وفق معمارية Next.js 16.2

> **الإصدار:** 1.0.0 | **التاريخ:** 27 مارس 2026
> **النطاق:** إعادة هيكلة ثلاثة تطبيقات فرعية فقط — لا يُسمح بتعديل أي شيء خارجها
> **الأولوية:** حرجة — لا تنفيذ جزئي أو اختصارات

### النطاق المحدد — ثلاثة مجلدات فقط

```
apps/web/src/app/(main)/brain-storm-ai/
apps/web/src/app/(main)/BREAKAPP/
apps/web/src/app/(main)/actorai-arabic/
```

**⛔ لا تعدّل أي ملف خارج هذه المجلدات الثلاثة إلا بإذن صريح.**

---

### بروتوكول التنفيذ الإلزامي

1. **لا تنفذ أي خطوة قبل إكمال مرحلة التحليل بالكامل.** أي تعديل قبل فهم الحالة الراهنة = خطأ فادح.
2. **لا تحذف أي ملف قبل التأكد من عدم وجود أي import يشير إليه** عبر `grep -rn`.
3. **كل خطوة تنتهي بـ build ناجح.** لو فشل البناء، أصلح قبل الانتقال.
4. **سجّل كل قرار معماري** في `MIGRATION_LOG.md` بالجذر مع السبب والبديل المرفوض.
5. **ترتيب المراحل إلزامي — لا يُسمح بتخطي أي مرحلة:**

```
المرحلة 1: التحليل والجرد         ← لا تعديل على الكود
المرحلة 2: الهيكل المستهدف         ← إنشاء المجلدات فقط
المرحلة 3: إعادة هيكلة الصفحات    ← thin pages + route files
المرحلة 4: إعادة هيكلة المكونات    ← تصنيف components
المرحلة 5: إعادة هيكلة lib/       ← المنطق الأساسي + caching
المرحلة 6: ترحيل hooks/types/actions
المرحلة 7: تنظيف + إزالة الأيتام
المرحلة 8: تحقق نهائي + build
```

---

### ملاحظة عن المرحلة 2 (الترقية التقنية)

الترقية التقنية العامة (next.config.ts, استبدال eslint بـ biome, إضافة AGENTS.md) تخص مشروع `apps/web` ككل وليس المجلدات الثلاثة فقط. **لا تنفذها ضمن هذا النطاق** إلا بإذن صريح. ما يقع ضمن النطاق:
- إزالة `eslint.config.mjs` الخاص بـ BREAKAPP (ملف تكوين لا ينتمي لمجلد فرعي)
- تطبيق أنماط caching الجديدة (`"use cache"`) إذا وُجد caching قديم

### أوامر الجرد الإلزامية (المرحلة 1 — قبل أي تعديل)

```bash
# --- جرد 'use client' vs 'use server' ---
grep -rn '"use client"\|"use server"' apps/web/src/app/\(main\)/brain-storm-ai/ apps/web/src/app/\(main\)/BREAKAPP/ apps/web/src/app/\(main\)/actorai-arabic/

# --- جرد caching قديم ---
grep -rn "unstable_cache\|revalidateTag\|revalidatePath\|export const revalidate\|export const dynamic" apps/web/src/app/\(main\)/brain-storm-ai/ apps/web/src/app/\(main\)/BREAKAPP/ apps/web/src/app/\(main\)/actorai-arabic/

# --- جرد imports لكل مجلد (لتحديث المسارات بعد النقل) ---
grep -rn "from ['\"]" apps/web/src/app/\(main\)/brain-storm-ai/ --include="*.ts" --include="*.tsx" | grep -v node_modules > MIGRATION_LOG_IMPORTS_brainstorm.txt
grep -rn "from ['\"]" apps/web/src/app/\(main\)/BREAKAPP/ --include="*.ts" --include="*.tsx" | grep -v node_modules > MIGRATION_LOG_IMPORTS_breakapp.txt
grep -rn "from ['\"]" apps/web/src/app/\(main\)/actorai-arabic/ --include="*.ts" --include="*.tsx" | grep -v node_modules > MIGRATION_LOG_IMPORTS_actorai.txt

# --- عدد أسطر الملفات الكبيرة ---
wc -l apps/web/src/app/\(main\)/actorai-arabic/components/ActorAiArabicStudio.tsx
wc -l apps/web/src/app/\(main\)/brain-storm-ai/brain-storm-content.tsx

# --- التحقق من imports خارجية تشير لهذه المجلدات ---
grep -rn "brain-storm-ai\|BREAKAPP\|actorai-arabic" apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v "apps/web/src/app/(main)/brain-storm-ai" | grep -v "apps/web/src/app/(main)/BREAKAPP" | grep -v "apps/web/src/app/(main)/actorai-arabic"
```

**سجّل نتائج كل أمر في `MIGRATION_LOG.md` قبل أي تعديل على الكود.**

---

### الحالة الراهنة — نتائج التحليل

#### 1. brain-storm-ai/ — الحالة الراهنة

```
brain-storm-ai/
├── page.tsx                      ← thin ✅ (dynamic import)
├── brain-storm-content.tsx       ← ⚠️ 36KB في الجذر — يجب نقله
├── src/
│   ├── components/               ← 8 مكونات + index.ts barrel
│   │   ├── AgentCard.tsx, AgentIconComponent.tsx, AgentsSidebar.tsx
│   │   ├── BrainStormContent.tsx, BrainStormHeader.tsx
│   │   ├── ControlPanel.tsx, DebatePanel.tsx, FeaturesGrid.tsx
│   │   └── index.ts
│   ├── constants/                ← ملف واحد
│   ├── hooks/                    ← useAgentStates.ts, useSession.ts + index.ts
│   ├── lib/                      ← api.ts, utils.ts
│   └── types/                    ← ملف واحد
```

**المشاكل:**
- `brain-storm-content.tsx` (36KB) موجود في الجذر بجانب `page.tsx` — يجب أن يكون في `src/components/`
- كل المكونات `'use client'` — مراجعة مطلوبة لتحديد أيها يحتاج فعلاً
- ملفات التوثيق (README.md, API_DOCS.md, TECHNICAL_DOCUMENTATION.md, USER_GUIDE.md) مبعثرة في الجذر

#### 2. BREAKAPP/ — الحالة الراهنة (⚠️ عالي المخاطرة)

```
BREAKAPP/
├── app/                          ← ⛔ layout.tsx خاص فيه <html><body> — يتعارض مع root layout!
│   ├── layout.tsx                ← مشكلة: يعيد تعريف <html> و <body>
│   ├── page.tsx                  ← 'use client' + redirect logic
│   ├── globals.css
│   ├── (auth)/, (crew)/, (dashboard)/, (runner)/
│   └── dashboard/
├── components/                   ← ConnectionTest.tsx, maps/, scanner/
├── hooks/                        ← useGeolocation.ts, useSocket.ts
├── lib/                          ← auth.ts, types/
├── src/app/(auth)/               ← ⛔ هيكل مكرر — بقايا تطبيق مستقل
├── eslint.config.mjs             ← ⛔ eslint خاص — يجب إزالته
├── postcss.config.mjs            ← ⛔ postcss خاص — يجب إزالته
├── .gitignore                    ← ⛔ gitignore خاص — يجب إزالته
```

**المشاكل الحرجة:**
- `app/layout.tsx` يعيد تعريف `<html>` و `<body>` — **يتعارض مع root layout الخاص بـ apps/web**
- هيكل مكرر: `app/(auth)/` و `src/app/(auth)/` — بقايا دمج تطبيق مستقل
- ملفات تكوين خاصة (eslint, postcss, .gitignore) — لا تنتمي لمجلد فرعي داخل app router
- `page.tsx` يستخدم `useRouter` للتوجيه — يمكن تحويله لـ server component مع `redirect()`
- يستورد من `@the-copy/breakapp` package

#### 3. actorai-arabic/ — الحالة الراهنة

```
actorai-arabic/
├── page.tsx                      ← thin ✅ (dynamic import من @the-copy/actorai)
├── components/
│   ├── ActorAiArabicStudio.tsx   ← ⛔ 163KB! ملف ضخم يحتاج تفكيك
│   └── VoiceCoach.tsx            ← 21KB
├── hooks/                        ← 5 hooks (index.ts barrel)
│   ├── useMemorization.ts, useNotification.ts
│   ├── useVoiceAnalytics.ts, useWebcamAnalysis.ts
│   └── index.ts
├── types/
│   ├── constants.ts (11KB)
│   └── index.ts (19KB)
├── self-tape-suite/              ← sub-route مع page.tsx خاص
│   ├── components/SelfTapeSuite.tsx
│   └── page.tsx
├── docs/                         ← توثيق داخلي
```

**المشاكل:**
- `ActorAiArabicStudio.tsx` بحجم **163KB** — أكبر بكثير من أي حد معقول، يحتاج تفكيك لمكونات أصغر
- كل المكونات `'use client'`
- `types/constants.ts` يمزج بين constants و types — يجب فصلهما
- `page.tsx` يستورد dynamic من `@the-copy/actorai` لكن `components/ActorAiArabicStudio.tsx` المحلي ضخم — هل يُستخدم؟

---

### الهيكل المستهدف لكل مجلد

#### brain-storm-ai/ — الهيكل المستهدف

```
brain-storm-ai/
├── page.tsx                      ← thin: import + render فقط
├── loading.tsx                   ← skeleton UI
├── error.tsx                     ← error boundary
├── src/
│   ├── components/
│   │   ├── ui/                   ← مكونات بدائية خاصة بالعصف الذهني
│   │   ├── features/             ← مكونات مركبة (AgentCard, DebatePanel, etc.)
│   │   └── layout/               ← BrainStormHeader, AgentsSidebar
│   ├── hooks/                    ← بدون تغيير كبير
│   ├── lib/                      ← api.ts, utils.ts
│   ├── types/                    ← بدون تغيير
│   └── constants/                ← بدون تغيير
├── docs/                         ← نقل كل ملفات التوثيق هنا
│   ├── API_DOCS.md
│   ├── TECHNICAL_DOCUMENTATION.md
│   ├── USER_GUIDE.md
│   └── USER_GUIDE_AR.md
└── README.md                     ← يبقى في الجذر
```

**خطوات التنفيذ:**
1. نقل `brain-storm-content.tsx` إلى `src/components/features/` أو حذفه لو هو نسخة قديمة من `src/components/BrainStormContent.tsx`
2. تصنيف المكونات: layout (Header, Sidebar) → `src/components/layout/`، features (AgentCard, DebatePanel) → `src/components/features/`
3. مراجعة كل `'use client'` — إزالته من المكونات التي لا تستخدم hooks/events
4. نقل ملفات التوثيق إلى `docs/`
5. إضافة `loading.tsx` و `error.tsx`
6. تحديث barrel exports في `index.ts`

#### BREAKAPP/ — الهيكل المستهدف

```
BREAKAPP/
├── page.tsx                      ← server component مع redirect()
├── loading.tsx                   ← skeleton UI
├── error.tsx                     ← error boundary
├── dashboard/
│   └── page.tsx
├── login/
│   └── qr/
│       └── page.tsx
├── crew/
│   └── page.tsx
├── runner/
│   └── page.tsx
├── components/
│   ├── ui/                       ← ConnectionTest
│   ├── features/
│   │   ├── maps/
│   │   └── scanner/
├── hooks/
│   ├── useGeolocation.ts
│   └── useSocket.ts
├── lib/
│   ├── auth.ts
│   └── types/
└── README.md
```

**خطوات التنفيذ (⚠️ عالي المخاطرة):**
1. **إزالة `app/layout.tsx`** — يتعارض مع root layout. نقل أي styles إلى الـ parent layout أو CSS modules
2. **تسطيح هيكل `app/`** — نقل route groups من `app/(auth)/`, `app/(dashboard)/` إلى مستوى BREAKAPP/ مباشرة
3. **حذف `app/globals.css`** — دمج الأنماط مع الـ global styles للتطبيق الرئيسي أو CSS module
4. **حذف `src/app/`** — هيكل مكرر لا قيمة له
5. **حذف الملفات الخاصة:** `eslint.config.mjs`, `postcss.config.mjs`, `.gitignore`
6. **تحويل `page.tsx` الرئيسي** من client component مع useEffect+redirect إلى server component:
   ```typescript
   // الهدف: server component بدون 'use client'
   import { redirect } from 'next/navigation';
   import { isAuthenticated } from '@the-copy/breakapp';
   export default function BreakAppPage() {
     if (isAuthenticated()) redirect('/BREAKAPP/dashboard');
     redirect('/BREAKAPP/login/qr');
   }
   ```
   ⚠️ تحقق أولاً: هل `isAuthenticated()` تعمل على الـ server أم تعتمد على browser APIs؟ لو تعتمد على localStorage/cookies client-side، أبقِ 'use client'.
7. **تحديث كل المسارات الداخلية** لتعكس الهيكل الجديد

#### actorai-arabic/ — الهيكل المستهدف

```
actorai-arabic/
├── page.tsx                      ← thin ✅ يبقى كما هو
├── loading.tsx                   ← جديد
├── error.tsx                     ← جديد
├── self-tape-suite/
│   ├── page.tsx
│   ├── loading.tsx               ← جديد
│   └── components/
│       └── SelfTapeSuite.tsx
├── components/
│   ├── features/                 ← تفكيك ActorAiArabicStudio.tsx هنا
│   │   ├── character-workshop/
│   │   ├── voice-training/
│   │   ├── scene-rehearsal/
│   │   └── ...                   ← أقسام حسب تحليل الملف الضخم
│   └── VoiceCoach.tsx
├── hooks/                        ← بدون تغيير كبير
├── types/
│   ├── index.ts                  ← types فقط
│   └── constants.ts              ← يُنقل إلى lib/ أو config/
├── lib/                          ← جديد — لنقل constants والمنطق
│   └── constants.ts
└── docs/                         ← بدون تغيير
```

**خطوات التنفيذ:**
1. **تفكيك `ActorAiArabicStudio.tsx` (163KB)** — هذا الملف يجب تقسيمه لمكونات أصغر:
   - حلل الملف وحدد الأقسام الوظيفية (tabs, panels, forms)
   - أنشئ مكون لكل قسم في `components/features/`
   - اجعل الملف الأصلي مجرد orchestrator يستورد المكونات الفرعية
   - **كل مكون فرعي ≤ 300 سطر**
2. تحقق: هل `components/ActorAiArabicStudio.tsx` المحلي يُستخدم فعلاً أم أن `page.tsx` يستورد من `@the-copy/actorai`؟ لو لا يُستخدم = حذف
3. فصل `types/constants.ts` — الثوابت تُنقل إلى `lib/constants.ts`، الأنواع تبقى في `types/`
4. إضافة `loading.tsx` و `error.tsx`

---

### قواعد معمارية عامة للمجلدات الثلاثة

#### قاعدة الصفحة الرفيعة (Thin Page)
كل `page.tsx` يجب أن يكون ≤ 50 سطر. مهمته: استيراد + جلب بيانات (اختياري) + عرض مكون واحد.

#### قاعدة `'use client'`
لا تضع `'use client'` إلا لو المكون يستخدم فعلاً: `useState`, `useEffect`, `useRef`, `useContext`, `onClick`, `onChange`, `onSubmit`, أو browser APIs.

#### قاعدة تصنيف المكونات

| يروح `ui/` | يروح `layout/` | يروح `features/` |
|---|---|---|
| بدائي (button, input, card) | header, sidebar, navigation | مرتبط بميزة واحدة |
| لا يعتمد على business logic | يظهر في كل صفحة | يستخدم data خاصة |
| قابل لإعادة الاستخدام | واحد فقط من نوعه | لا يُعاد استخدامه خارج سياقه |

#### قاعدة حجم الملف
- **مكون واحد ≤ 300 سطر.** لو أكبر = يحتاج تفكيك.
- **ملف أنواع ≤ 500 سطر.** لو أكبر = يحتاج تقسيم حسب domain.

#### قاعدة الـ Caching (Next.js 16.2)

| النمط القديم | البديل الجديد |
|---|---|
| `export const revalidate = N` | `"use cache"` + `cacheLife()` |
| `export const dynamic = 'force-static'` | `"use cache"` على الصفحة |
| `export const dynamic = 'force-dynamic'` | احذفه — الافتراضي أصبح dynamic |
| `unstable_cache(fn, keys, opts)` | `"use cache"` + `cacheLife()` + `cacheTag()` |
| `fetch(url, { next: { revalidate } })` | `"use cache"` + `cacheLife()` |

#### قاعدة ملفات UX الإلزامية
كل route يجب أن يحتوي على:
- `loading.tsx` — skeleton UI أثناء التحميل
- `error.tsx` — error boundary مع زر إعادة المحاولة (يجب أن يكون `'use client'`)

---

### تصنيف المخاطر

| العنصر | المخاطرة | السبب |
|---|---|---|
| BREAKAPP `app/layout.tsx` | 🔴 حرج | يتعارض مع root layout — يكسر الـ rendering |
| BREAKAPP هيكل مكرر | 🔴 حرج | `app/` و `src/app/` — ارتباك في الـ routing |
| BREAKAPP ملفات تكوين خاصة | 🟡 متوسط | eslint/postcss/gitignore لا تنتمي هنا |
| actorai-arabic 163KB component | 🟡 متوسط | أداء سيء + صيانة مستحيلة |
| brain-storm-content.tsx في الجذر | 🟢 منخفض | نقل أو حذف بسيط |
| إضافة loading/error files | 🟢 منخفض | إضافة ملفات جديدة فقط |

---

### قائمة التحقق النهائية لكل مجلد

```
□ كل page.tsx ≤ 50 سطر (thin page)
□ لا يوجد ملف > 300 سطر في components/ (ماعدا ضرورة موثقة)
□ كل route يحتوي loading.tsx + error.tsx
□ لا يوجد layout.tsx يعيد تعريف <html> أو <body>
□ لا يوجد ملفات تكوين خاصة (eslint, postcss, .gitignore) داخل مجلد فرعي
□ لا يوجد هياكل مكررة (app/ و src/app/)
□ كل 'use client' مبرر — المكون يستخدم hooks/events فعلاً
□ imports محدثة بعد كل نقل
□ pnpm build ينجح بدون أخطاء
□ MIGRATION_LOG.md محدث بكل قرار
```
