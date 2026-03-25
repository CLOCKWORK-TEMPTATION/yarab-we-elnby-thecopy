# Strict Engineering Review Report

**Branch**: `003-strict-code-review`
**Date**: 2026-03-23
**Reviewer**: Codex
**Artifacts Reviewed**: sys.md, plan.md, tasks.md

## Executive Summary
**Verdict**: 🔴 CHANGES REQUIRED
**Review Mode**: Full Execution Review
**Confidence**: High
**Executive Judgment**: غير مستقر ويحتاج تثبيت فوري

هذه المراجعة تعتمد على أدلة بنيوية وتشغيلية من المستودع الحالي وتعرض الحقيقة الهندسية كما هي ضمن حدود ما أمكن تشغيله فعليًا.
القرار التنفيذي يجب أن يُقرأ مع التغطية الفعلية ومع الموانع أو الطبقات غير المقيمة بالكامل.

أخطر خمس مشكلات:
1. Tracked source appears to contain a hardcoded secret or token.
2. build failed because a runtime dependency or import target is missing.
3. lint failed because a runtime dependency or import target is missing.
4. Server request handling appears to lack explicit runtime validation.
5. test failed because a runtime dependency or import target is missing.

## Critical Issues Table
| ID | الشدة | النوع | الطبقة | الموقع | الوصف | الأثر | الإصلاح |
|----|-------|-------|--------|--------|-------|-------|---------|
| FD-SR-001 | حرج | خطأ مؤكد | security | E:\yarab we elnby\the copy\.npmrc | Tracked source appears to contain a hardcoded secret or token. | Sensitive credentials may leak through source control or generated artifacts. | Remove the hardcoded secret, rotate the credential, and load it from a protected runtime configuration source. |
| FD-P1-004 | عالٍ | خطأ مؤكد | toolchain | pnpm run build | build failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |
| FD-P1-001 | عالٍ | خطأ مؤكد | toolchain | pnpm run lint | lint failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |
| FD-SS-001 | عالٍ | خطر محتمل | server | E:\yarab we elnby\the copy\apps\api\chatbot\route.ts | Server request handling appears to lack explicit runtime validation. | Invalid runtime inputs may cross the transport boundary and break downstream contracts. | Introduce explicit runtime validation for request inputs and response shaping in the affected handler. |
| FD-P1-003 | عالٍ | خطأ مؤكد | toolchain | pnpm run test | test failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |
| FD-SR-002 | عالٍ | خطر محتمل | security | E:\yarab we elnby\the copy\.env | Tracked environment assumptions exist without a sanitized example contract. | Runtime secrets or local assumptions may drift invisibly across environments. | Track only sanitized examples and document the required runtime variables explicitly. |
| FD-P1-002 | عالٍ | خطأ مؤكد | toolchain | pnpm run type-check | type-check failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |

## Layer-by-Layer Findings

### package.json and toolchain
| ID | الشدة | النوع | الطبقة | الموقع | الوصف | الأثر | الإصلاح |
|----|-------|-------|--------|--------|-------|-------|---------|
| FD-P1-004 | عالٍ | خطأ مؤكد | toolchain | pnpm run build | build failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |
| FD-P1-001 | عالٍ | خطأ مؤكد | toolchain | pnpm run lint | lint failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |
| FD-P1-003 | عالٍ | خطأ مؤكد | toolchain | pnpm run test | test failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |
| FD-P1-002 | عالٍ | خطأ مؤكد | toolchain | pnpm run type-check | type-check failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |

### automated checks
| الفحص | السكربت | الحالة | الأمر |
|------|---------|--------|-------|
| lint | lint | failure | pnpm run lint |
| type-check | type-check | failure | pnpm run type-check |
| test | test | failure | pnpm run test |
| build | build | failure | pnpm run build |

