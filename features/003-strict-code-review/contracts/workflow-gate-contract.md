# Workflow Gate Contract

## Purpose

هذا العقد يضبط ترتيب البوابات الحاكمة التي يجب أن تمر بها الميزة قبل التنفيذ.

## Required Order

```text
/syskit.systematize
-> /syskit.clarify
-> /syskit.constitution
-> /syskit.research
-> /syskit.plan
-> /syskit.tasks
```

## Command Expectations

| Command | Required Behavior |
|---------|-------------------|
| `check-prerequisites --json` | يعيد مسارات الميزة والوثائق المتاحة من دون فرض `plan.md` قبل مرحلة التخطيط |
| `setup-research --json` | يرفض البحث إذا كان الدستور غير مكتمل، ويقبل عند اكتماله الفعلي |
| `setup-plan --json` | يولد `plan.md` كاملًا من القالب الحاكم لا من preset fragment منفرد |
| `feature-status --json` | يعكس المرحلة الحقيقية للميزة والخطوة التالية المتوقعة |
| `setup-review --json` | يولد `review.md` كاملًا بالأقسام التنفيذية الستة ويشتق حكمًا تنفيذيًا حتميًا |
| `setup-review --validate-existing --json` | يرفض التقرير إذا بقيت placeholders أو غاب سطر `**Verdict**` |

## Success Rules

- لا تنتقل البوابة التالية قبل اكتمال البوابة الحالية.
- يجب أن تكون رسائل الفشل سببية لا شكلية.
- يجب أن تطابق البوابات ترتيب workflow الموثق لا ترتيبًا مستنتجًا من وجود ملف
  لاحق فقط.

## Regression Targets

- منع اشتراط
  `plan.md`
  قبل
  `research.md`
- منع فشل كاذب في اكتمال الدستور بسبب عنوان حرفي هش.
- منع توليد خطة ناقصة عند تفعيل preset عالي الأولوية.

## Current Known Violations to Fix

1. `verify-contracts`
   ما زال يفشل لأن طبقة الوثائق الحاكمة الجذرية غير مكتملة، ويبدأ التعذر حاليًا من
   `docs/PACKAGE_BOUNDARY.md`
2. تقرير
   `setup-review --json`
   على المستودع الحالي ما زال يعيد
   `CHANGES REQUIRED`
   بسبب مشكلات حقيقية مفتوحة في الأمن وحدود التشغيل.
