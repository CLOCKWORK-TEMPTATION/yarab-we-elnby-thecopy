# Contract: Layer Review Rubric

## Purpose

هذا العقد يربط مراحل المراجعة الإلزامية بالطبقات والنتائج المتوقع استخراجها.

## Ordered Review Stages

| Stage | Scope | Required Output |
|-------|-------|-----------------|
| 0 | تحديد وضع المراجعة والثقة والقيود | `review mode`, `confidence baseline`, `constraints` |
| 1 | `package.json` وسلسلة الأدوات والإعدادات | نتائج `config` و`toolchain` |
| 2 | تشغيل `lint`, `type-check`, `test`, `build` عند الإمكان | سجلات `AutomatedCheckResult` |
| 3 | تفسير نتائج التشغيل بنيويًا | نتائج `toolchain` و`integration` |
| 4 | حدود التطوير والإنتاج ومتغيرات البيئة | نتائج `config`, `security`, `production` |
| 5 | طبقة `server/API` | نتائج `server`, `integration`, `security` |
| 6 | طبقة `shared logic` | نتائج `shared`, `integration`, `performance` |
| 7 | طبقة `frontend` | نتائج `frontend`, `integration`, `performance` |
| 8 | نقاط التكامل بين الطبقات | نتائج `integration` |
| 9 | الأمان والتحقق وقت التشغيل | نتائج `security` |
| 10 | الأداء والجاهزية الإنتاجية | نتائج `performance`, `production` |
| 11 | الدمج النهائي وإزالة التكرار وترتيب الأولويات | نتائج مدمجة مع `mergedFrom` |

## Mandatory Layer Mapping

| Target Type | Required Layers | Forbidden Assumptions |
|-------------|-----------------|-----------------------|
| `web` | `config`, `toolchain`, `frontend`, `integration`, `security`, `performance`, `production` | لا تفترض وجود `server` داخل الهدف نفسه |
| `backend` | `config`, `toolchain`, `server`, `shared`, `integration`, `security`, `performance`, `production` | لا تفترض وجود `frontend` داخل الهدف نفسه |
| `shared-linked` | `config`, `toolchain`, `shared`, `integration`, `security`, `performance`, `production` | لا تفترض واجهة أو واجهة برمجة ما لم يثبت المسار ذلك |

## Merge Rules

1. إذا ظهر السبب الجذري نفسه في أكثر من مرحلة، تسجل نتيجة نهائية واحدة فقط.
2. أي نتيجة مدمجة يجب أن تملأ

```text
mergedFrom
```

بالمراجع الخام التي اندمجت.
3. دمج النتائج لا يجوز أن يخفي أعلى شدة ظهرت داخل السجلات الخام.
4. المرحلة 11 لا تعيد توصيف المشكلة إنشائيًا، بل تنظف التكرار وتحافظ على أثرها الهندسي.