| ID | الشدة | النوع | الطبقة | الموقع | الوصف | الأثر | الإصلاح |
|----|-------|-------|--------|--------|-------|-------|---------|
| FD-P1-004 | عالٍ | خطأ مؤكد | toolchain | pnpm run build | build failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |
| FD-P1-001 | عالٍ | خطأ مؤكد | toolchain | pnpm run lint | lint failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |
| FD-P1-003 | عالٍ | خطأ مؤكد | toolchain | pnpm run test | test failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |
| FD-P1-002 | عالٍ | خطأ مؤكد | toolchain | pnpm run type-check | type-check failed because a runtime dependency or import target is missing. | The validation chain is broken structurally rather than failing on business logic alone. | Restore the missing import target or dependency and rerun the affected command. |

### dev vs production boundaries
لا توجد نتائج مسجلة ضمن حدود الأدلة الحالية.

### server and API
| ID | الشدة | النوع | الطبقة | الموقع | الوصف | الأثر | الإصلاح |
|----|-------|-------|--------|--------|-------|-------|---------|
| FD-SS-001 | عالٍ | خطر محتمل | server | E:\yarab we elnby\the copy\apps\api\chatbot\route.ts | Server request handling appears to lack explicit runtime validation. | Invalid runtime inputs may cross the transport boundary and break downstream contracts. | Introduce explicit runtime validation for request inputs and response shaping in the affected handler. |

### shared logic
| ID | الشدة | النوع | الطبقة | الموقع | الوصف | الأثر | الإصلاح |
|----|-------|-------|--------|--------|-------|-------|---------|
| FD-SS-002 | متوسط | ضعف تصميمي | shared | E:\yarab we elnby\the copy\apps\web\src\ai\ai-team-brainstorming.ts \| E:\yarab we elnby\the copy\apps\web\src\ai\gemini-core.ts \| E:\yarab we elnby\the copy\apps\web\src\ai\gemini-service.ts \| E:\yarab we elnby\the copy\apps\web\src\app\(auth)\login\page.tsx \| E:\yarab we elnby\the copy\apps\web\src\app\(auth)\register\page.tsx | Shared logic uses the any type. | Type contracts may drift silently across layers that depend on this shared module. | Replace any with narrower types or schema-backed parsing at the shared boundary. |

### frontend
لا توجد نتائج مسجلة ضمن حدود الأدلة الحالية.

### frontend-backend integration
لا توجد نتائج مسجلة ضمن حدود الأدلة الحالية.

### security
| ID | الشدة | النوع | الطبقة | الموقع | الوصف | الأثر | الإصلاح |
|----|-------|-------|--------|--------|-------|-------|---------|
| FD-SR-001 | حرج | خطأ مؤكد | security | E:\yarab we elnby\the copy\.npmrc | Tracked source appears to contain a hardcoded secret or token. | Sensitive credentials may leak through source control or generated artifacts. | Remove the hardcoded secret, rotate the credential, and load it from a protected runtime configuration source. |
| FD-SR-002 | عالٍ | خطر محتمل | security | E:\yarab we elnby\the copy\.env | Tracked environment assumptions exist without a sanitized example contract. | Runtime secrets or local assumptions may drift invisibly across environments. | Track only sanitized examples and document the required runtime variables explicitly. |

### performance and production readiness
لا توجد نتائج مسجلة ضمن حدود الأدلة الحالية.

## Confidence and Coverage
- ما تم فحصه: package.json، sys.md، plan.md، tasks.md
- ما تم تشغيله: pnpm run lint | pnpm run type-check | pnpm run test | pnpm run build
- ما تعذر تشغيله: لا يوجد.
- ما لم يتوفر: لا يوجد.
- الطبقات غير المقيمة بالكامل: لا يوجد.
- أثر ذلك على الثقة: لا توجد فجوات تغطية تقلل الثقة ضمن الأدلة الحالية.

## Repair Priority Map
### يجب إصلاحه فورًا
- FD-SR-001: Tracked source appears to contain a hardcoded secret or token. — Remove the hardcoded secret, rotate the credential, and load it from a protected runtime configuration source.

### يجب إصلاحه قبل أي ميزة جديدة
- FD-P1-001: lint failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command.
- FD-P1-002: type-check failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command.
- FD-P1-003: test failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command.
- FD-P1-004: build failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command.
- FD-SS-001: Server request handling appears to lack explicit runtime validation. — Introduce explicit runtime validation for request inputs and response shaping in the affected handler.
- FD-SR-002: Tracked environment assumptions exist without a sanitized example contract. — Track only sanitized examples and document the required runtime variables explicitly.

