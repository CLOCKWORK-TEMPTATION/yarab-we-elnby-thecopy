# Feature Agent Context: Platform Multi-Layer Audit

## Mission

هذا الملف يضبط أي وكيل أو منفذ يعمل على ميزة
`Platform Multi-Layer Audit`
داخل هذا المسار:

```text
E:\yarab we elnby\the copy\features\002-audit-platform-apps
```

المطلوب ليس كتابة تقرير انطباعي، بل تثبيت workflow تدقيق يمكن تنفيذه وإعادته
ويحافظ على النطاق والثقة والعقود التنفيذية.

## Canonical Inputs

- `E:\yarab we elnby\the copy\features\002-audit-platform-apps\sys.md`
- `E:\yarab we elnby\the copy\features\002-audit-platform-apps\research.md`
- `E:\yarab we elnby\the copy\features\002-audit-platform-apps\plan.md`
- `E:\yarab we elnby\the copy\.Systematize\memory\constitution.md`

## Entities

| Entity | Required Fields | Relationships | Validation Rules |
|--------|-----------------|---------------|------------------|
| AuditTarget | `path`, `targetType`, `expectedLayers`, `coverageStatus` | يرتبط بنتائج الفحوصات والنتائج النهائية | `path` هو الهوية الوحيدة؛ `coverageStatus` يجب أن يكون قيمة معتمدة فقط |
| AutomatedCheckResult | `checkName`, `scope`, `status`, `directCause`, `confidenceImpact` | يرتبط بجذر المستودع أو بهدف محدد | `checkName` من الأربعيات الرسمية فقط؛ `status` لا يخرج عن `executed / failed / blocked` |
| Finding | `findingId`, `type`, `severity`, `layer`, `location`, `problem`, `evidence`, `impact`, `fix` | قد يدمج أكثر من دليل أو أكثر من هدف | لا تقبل نتيجة بلا إصلاح مقترح وبلا دليل وبلا طبقة واضحة |
| ConfidenceStatement | `reviewMode`, `confidenceLevel`, `executedChecks`, `blockedAreas`, `residualRisk` | يلخص التقرير النهائي كله | يتأثر مباشرة بأي `blocked` أو partial coverage |
| RepairActionGroup | `groupId`, `priority`, `linkedFindings`, `requiredChanges`, `successCriteria` | يبنى من Findings بعد التطبيع | لا يحتوي جداول زمنية؛ الأولوية إلزامية |
| AuditReportEnvelope | `decision`, `topFive`, `criticalIssues`, `coverageRef`, `actionPlanRef` | يجمع جميع الكيانات السابقة | لا يقبل أكثر من حكم تنفيذي واحد أو أكثر من موضع لحالة الثقة |
| TargetScopeClassification | `targetType`, `inspectedLayers`, `blockedLayers`, `outOfScopeLayers`, `notPresentLayers` | يربط الهدف بطبقاته المتوقعة ونتائج التغطية | غياب طبقة غير متوقعة لا يتحول إلى finding |
| LayerSectionBundle | `sectionId`, `title`, `findings`, `coverageNote` | يمثل مقطعًا واحدًا داخل التقرير التنفيذي | يجب أن يحافظ على ترتيب المقاطع التسعة الثابت |

## State Transitions

| Entity | State Flow |
|--------|-----------|
| AuditTarget | `discovered -> scoped -> inspected / blocked / out_of_scope -> reported` |
| AutomatedCheckResult | `planned -> executed / failed / blocked -> interpreted -> reported` |
| Finding | `candidate -> normalized -> merged -> prioritized -> reported` |
| RepairActionGroup | `draft -> triaged -> approved -> tracked` |

## Non-Negotiable Rules

1. النطاق الرسمي هو 15 هدف واجهة و13 هدف خلفية فقط حتى يصدر تغيير معتمد.
2. نجاح أداة واحدة لا يساوي الجاهزية ولا يغلق طبقة الأمن أو التكامل أو الثقة.
3. أي output قد يحتوي أسرارًا أو قيمًا بيئية يجب تلخيصه أو تنقيحه قبل الكتابة.
4. `runtime validation` يبقى طبقة مستقلة ولا يستنتج من TypeScript وحده.
5. أي تعارض بين البحث والخطة أو بين العقود والمخرجات الفعلية يعالج كخلل blocking.
6. هدف الواجهة لا يولد عيوب

```text
server
```

إلا إذا أثبتت الأدلة وجود تبعية حقيقية خارجة عن عقد النطاق.
7. السبب الجذري الواحد يسجل مرة واحدة ويجمع عبر

```text
mergedFrom
```

بدل تكراره في أكثر من مقطع.
8. رفع الثقة إلى

```text
High
```

يتطلب تشغيلًا كاملًا وتغطية كاملة بلا حجب مؤثر.

## Expected Artifacts

- `plan.md`
- `quickstart.md`
- `contracts/audit-report-contract.md`
- `contracts/coverage-registry-contract.md`
- `contracts/check-execution-contract.md`
- `contracts/finding-record-contract.md`
- `contracts/confidence-policy-contract.md`
- `contracts/heterogeneous-scope-rules.md`
- `contracts/dry-run-evidence.md`
- `checklists/execution-readiness.md`

## Delivery Standard

أي تغيير يعتبر مقبولًا فقط إذا حافظ على:

- سجل تغطية كامل بلا أهداف orphaned
- تطبيع النتائج بلا تكرار للعلة نفسها
- حكم ثقة صريح
- مسار تغيير موثق داخل الخطة

