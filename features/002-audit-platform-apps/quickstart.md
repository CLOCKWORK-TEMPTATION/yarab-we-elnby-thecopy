# Quickstart: Platform Multi-Layer Audit

## الهدف

هذا الدليل يجهز المنفذ للعمل على ميزة
`Platform Multi-Layer Audit`
بأقل عدد من الخطوات، مع الحفاظ على البوابات الحاكمة قبل أي تعديل.

## المتطلبات

- Node.js 20.x
- pnpm 10.x
- PowerShell 7.x
- الفرع الحالي:

```text
002-audit-platform-apps
```

## الملفات المرجعية التي يجب قراءتها أولًا

```text
E:\yarab we elnby\the copy\features\002-audit-platform-apps\sys.md
E:\yarab we elnby\the copy\features\002-audit-platform-apps\research.md
E:\yarab we elnby\the copy\features\002-audit-platform-apps\plan.md
E:\yarab we elnby\the copy\.Systematize\memory\constitution.md
```

## أول تشغيل

1. ثبّت الاعتماديات من الجذر:

```powershell
pnpm install
```

2. تأكد أن بوابة الدستور والبحث مكتملة:

```powershell
pwsh -File .Systematize/scripts/powershell/setup-plan.ps1 -Json
```

3. حدّث سياق الوكيل بعد أي تغيير معتبر في الخطة:

```powershell
pwsh -File .Systematize/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

4. قبل تعديل السكربتات، راجع العقود:

```text
E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts
```

5. قبل إصدار أي حكم نهائي، صنّف وضع المراجعة من العقد التالي:

```text
E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\confidence-policy-contract.md
```

6. وعند العمل على هدف غير متجانس، ارجع إلى القواعد التالية:

```text
E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\heterogeneous-scope-rules.md
```

## ترتيب التنفيذ المقصود

1. إصلاح تعارض بوابة البحث والخطة.
2. تثبيت عقد التغطية الرسمي للأهداف 28.
3. شد عقد نتائج الفحوصات الآلية.
4. شد عقد النتائج النهائية والتطبيع والثقة.
5. تشغيل اختبارات التنفيذ قبل التحويل إلى

```text
/syskit.tasks
```

## أوضاع المراجعة الرسمية

| الوضع | متى يستخدم | أثره على الثقة |
|-------|------------|----------------|
| `Static Analysis Only` | عندما لا يمكن تنفيذ الفحوصات الآلية أو تكون جميعها محجوبة | الثقة تكون `Low` |
| `Partial Execution Review` | عندما تنفذ بعض الفحوصات أو تكون التغطية جزئية | الثقة تكون `Medium` في الحد الأدنى |
| `Full Execution Review` | عندما تنفذ الفحوصات الأربعة ويغطى النطاق الرسمي بلا حجب مؤثر | الثقة يمكن أن تكون `High` |

## قواعد النطاق غير المتجانس

- هدف الواجهة لا يُدان بغياب طبقة `server`.
- هدف الخلفية لا يُدان بغياب طبقة `frontend`.
- غياب الطبقة غير المتوقعة يسجل `out_of_scope`.
- غياب طبقة متوقعة أو هدف رسمي بلا أدلة كافية يسجل `not_present` مع تفسير صريح.

## ما الذي يجب أن تراه قبل المتابعة

- ملف

```text
plan.md
```

مكتمل بلا placeholders

- عقود داخل

```text
contracts
```

تحدد شكل التقرير والتغطية والنتائج

- تحديث سياق الوكيل بنجاح

## ملاحظات تشغيل

- لا تضع أسرارًا أو قيمًا بيئية داخل العقود أو المخرجات.
- لا توسع النطاق خارج الأهداف المحددة إلا عبر تغيير معتمد في الخطة.
- إذا تعذر تشغيل فحص ما، سجّل الأثر على الثقة بدل إخفائه.
- إذا كانت التغطية جزئية، لا ترفع الحكم إلى `High` حتى لو نجحت الأداة نفسها.

