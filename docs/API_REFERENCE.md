# API_REFERENCE

## Scope

هذا المرجع يوثق السطح العام المثبت من:

- مسارات المستخدم في الويب
- واجهات الويب البرمجية تحت `apps/web/src/app/api`
- عائلات واجهات الخلفية في `apps/backend/src/server.ts`
- خرائط التصدير العامة لأهم الحزم المركزية

## Web User Routes

المصدر المرجعي الرئيسي للمسارات المفعّلة هو:

```text
apps/web/src/config/apps.config.ts
```

| Route | Backing implementation | Purpose |
|---|---|---|
| `/` | `apps/web/src/app/page.tsx` | صفحة الهبوط الرئيسية |
| `/ui` | `apps/web/src/app/ui/page.tsx` | مشغّل التطبيقات الشبكي |
| `/apps-overview` | `apps/web/src/app/(main)/apps-overview/page.tsx` | عرض جميع التطبيقات |
| `/breakdown` | `apps/web/src/app/(main)/breakdown/page.tsx` | أداة تحليل السيناريو |
| `/BUDGET` | `apps/web/src/app/(main)/BUDGET/page.tsx` | أداة الميزانية |
| `/editor` | `apps/web/src/app/(main)/editor/page.tsx` | المحرر السينمائي المضمن |
| `/directors-studio` | `apps/web/src/app/(main)/directors-studio/page.tsx` | إدارة المشاريع والمشاهد |
| `/art-director` | `apps/web/src/app/(main)/art-director/page.tsx` | أدوات الديكور والتصميم الفني |
| `/styleIST` | `apps/web/src/app/(main)/styleIST/page.tsx` | أداة الأزياء والتصميم ثلاثي الأبعاد |
| `/actorai-arabic` | `apps/web/src/app/(main)/actorai-arabic/page.tsx` | أدوات تدريب الممثل |
| `/analysis` | `apps/web/src/app/(main)/analysis/page.tsx` | واجهة المحطات السبع |
| `/development` | `apps/web/src/app/(main)/development/page.tsx` | استوديو الكتابة الإبداعية |
| `/brain-storm-ai` | `apps/web/src/app/(main)/brain-storm-ai/page.tsx` | عصف ذهني معتمد على الذكاء الاصطناعي |
| `/brainstorm` | `apps/web/src/app/(main)/brainstorm/page.tsx` | عصف ذهني متعدد الوكلاء |
| `/cinematography-studio` | `apps/web/src/app/(main)/cinematography-studio/page.tsx` | تخطيط وتحليل اللقطات |
| `/BREAKAPP` | `apps/web/src/app/(main)/BREAKAPP/app/page.tsx` أو مساراته الداخلية | إدارة المساعدين والطلبات |

## Web API Routes

