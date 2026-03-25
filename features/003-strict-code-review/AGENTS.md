# Feature Agents Guide: Strict Engineering Code Review

## Scope

هذا الملف يضبط سياق العمل الخاص بميزة:

```text
003-strict-code-review
```

ولا يستبدل الإرشادات الجذرية في:

```text
E:\yarab we elnby\the copy\AGENTS.md
```

## Governing Inputs

- المرجع الوظيفي:
  `E:\yarab we elnby\the copy\features\003-strict-code-review\sys.md`
- المرجع البحثي:
  `E:\yarab we elnby\the copy\features\003-strict-code-review\research.md`
- المرجع التنفيذي:
  `E:\yarab we elnby\the copy\features\003-strict-code-review\plan.md`
- المرجع الحاكم للمشروع:
  `E:\yarab we elnby\the copy\.Systematize\memory\constitution.md`

## Core Entities

| Entity | Purpose | Core Fields | Validation Rules | Relationships |
|--------|---------|-------------|------------------|---------------|
| Review Request | يمثل الطلب الذي يطلق تدفق المراجعة أو التخطيط | id, branch, source command, requested output | يجب أن يربط بميزة نشطة واحدة فقط | يرتبط بـ Gate Status وReport Artifact |
| Gate Status | يمثل حالة كل بوابة upstream أو validation | gate, status, blocker, evidence path | لا يسمح بحالة جاهزة مع blocker حرج مفتوح | يرتبط بـ Evidence Record |
| Evidence Record | يمثل دليل القراءة أو التشغيل | source type, location, command, result, timestamp | يجب أن يملك مصدرًا محددًا ونتيجة صريحة | يغذي Finding وGate Status |
| Finding | يمثل مشكلة أو خطرًا أو ضعفًا أو تحسينًا | type, severity, layer, location, impact, fix | النوع والشدة إلزاميان ولا يقبلان التكرار المتناقض | يدخل في Report Artifact |
| Report Artifact | يمثل مخرجًا حاكمًا من الدورة الحالية | path, version, status, owner | يجب أن يكون بلا placeholders وغيرامض | يعتمد على Review Request |

## State Transitions

```text
Systematize Ready
  -> Clarification Ready
  -> Constitution Ready
  -> Research Ready
  -> Plan Preliminary
  -> Plan Ready
```

### Transition Rules

- لا ينتقل التدفق إلى
  `Plan Ready`
  إذا بقي blocker حرج في readiness gate.
- أي انتقال يعتمد على دليل ملفي أو تشغيلي موثق، لا على افتراض.
- إذا تعذر أمر حرج، تبقى الحالة انتقالية مع خفض الثقة بدل الإغلاق الوهمي.

## Implementation Guardrails

- هذه الميزة ليست مراجع
  `PR`
  عامًا؛ هي بوابة جاهزية مستودع على مستوى الحوكمة.
- أي إصلاح داخل
  `.Systematize/scripts`
  يجب أن يحافظ على ترتيب
  `systematize -> clarify -> constitution -> research -> plan`
- لا تُنشأ عقود API شكلية إذا لم توجد واجهة خارجية حقيقية.
- يجب أن يبقى
  `update-agent-context`
  مستهلكًا للخطة لا بديلًا عنها.

## Phase 1 Outputs

- `plan.md`
- `quickstart.md`
- `contracts/review-report-contract.md`
- `contracts/workflow-gate-contract.md`
- `contracts/agent-context-contract.md`

## Open Design Notes

- seed الانتقالي داخل الخطة جزء متعمد من هذه الدورة ويجب حذفه لاحقًا فقط بعد
  تثبيت parser الخاص بتحديث سياق الوكيل.
- أي توسيع لاحق إلى مزودات خارجية يحتاج سياسة بيانات معتمدة قبل الدمج.
