# النسخة

`النسخة` مستودع أحادي يجمع منصة ويب عربية للإبداع والإنتاج السينمائي، وخادومًا خلفيًا للتحليل والإدارة والمراقبة، ومجموعة حزم مساحة عمل تعزل منطق الأدوات وواجهاتها القابلة لإعادة الاستخدام. تطبيق الويب يعمل كطبقة العرض والتجميع، بينما يركّز الخادوم الخلفي على المسارات المؤمّنة والحالة الطويلة والطوابير والعمليات التي تحتاج بنية تحتية مستقلة.

## ما المشروع؟

- منصة موحدة لإطلاق مجموعة تطبيقات سينمائية متخصصة من واجهة واحدة.
- تطبيق ويب يقدّم الهبوط، مشغّل الأدوات، صفحات التطبيقات، وواجهات برمجية محلية أو وسيطة.
- خادوم خلفي مستقل يقدّم التحليل، إدارة المشاريع، المقاييس، والطوابير.
- حزم مساحة عمل تحمل منطق الأدوات أو عناصر الواجهة القابلة لإعادة الاستخدام.

## لماذا يوجد؟

- لتجميع أدوات الإنتاج السينمائي العربية تحت نقطة دخول واحدة.
- لفصل منطق الواجهة عن منطق التشغيل الخلفي والمهام الحساسة.
- للسماح بتحميل بعض الأدوات من حزم مستقلة دون فصل تجربة المستخدم.

## المتطلبات

- `Node.js` بإصدار `20` أو أحدث.
- `pnpm` بإصدار `10` أو أحدث.
- ملف إعدادات بيئية مبني على:

```text
.env.example
```

- قاعدة بيانات عبر:

```text
DATABASE_URL
```

مع افتراضي محلي داخل الخلفية.

- خادوم:

```text
Redis
```

للطوابير والتخزين المؤقت عند الحاجة.

## التثبيت

```powershell
pnpm install
Copy-Item .env.example .env
```

إذا شغّلت التطبيقات كلًّا على حدة، انسخ القيم المناسبة أيضًا إلى:

```text
apps/web/.env
apps/backend/.env
```

## التشغيل المحلي

تشغيل الويب والخلفية معًا:

```powershell
pnpm dev
```

تشغيل الويب فقط:

```powershell
pnpm dev:web
```

تشغيل الخلفية فقط:

```powershell
pnpm dev:backend
```

مسارات البدء المساعدة في الجذر موجهة لنظام:

```text
Windows
```

```powershell
pnpm start
pnpm start:fresh
pnpm stop
```

تشغيل:

```text
Redis
```

المضمّن محليًا:

```powershell
pnpm start:redis
```

## أوامر التطوير

| الأمر | الغرض |
|---|---|
| `pnpm lint` | تشغيل التدقيق على مستوى المستودع |
| `pnpm type-check` | فحص الأنواع على مستوى المستودع |
| `pnpm test` | تشغيل الاختبارات المعرفة في التطبيقات والحزم |
| `pnpm build` | بناء المستودع |
| `pnpm ci` | التسلسل الكامل للتحقق والبناء |
| `pnpm --filter @the-copy/web dev` | تشغيل تطبيق الويب مباشرة |
| `pnpm --filter @the-copy/backend dev` | تشغيل الخلفية مباشرة |
| `pnpm --filter @the-copy/backend dev:mcp` | تشغيل خادوم البروتوكول |

## البنية العامة

- تطبيق الويب:

```text
apps/web
```

- الخادوم الخلفي:

```text
apps/backend
```

- الحزم المشتركة:

```text
packages/shared
packages/ui
```

- حزم الأدوات:

```text
packages/actorai
packages/art-director
packages/brain-storm-ai
packages/breakapp
packages/breakdown
packages/budget
packages/cinefit
packages/cinematography
packages/creative-writing
packages/directors-studio
packages/editor
packages/prompt-engineering
packages/styleist
```

## نقاط الدخول

