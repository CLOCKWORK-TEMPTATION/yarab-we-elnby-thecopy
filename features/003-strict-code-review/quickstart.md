# Quickstart: Strict Engineering Code Review

## Purpose

هذا الدليل يهيئ تشغيل مسار
review runtime
المنفذ فعليًا داخل الميزة:

```text
003-strict-code-review
```

ويساعد على التحقق السريع من أن التقرير التنفيذي الجديد والعقود والبوابات الحاكمة
قابلة للاستهلاك.

## Prerequisites

- Node.js بإصدار:
  `>=18`
- PowerShell بإصدار:
  `7+`
- التواجد داخل جذر المستودع:
  `E:\yarab we elnby\the copy`
- تفعيل الفرع:
  `003-strict-code-review`

## First Run

نفذ الأوامر التالية من جذر المستودع:

```text
node .Systematize/scripts/node/cli.mjs feature-status --json
node --test .Systematize/scripts/node/tests/review-foundations.test.mjs
node --test .Systematize/scripts/node/tests/review-us2-us3.test.mjs
node --test .Systematize/scripts/node/tests/setup-review.test.mjs
node --test .Systematize/scripts/node/tests/review-runtime-contracts.test.mjs
node .Systematize/scripts/node/cli.mjs setup-review --json
node .Systematize/scripts/node/cli.mjs setup-review --validate-existing --json
```

## Expected Success Signals

- يظهر
  `feature-status`
  أن الميزة في مرحلة
  `implementation`
  مع تقدم فعلي داخل
  `tasks.md`
- تنجح اختبارات
  `review-foundations`
  و
  `review-us2-us3`
  و
  `setup-review`
  و
  `review-runtime-contracts`
- يُولد
  `E:\yarab we elnby\the copy\features\003-strict-code-review\review.md`
  بالأقسام التنفيذية الستة ومن دون placeholders.
- ينجح
  `setup-review --validate-existing --json`
  ويعيد حكمًا تنفيذيًا حتميًا.

## Known Blockers

- `verify-contracts`
  يفشل حاليًا لأن طبقة الوثائق الحاكمة الجذرية غير مكتملة، ويبدأ التعذر من:
  `E:\yarab we elnby\the copy\docs\PACKAGE_BOUNDARY.md`
- التقرير الحي على هذا المستودع يعيد حاليًا:
  `🔴 CHANGES REQUIRED`
  بسبب أسرار متعقبة وحدود تشغيل غير موثقة ومخاطر تحقق وقت التشغيل.

## Next Step

إذا أغلقت المعوقات ونجحت مسارات التحقق:

```text
/syskit.review
```

أما إذا بقي أي blocker حرج مفتوح، فيجب إغلاقه أولًا ثم إعادة التحقق.