### يمكن تأجيله
- FD-SS-002: Shared logic uses the any type. — Replace any with narrower types or schema-backed parsing at the shared boundary.

### تحسينات اختيارية
لا توجد عناصر في هذه الفئة.

## Action Plan
### المرحلة 1: إيقاف النزيف
- الهدف: إزالة الانهيارات والبوابات الحرجة التي تمنع الحكم الموثوق.
- النطاق: - Tracked source appears to contain a hardcoded secret or token. — Remove the hardcoded secret, rotate the credential, and load it from a protected runtime configuration source.
- التغييرات المطلوبة: - Tracked source appears to contain a hardcoded secret or token. — Remove the hardcoded secret, rotate the credential, and load it from a protected runtime configuration source.
- معيار النجاح: لا تبقى أخطاء حرجة تمنع التشغيل أو تسرب أسرار أو كسرًا أساسيًا في الأدوات.

### المرحلة 2: تثبيت العقود وحدود الطبقات
- الهدف: إغلاق مخاطر العقود والحدود بين الطبقات والخدمات.
- النطاق: - lint failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command. | - type-check failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command. | - test failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command. | - build failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command. | - Server request handling appears to lack explicit runtime validation. — Introduce explicit runtime validation for request inputs and response shaping in the affected handler. | - Tracked environment assumptions exist without a sanitized example contract. — Track only sanitized examples and document the required runtime variables explicitly.
- التغييرات المطلوبة: - lint failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command. | - type-check failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command. | - test failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command. | - build failed because a runtime dependency or import target is missing. — Restore the missing import target or dependency and rerun the affected command. | - Server request handling appears to lack explicit runtime validation. — Introduce explicit runtime validation for request inputs and response shaping in the affected handler. | - Tracked environment assumptions exist without a sanitized example contract. — Track only sanitized examples and document the required runtime variables explicitly.
- معيار النجاح: تستقر العقود الرئيسية ولا تبقى حدود طبقية هشة أو غير موثقة.

### المرحلة 3: تنظيف المنطق المشترك
- الهدف: تقليل التكرار والرخاوة في الطبقات المشتركة.
- النطاق: - Shared logic uses the any type. — Replace any with narrower types or schema-backed parsing at the shared boundary.
- التغييرات المطلوبة: - Shared logic uses the any type. — Replace any with narrower types or schema-backed parsing at the shared boundary.
- معيار النجاح: تنخفض الرخاوة في المنطق المشترك وتصبح العقود أوضح للصيانة.

### المرحلة 4: ضبط الواجهة والتكامل
- الهدف: منع الفشل الصامت وتثبيت عقود التكامل وتجربة الحالات الحدية.
- النطاق: لا توجد عناصر مرشحة حاليًا.
- التغييرات المطلوبة: لا توجد تغييرات إضافية مطلوبة في هذه المرحلة ضمن الأدلة الحالية.
- معيار النجاح: تظهر أخطاء التكامل والحالات الحدية بصورة صريحة ويمكن التحقق منها.

### المرحلة 5: رفع الجاهزية الإنتاجية
- الهدف: تثبيت المراقبة والجاهزية والأمن التشغيلي قبل الاعتماد.
- النطاق: - Tracked source appears to contain a hardcoded secret or token. — Remove the hardcoded secret, rotate the credential, and load it from a protected runtime configuration source. | - Tracked environment assumptions exist without a sanitized example contract. — Track only sanitized examples and document the required runtime variables explicitly.
- التغييرات المطلوبة: - Tracked source appears to contain a hardcoded secret or token. — Remove the hardcoded secret, rotate the credential, and load it from a protected runtime configuration source. | - Tracked environment assumptions exist without a sanitized example contract. — Track only sanitized examples and document the required runtime variables explicitly.
- معيار النجاح: تتحسن الجاهزية التشغيلية ولا تبقى مخاطر إنتاجية كبيرة غير مغطاة.