| النمط | نقطة الدخول | الدليل |
|---|---|---|
| بوابة الهبوط | `apps/web/src/app/page.tsx` | يعرض `HeroAnimation` |
| مشغّل التطبيقات | `apps/web/src/app/ui/page.tsx` | يقرأ `apps/web/src/config/apps.config.ts` |
| المسارات الرئيسية | `apps/web/src/app/(main)/layout.tsx` | يضيف الشريط الجانبي والتنقل |
| واجهات الويب البرمجية | `apps/web/src/app/api/**/route.ts` | عائلات المسارات تحت `/api` |
| الخادوم الخلفي | `apps/backend/src/server.ts` | يربط المسارات والوسائط والطوابير |
| خادوم البروتوكول | `apps/backend/src/mcp-server.ts` | يشغل نقطة `/mcp` مستقلة |
| سطح الحزم | `packages/*/src/index.ts` | معرّف عبر `exports` في الحزم |

## الاستخدام الأساسي

1. افتح:

```text
/
```

للوصول إلى الهبوط الرئيسي.

2. انتقل إلى:

```text
/ui
```

لفتح مشغّل التطبيقات.

3. اختر الأداة المناسبة من السجل المرجعي:

```text
apps/web/src/config/apps.config.ts
```

4. عند الحاجة إلى الخلفية، تمر الطلبات عبر:

```text
apps/web/src/app/api
```

أو مباشرة إلى:

```text
apps/backend/src/server.ts
```

بحسب المسار.

## الإعدادات والمتغيرات البيئية

المرجع الأساسي هو:

```text
.env.example
```

أهم المتغيرات:

- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `GEMINI_API_KEY`
- `GOOGLE_GENAI_API_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BACKEND_URL`
- `FILE_IMPORT_PORT`
- `NEXT_PUBLIC_FIREBASE_*`
- `SENTRY_*`

تطبيق الويب يتحقق من البيئة في:

```text
apps/web/src/env.ts
```

والخلفية تتحقق منها في:

```text
apps/backend/src/config/env.ts
```

## الاختبارات والتحقق

- الويب يستخدم:

```text
Vitest
Playwright
Lighthouse
```

كما هو مثبت في:

```text
apps/web/package.json
apps/web/vitest.config.ts
apps/web/playwright.config.ts
```

- الخلفية تستخدم:

```text
Vitest
```

مع عتبات تغطية في:

```text
apps/backend/vitest.config.ts
```

- الحزم المشتركة تعلن عادة:

```text
test
type-check
build
```

داخل كل حزمة.

## هيكل المشروع المختصر

انظر:

```text
docs/_project_tree.txt
```

## الروابط إلى التوثيق التفصيلي

- [المعمارية](docs/ARCHITECTURE.md)
- [علاقات الملفات](docs/FILE_RELATIONS.md)
- [مرجع الواجهات](docs/API_REFERENCE.md)
- [تقدم التوثيق](docs/PROGRESS.md)

## المشاكل الشائعة

- غياب:

```text
GEMINI_API_KEY
```

يعطل المسارات التي تستدعي النماذج مباشرة.

- غياب:

```text
BACKEND_URL
NEXT_PUBLIC_BACKEND_URL
```

يغير سلوك بعض مسارات الويب البرمجية أو يفشل تمرير الطلبات.

- تعطل:

```text
Redis
```

قد يمنع العمال الخلفيين أو مسارات الطوابير.

- مسار المحرر المضمن يطلق خادوم استيراد ملفات على المنفذ:

```text
8787
```

بحسب إعدادات الجذر.

## المساهمة

- حدّث الوثائق الجذرية عندما تتغير نقطة دخول أو حزمة أو مسار أو عقد تصدير.
- أضف أي تغيير معماري مؤثر إلى:

```text
docs/ARCHITECTURE.md
docs/FILE_RELATIONS.md
docs/API_REFERENCE.md
```

## الترخيص

لا يوجد ترخيص موحد مثبت على مستوى الجذر. تطبيق الويب يعلن:

```text
UNLICENSED
```

بينما الخلفية تعلن:

```text
MIT
```

ولذلك يجب التحقق من ترخيص كل تطبيق أو حزمة قبل إعادة الاستخدام الخارجي.