| Path | Methods | Behavior | Verified by |
|---|---|---|---|
| `/api/health` | `GET` | فحص صحة محلي بسيط | `apps/web/src/app/api/health/route.ts` |
| `/api/ai/chat` | `POST` | وسيط قديم يمرر الدردشة إلى الخلفية ويعيد تدفقًا نصيًا | `apps/web/src/app/api/ai/chat/route.ts` |
| `/api/analysis/seven-stations` | `GET`, `POST` | وسيط قديم إلى الخلفية لمسار المحطات السبع | `apps/web/src/app/api/analysis/seven-stations/route.ts` |
| `/api/brainstorm` | `POST` | يدير نقاشًا متعدد الوكلاء داخل الويب | `apps/web/src/app/api/brainstorm/route.ts` |
| `/api/breakdown/analyze` | `POST` | يمرر إلى الخلفية عند وجود `BACKEND_URL` أو يستدعي خدمة محلية | `apps/web/src/app/api/breakdown/analyze/route.ts` |
| `/api/budget/export` | `POST` | تصدير مخرجات الميزانية | `apps/web/src/app/api/budget/export/route.ts` |
| `/api/budget/generate` | `POST` | توليد أو تحليل ميزانية | `apps/web/src/app/api/budget/generate/route.ts` |
| `/api/cineai/color-grading` | `POST` | عمليات مرتبطة بتلوين الصورة | `apps/web/src/app/api/cineai/color-grading/route.ts` |
| `/api/cineai/generate-shots` | `POST` | توليد اقتراحات لقطات | `apps/web/src/app/api/cineai/generate-shots/route.ts` |
| `/api/cineai/validate-shot` | `POST` | التحقق من صحة اللقطة المقترحة | `apps/web/src/app/api/cineai/validate-shot/route.ts` |
| `/api/critique/config` | `GET` | يجلب إعدادات النقد من الخلفية باستخدام التوكن | `apps/web/src/app/api/critique/config/route.ts` |
| `/api/critique/config/[taskType]` | `GET` | يجلب إعدادات النقد لنوع مهمة محدد | `apps/web/src/app/api/critique/config/[taskType]/route.ts` |
| `/api/critique/dimensions/[taskType]` | `GET` | يجلب أبعاد النقد لنوع مهمة محدد | `apps/web/src/app/api/critique/dimensions/[taskType]/route.ts` |
| `/api/critique/summary` | `POST` | يمرر طلب تلخيص النقد إلى الخلفية مع `CSRF` | `apps/web/src/app/api/critique/summary/route.ts` |
| `/api/editor` | `POST` | يستدعي `Gemini` مباشرة لأعمال المحرر | `apps/web/src/app/api/editor/route.ts` |
| `/api/gemini` | `POST` | واجهة موحدة لعدة أفعال مثل التصميم والتحسين | `apps/web/src/app/api/gemini/route.ts` |
| `/api/groq-test` | `POST` | مسار تجريبي لمزوّد `Groq` | `apps/web/src/app/api/groq-test/route.ts` |
| `/api/review-screenplay` | `POST` | مراجعة نص سينمائي باستخدام `GoogleGenAI` | `apps/web/src/app/api/review-screenplay/route.ts` |

## Backend API Families

المصدر المرجعي الفعلي هو:

```text
apps/backend/src/server.ts
```

### مسارات عامة أو تشغيلية

| Prefix or path | Methods | Notes |
|---|---|---|
| `/api/health`, `/health`, `/health/*` | `GET` | فحوص صحة متعددة للمراقبة والنشر |
| `/metrics` | `GET` | نقطة مقاييس `Prometheus` |
| `/admin/queues` | حسب الراوتر | لوحة مراقبة الطوابير بعد المصادقة |

### المصادقة

| Prefix or path | Methods | Notes |
|---|---|---|
| `/api/auth/signup` | `POST` | تسجيل مستخدم جديد مع تعيين `CSRF` لاحقًا |
| `/api/auth/login` | `POST` | تسجيل دخول مع تعيين `CSRF` |
| `/api/auth/logout` | `POST` | يتطلب `CSRF` |
| `/api/auth/refresh` | `POST` | يتطلب `CSRF` |
| `/api/auth/me` | `GET` | يتطلب `authMiddleware` |
| `/api/auth/zk-*` | `POST` | مسارات مصادقة معرفية صفريّة |
| `/api/auth/recovery` | `POST` | إدارة قطعة الاسترداد بعد المصادقة |

### التحليل والنقد

| Prefix or path | Methods | Notes |
|---|---|---|
| `/api/analysis/seven-stations` | `POST` | تشغيل المحطات السبع تزامنيًا أو عبر الطابور |
| `/api/analysis/stations-info` | `GET` | وصف ثابت للمحطات السبع |
| `/api/critique/config` | `GET` | إعدادات النقد |
| `/api/critique/config/:taskType` | `GET` | إعدادات النقد حسب نوع المهمة |
| `/api/critique/dimensions/:taskType` | `GET` | أبعاد النقد حسب نوع المهمة |
| `/api/critique/summary` | `POST` | تلخيص النقد ويحتاج `CSRF` |
| `/api/ai/chat` | `POST` | دردشة ذكاء اصطناعي محمية |
| `/api/ai/shot-suggestion` | `POST` | اقتراح لقطات ويحتاج `CSRF` |
| `/api/gemini/cost-summary` | `GET` | ملخص تكلفة استخدام `Gemini` بعد المصادقة |

### إدارة المشاريع والوثائق

| Prefix or path | Methods | Notes |
|---|---|---|
| `/api/projects` | `GET`, `POST` | قائمة المشاريع وإنشاؤها |
| `/api/projects/:id` | `GET`, `PUT`, `DELETE` | قراءة أو تعديل أو حذف مشروع |
| `/api/projects/:id/analyze` | `POST` | تحليل مشروع |
| `/api/projects/:projectId/scenes` | `GET` | جلب مشاهد مشروع |
| `/api/scenes` و `/api/scenes/:id` | `POST`, `GET`, `PUT`, `DELETE` | إدارة المشاهد |
| `/api/projects/:projectId/characters` | `GET` | جلب شخصيات مشروع |
| `/api/characters` و `/api/characters/:id` | `POST`, `GET`, `PUT`, `DELETE` | إدارة الشخصيات |
| `/api/scenes/:sceneId/shots` | `GET` | جلب لقطات مشهد |
| `/api/shots` و `/api/shots/:id` | `POST`, `GET`, `PUT`, `DELETE` | إدارة اللقطات |
| `/api/shots/suggestion` | `POST` | توليد اقتراح لقطة |
| `/api/docs` و `/api/docs/:id` | `GET`, `POST`, `PUT`, `DELETE` | وثائق مشفرة بعد المصادقة |

### الطوابير والمقاييس والحماية

| Prefix or path | Methods | Notes |
|---|---|---|
| `/api/queue/*` | `GET`, `POST` | حالة المهام وإعادة المحاولة وتنظيف الطوابير |
| `/api/metrics/*` | `GET`, `POST` | لقطات المقاييس وتقارير `APM` والكاش |
| `/api/waf/*` | `GET`, `POST`, `PUT` | إحصاءات وحظر وإلغاء حظر وتحديث الإعدادات |

## Backend Access Rules

- جميع المسارات الكتابية في الخلفية تقريبًا تمر بعد:

```text
authMiddleware
csrfProtection
```

- فحوص الصحة والمقاييس العامة هي الاستثناء الواضح.
- الخلفية تطبّق أيضًا:

```text
WAF
Sentry
Prometheus metrics
Origin/Referer validation
```

داخل سلسلة الوسطاء في `server.ts`.

## Workspace Package Exports

### الحزم المرجعية المركزية

| Package | Public entry points | Notes |
|---|---|---|
| `@the-copy/shared` | `.`, `./ai`, `./db`, `./auth`, `./types`, `./schemas`, `./cache`, `./utils` | بنية تحتية وأنواع ومرافق مشتركة |
| `@the-copy/ui` | `.`, `./components/*` | عناصر واجهة أولية ومجالية |
| `@the-copy/directors-studio` | `.` و `./*` | عناصر صفحة المشروع وإدارة المشاهد والشخصيات |
| `@the-copy/budget` | `.` و `./*` | أداة الميزانية ومكوناتها |
| `@the-copy/breakdown` | `.` و `./*` | يصدّر `services`, `hooks`, `components`, `schemas`, `types`, `config` |

### نمط حزم الأدوات

الحزم التالية تعتمد النمط نفسه في ملفات `package.json`:

```text
@the-copy/actorai
@the-copy/art-director
@the-copy/brain-storm-ai
@the-copy/breakapp
@the-copy/breakdown
@the-copy/budget
@the-copy/cinefit
@the-copy/cinematography
@the-copy/creative-writing
@the-copy/directors-studio
@the-copy/editor
@the-copy/prompt-engineering
@the-copy/styleist
```

والخريطة العامة لكل منها هي:

```text
".": "./src/index.ts"
"./*": "./src/*/index.ts"
```

## Compatibility Notes

- بعض واجهات الويب البرمجية تعمل كطبقة توافق أو تمرير مرحلي إلى الخلفية، لذلك لا ينبغي افتراض أن كل منطقها محلي.
- مسار:

```text
apps/backend/src/mcp-server.ts
```

ليس جزءًا من مسارات `Express` الأساسية في `server.ts`، بل عملية منفصلة لها منفذ مستقل.
- المحرر المضمن يملك سطح أدوات خاصًا داخل مساره، لكنه لا يظهر هنا إلا بقدر ما يتصل بالمسار العام:

```text
/editor
```
