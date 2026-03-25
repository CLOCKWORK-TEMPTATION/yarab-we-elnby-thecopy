---

description: "Task list for the Platform Multi-Layer Audit feature — atomic, traceable, layer-typed"
---

# Tasks: Platform Multi-Layer Audit

**Input**:
`E:\yarab we elnby\the copy\features\002-audit-platform-apps\plan.md`

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\sys.md`

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\research.md`

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\AGENTS.md`

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\`

**Prerequisites**:
`plan.md`

`sys.md`

**Project Type**:
حوكمة وأدوات مراجعة متعددة الطبقات داخل مستودع

`Next.js + React + TypeScript + Node.js`

وليس تطبيق واجهة أو خدمة أعمال جديدة، لذلك لا توجد مهام

`Frontend`

أو

`Backend`

في هذا التفكيك.

---

## Task ID Convention

| Layer | Prefix | Example |
|-------|--------|---------|
| 🗄️ Backend | `BE-T-` | BE-T-001 |
| 🎨 Frontend | `FE-T-` | FE-T-001 |
| 🔧 DevOps | `DO-T-` | DO-T-001 |
| 🔗 Cross-Cutting | `CC-T-` | CC-T-001 |

## Quick Reference Checklist

- [x] DO-T-001 — إصلاح منطق التحقق المسبق لمرحلة البحث وما قبل الخطة
- [x] DO-T-002 — إضافة تغطية انحدار لبوابات سير العمل والهجرة بين جذور الميزة
- [x] CC-T-001 — تثبيت خط أساس التغطية ونتائج الفحوصات الآلية في عقود الميزة
- [x] DO-T-003 — إنشاء سجل أهداف المراجعة وكتالوج الفحوصات في مسار Node
- [x] DO-T-004 — إنشاء سجل أهداف المراجعة وكتالوج الفحوصات في مسار PowerShell
- [x] CC-T-002 — توثيق مصفوفة المراجعة الطبقية وقواعد دمج النتائج
- [x] DO-T-005 — بناء محول نتائج الفحوصات ودمج النتائج في مسار Node
- [x] DO-T-006 — بناء محول نتائج الفحوصات ودمج النتائج في مسار PowerShell
- [x] CC-T-003 — تحويل قالب التقرير التنفيذي إلى العقد النهائي المطلوب
- [x] DO-T-007 — بناء مجمع تقرير المراجعة التنفيذي في مسار Node
- [x] DO-T-008 — بناء مجمع تقرير المراجعة التنفيذي في مسار PowerShell
- [x] DO-T-009 — تطبيق سياسة خفض الثقة للحالات المحجوبة في مسار Node
- [x] DO-T-010 — تطبيق سياسة خفض الثقة للحالات المحجوبة في مسار PowerShell
- [x] CC-T-004 — توثيق سياسة الحجب وخفض الثقة للمشغّل
- [x] DO-T-011 — إضافة مصنف النطاق غير المتجانس للويب والخلفية والمنطق المشترك في Node
- [x] DO-T-012 — إضافة مصنف النطاق غير المتجانس للويب والخلفية والمنطق المشترك في PowerShell
- [x] CC-T-005 — توثيق قواعد الطبقات المفقودة ودمج السبب الجذري
- [x] DO-T-013 — توسيع فحص العقود والحوكمة للسطح الجديد
- [x] CC-T-006 — تنفيذ تحقق الجاهزية النهائي وتسجيل أدلة التشغيل الجاف

---

## Execution Summary

| Layer | Task Count | Total Estimate | Parallel Opportunities |
|-------|-----------|----------------|------------------------|
| 🗄️ Backend | 0 | 0 hours | 0 tasks |
| 🎨 Frontend | 0 | 0 hours | 0 tasks |
| 🔧 DevOps | 13 | 45 hours | 10 tasks |
| 🔗 Cross-Cutting | 6 | 17 hours | 2 tasks |
| **Total** | **19** | **62 hours** | **12 tasks** |

| Phase | Task Count | Total Estimate |
|-------|-----------|----------------|
| Setup | 2 | 5 hours |
| Foundation | 6 | 22 hours |
| User Story 1 (P1) | 3 | 11 hours |
| User Story 2 (P1) | 3 | 9 hours |
| User Story 3 (P2) | 3 | 10 hours |
| Polish | 2 | 5 hours |
| **Total** | **19** | **62 hours** |

---

## Phase 1: Setup

**Purpose**:
إزالة انسداد البوابة الذي يمنع تسلسل

`/syskit.constitution -> /syskit.research -> /syskit.plan`

من العمل كما هو معرّف في الوثائق.

**Milestone**:
`MS1`

### DO-T-001 — إصلاح منطق التحقق المسبق لمرحلة البحث وما قبل الخطة

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Source** | `research.md §12`, `plan.md §8`, `sys.md FR-001`, `sys.md FR-002`, `sys.md NFR-003` |
| **Depends On** | None |
| **Parallel** | No |
| **Story** | Setup |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
تعديل ملفات التحقق المسبق

`E:\yarab we elnby\the copy\.Systematize\scripts\powershell\check-prerequisites.ps1`

و

`E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\check-prerequisites.mjs`

بحيث تميّز بين وضع

`paths-only`

ووضع ما قبل

`plan.md`

ووضع ما قبل

`tasks.md`

من دون كسر مخرجات

`JSON`

الحالية، ومعيار القبول أن يصبح تنفيذ مرحلة البحث ممكناً قبل وجود الخطة مع الحفاظ على حراسة مرحلة التنفيذ الفعلية.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\check-prerequisites.ps1`
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\check-prerequisites.mjs`

**Acceptance Criteria:**
- [ ] استدعاء مرحلة البحث لا يفشل بسبب غياب `plan.md`
- [ ] استدعاء مرحلة التنفيذ مع `--require-tasks` يبقى حاجزًا أمام غياب `tasks.md`
- [ ] بنية JSON تبقى متوافقة مع المستهلكين الحاليين
- [ ] رسائل الفشل تشير بوضوح إلى المرحلة الصحيحة التالية

**Risks / Attention Points:**
- كسر توافق الاستدعاءات القديمة سيعطّل أوامر لاحقة في السلسلة

**Technical Notes:**
- حافظ على التكافؤ السلوكي بين مساري `PowerShell` و`Node`

---

### DO-T-002 — إضافة تغطية انحدار لبوابات سير العمل والهجرة بين جذور الميزة

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Source** | `plan.md §9`, `research.md §11.6`, `sys.md AC-001`, `sys.md AC-004` |
| **Depends On** | `DO-T-001` |
| **Parallel** | No |
| **Story** | Setup |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
توسيع اختبار البوابات في الملف

`E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\workflow-gates.test.mjs`

ليغطي تسلسل

`constitution -> research -> plan -> tasks`

بعد إصلاح التحقق المسبق، ومعيار القبول أن يفشل الاختبار عند عودة التناقض وأن يغطي المسارين

`Node`

و

`PowerShell`

داخل نفس الحزمة.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\workflow-gates.test.mjs`

**Acceptance Criteria:**
- [ ] يوجد سيناريو صريح يثبت أن `/syskit.research` لا يحتاج `plan.md`
- [ ] توجد تغطية صريحة لمسار `PowerShell` ومسار `Node`
- [ ] الاختبار يفشل عند إعادة فرض ترتيب غير صحيح للبوابات

**Risks / Attention Points:**
- ضعف التغطية هنا سيجعل عودة التناقض ممكنة دون إنذار

**Technical Notes:**
- أبقِ الاختبارات معزولة داخل مستودع مؤقت كما يفعل الملف الحالي

---

## Phase 2: Foundation

**Purpose**:
تثبيت السجل الرسمي للأهداف والفحوصات وقواعد القراءة والدمج قبل أي إخراج تنفيذي.

**Milestone**:
`MS1`

**Independent Test**:
بعد اكتمال هذه المرحلة يجب أن تتوافر عقود واضحة لـ

`28`

هدفًا و

`4`

فحوصات، مع وحدات مساعدة متكافئة في

`Node`

و

`PowerShell`

وقواعد موحدة لتصنيف النتائج ودمجها.

### CC-T-001 — تثبيت خط أساس التغطية ونتائج الفحوصات الآلية في عقود الميزة

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Source** | `sys.md FR-002`, `sys.md FR-004`, `sys.md NFR-002`, `research.md §12` |
| **Depends On** | `DO-T-002` |
| **Parallel** | No |
| **Story** | Foundation |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
تحديث عقدي

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\coverage-registry-contract.md`

و

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\check-execution-contract.md`

لتثبيت خط أساس الأهداف الثمانية والعشرين، وتسميات

`partial frontend coverage`

وحالات

`blockedReason`

و

`confidenceImpact`

بصورة قابلة للتنفيذ، ومعيار القبول أن تصبح العقود كافية لتغذية السجل البرمجي بلا افتراضات شفوية.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\coverage-registry-contract.md`
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\check-execution-contract.md`

**Acceptance Criteria:**
- [ ] العقد يذكر بوضوح أن عدد الأهداف المطلوب تغطيتها هو 28
- [ ] العقد يميز بين `executed` و`failed` و`blocked` من دون تداخل
- [ ] أمثلة `confidenceImpact` تغطي غياب البيئة وتضييق التغطية وفشل الأداة
- [ ] لا توجد ألفاظ عامة من نوع "يغطي الواجهة" من دون حدود دقيقة

**Risks / Attention Points:**
- أي غموض في العقود هنا سيتحوّل إلى تضارب بين التنفيذ والتقرير النهائي

**Technical Notes:**
- لا تُدخل تفاصيل تنفيذية تخص إطار عمل بعينه داخل تعريف العقد

---

### DO-T-003 — إنشاء سجل أهداف المراجعة وكتالوج الفحوصات في مسار Node

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 4 hours |
| **Source** | `plan.md §3`, `plan.md §8`, `sys.md FR-002`, `sys.md FR-004`, `AGENTS.md §Core Entities` |
| **Depends On** | `CC-T-001` |
| **Parallel** | Yes |
| **Story** | Foundation |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
إنشاء سجل أهداف المراجعة وكتالوج الفحوصات داخل

`E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\audit-target-registry.mjs`

و

`E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\check-catalog.mjs`

بحيث يعرّف كل هدف بمساره ونوعه وطبقاته المتوقعة وكل فحص باسمه ونطاقه، ومعيار القبول أن يستطيع أي مستهلك استيراد هذه البيانات مباشرة دون إعادة ترميزها في أكثر من مكان.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\audit-target-registry.mjs`
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\check-catalog.mjs`

**Acceptance Criteria:**
- [ ] السجل يعرّف جميع المسارات الـ 28 المطلوبة في `sys.md`
- [ ] كل هدف يحتوي `targetType` و`expectedLayers` ومرجع مسار كامل
- [ ] كتالوج الفحوصات يحتوي `lint` و`type-check` و`test` و`build`
- [ ] لا توجد ثوابت مكررة لنفس المسار أو الفحص داخل ملفات أخرى

**Risks / Attention Points:**
- تكرار السجل في أكثر من ملف سيعيد خطر الانحراف بين المسارين

**Technical Notes:**
- صمّم الصادرات لتُستهلك لاحقًا من المحوّلات وبناة التقرير

---

### DO-T-004 — إنشاء سجل أهداف المراجعة وكتالوج الفحوصات في مسار PowerShell

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 4 hours |
| **Source** | `plan.md §3`, `plan.md §8`, `sys.md FR-002`, `sys.md FR-004`, `AGENTS.md §Core Entities` |
| **Depends On** | `CC-T-001` |
| **Parallel** | Yes |
| **Story** | Foundation |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
إنشاء سجل أهداف المراجعة وكتالوج الفحوصات داخل

`E:\yarab we elnby\the copy\.Systematize\scripts\powershell\audit-target-registry.ps1`

و

`E:\yarab we elnby\the copy\.Systematize\scripts\powershell\check-catalog.ps1`

بنفس حقول وتعريفات مسار

`Node`

ومعيار القبول أن تكون نتائج البناء من المسارين قابلة للمقارنة بندًا بندًا.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\audit-target-registry.ps1`
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\check-catalog.ps1`

**Acceptance Criteria:**
- [ ] تعريفات الأهداف والفحوصات متطابقة دلاليًا مع مسار `Node`
- [ ] كل دالة ترجع كائنات تحتوي الحقول المتفق عليها في العقد
- [ ] لا يعتمد الملف على مسارات نسبية مبهمة داخل التنفيذ

**Risks / Attention Points:**
- أي فرق دلالي بين المسارين سيكسر حياد التقرير التنفيذي

**Technical Notes:**
- استخدم مخرجات يمكن تحويلها مباشرة إلى `PSCustomObject`

---

### CC-T-002 — توثيق مصفوفة المراجعة الطبقية وقواعد دمج النتائج

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Source** | `sys.md FR-003..FR-013`, `sys.md BR-002`, `sys.md BR-005`, `plan.md §5` |
| **Depends On** | `CC-T-001` |
| **Parallel** | Yes |
| **Story** | Foundation |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
إنشاء مصفوفة مراجعة طبقية في

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\layer-review-rubric.md`

وتحديث

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\finding-record-contract.md`

بحيث تغطي المراحل من فحص

`package.json`

حتى الجاهزية الإنتاجية وقواعد دمج السبب الجذري، ومعيار القبول أن يصبح لكل نتيجة حقول إلزامية قابلة للربط بطبقة محددة.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\layer-review-rubric.md`
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\finding-record-contract.md`

**Acceptance Criteria:**
- [ ] المصوفة تغطي المراحل 1 إلى 11 بالترتيب الإلزامي
- [ ] العقد يفرض الحقول `type`, `severity`, `layer`, `location`, `problem`, `evidence`, `impact`, `fix`, `mergedFrom`
- [ ] قواعد الدمج تمنع تكرار السبب الجذري نفسه عبر أكثر من قسم
- [ ] تمييز `خطأ مؤكد` و`خطر محتمل` و`ضعف تصميمي` و`تحسين مقترح` موثّق بلا التباس

**Risks / Attention Points:**
- ضعف هذه المصوفة سيؤدي إلى تقرير إنشائي غير قابل للتحويل إلى خطة إصلاح

**Technical Notes:**
- اجعل قواعد الدمج مستقلة عن لغة البرمجة لتخدم المسارين معًا

---

### DO-T-005 — بناء محول نتائج الفحوصات ودمج النتائج في مسار Node

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 4 hours |
| **Source** | `sys.md FR-004`, `sys.md FR-005`, `sys.md FR-013`, `plan.md §9`, `research.md RK-009` |
| **Depends On** | `DO-T-003`, `CC-T-002` |
| **Parallel** | Yes |
| **Story** | Foundation |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
إنشاء محول نتائج الفحوصات في

`E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\check-results-normalizer.mjs`

ومحوّل دمج النتائج في

`E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\finding-normalizer.mjs`

لتحويل المخرجات الخام إلى سجلات

`AutomatedCheckResult`

و

`Finding`

مطابقة للعقود، ومعيار القبول أن يُصنّف كل فحص بوضوح وأن تُدمج النتائج المتقاطعة في سجل واحد قابل للتتبع.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\check-results-normalizer.mjs`
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\finding-normalizer.mjs`

**Acceptance Criteria:**
- [ ] التحويل يخرج `executed`, `failed`, `blocked` فقط
- [ ] كل سجل نتيجة يحمل `directCause`, `confidenceImpact`, `outputRef`
- [ ] نتائج متشابهة عبر طبقات مختلفة تُدمج في سجل واحد مع `mergedFrom`
- [ ] لا يُعامل نجاح أداة واحدة كحكم سلامة نهائي

**Risks / Attention Points:**
- الدمج الخاطئ قد يخفي خللًا فعليًا أو يضاعف حجم التقرير بلا داع

**Technical Notes:**
- افصل بين تحويل النتيجة الخام ومنطق دمج النتائج لتسهيل التحقق

---

### DO-T-006 — بناء محول نتائج الفحوصات ودمج النتائج في مسار PowerShell

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 4 hours |
| **Source** | `sys.md FR-004`, `sys.md FR-005`, `sys.md FR-013`, `plan.md §9`, `research.md RK-009` |
| **Depends On** | `DO-T-004`, `CC-T-002` |
| **Parallel** | Yes |
| **Story** | Foundation |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
إنشاء محول نتائج الفحوصات في

`E:\yarab we elnby\the copy\.Systematize\scripts\powershell\check-results-normalizer.ps1`

ومحول دمج النتائج في

`E:\yarab we elnby\the copy\.Systematize\scripts\powershell\finding-normalizer.ps1`

بنفس الحقول والمخرجات المتفق عليها في مسار

`Node`

ومعيار القبول أن تكون سجلات النتائج الناتجة قابلة للمقارنة مباشرًة بين المسارين.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\check-results-normalizer.ps1`
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\finding-normalizer.ps1`

**Acceptance Criteria:**
- [ ] الدوال تنتج سجلات متوافقة دلاليًا مع عقد النتيجة وعقد الفحوصات
- [ ] الحقول الإلزامية لا تسقط عند حالات `blocked`
- [ ] منطق دمج السبب الجذري يراعي `mergedFrom` ولا يفقد موقع الأدلة

**Risks / Attention Points:**
- فقدان حقل واحد في هذا المسار سيجعل التقرير مختلفًا حسب بيئة التشغيل

**Technical Notes:**
- أبقِ أسماء الحقول مطابقة للمسار الآخر حرفيًا حيثما أمكن

---

## Phase 3: User Story 1 — مراجعة ما قبل أي تطوير جديد (Priority: P1)

**Goal**:
إنتاج قالب وتجميع تقرير تنفيذي كامل يصلح لقرار الاستمرار أو الإيقاف قبل أي ميزة جديدة.

**Source**:
`sys.md Scenario 1`, `sys.md FR-001`, `sys.md FR-003..FR-014`

**Independent Test**:
عند تمرير عينة هدف ويب وعينة هدف خلفية عبر مجمع التقرير، يجب أن يخرج تقرير يحتوي الأقسام الستة المطلوبة، وجدول القضايا الحرجة، وخطة إصلاح من خمس مراحل دون أقسام ناقصة أو ترتيب خاطئ.

**Milestone**:
`MS2`

### CC-T-003 — تحويل قالب التقرير التنفيذي إلى العقد النهائي المطلوب

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Source** | `sys.md FR-014`, `plan.md §5`, `plan.md §13`, `contracts/audit-report-contract.md` |
| **Depends On** | `CC-T-002` |
| **Parallel** | Yes |
| **Story** | US1 |
| **Milestone** | MS2 |
| **Owner** | Unassigned |

**Description:**
تحديث ملف القالب

`E:\yarab we elnby\the copy\.Systematize\templates\review-template.md`

وملف العقد

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\audit-report-contract.md`

ليصبحا مطابقين لترتيب التقرير التنفيذي المطلوب، ومعيار القبول أن تصبح الأقسام الستة الإلزامية وخطة الإصلاح ذات المراحل الخمس هي الهيكل الوحيد المسموح به.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\templates\review-template.md`
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\audit-report-contract.md`

**Acceptance Criteria:**
- [ ] القالب يحتوي `Executive Summary`
- [ ] القالب يحتوي `Critical Issues Table`
- [ ] القالب يحتوي `Layer-by-Layer Findings`
- [ ] القالب يحتوي `Confidence and Coverage`
- [ ] القالب يحتوي `Repair Priority Map`
- [ ] القالب يحتوي `Action Plan`
- [ ] لا تبقى أقسام مراجعة عامة للقوالب أو الوثائق لا تخدم التقرير التنفيذي المطلوب

**Risks / Attention Points:**
- إبقاء القالب العام الحالي سيولّد مخرجات لا تطابق عقد الميزة

**Technical Notes:**
- حافظ على القالب مختصرًا بما يكفي للاستخدام اليومي ولكن حاكمًا في الهيكل

---

### DO-T-007 — بناء مجمع تقرير المراجعة التنفيذي في مسار Node

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 4 hours |
| **Source** | `sys.md FR-001`, `sys.md FR-003..FR-012`, `sys.md FR-014`, `plan.md §5`, `plan.md §9` |
| **Depends On** | `DO-T-005`, `CC-T-003` |
| **Parallel** | Yes |
| **Story** | US1 |
| **Milestone** | MS2 |
| **Owner** | Unassigned |

**Description:**
إنشاء مجمع التقرير التنفيذي في

`E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\audit-report-builder.mjs`

ومولد بيان الثقة في

`E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\confidence-statement-builder.mjs`

ليحوّل سجلات الأهداف والفحوصات والنتائج إلى تقرير تنفيذي كامل، ومعيار القبول أن يتم توليد الأقسام الستة المطلوبة مع ترتيب ثابت وربط واضح بالأدلة.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\audit-report-builder.mjs`
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\confidence-statement-builder.mjs`

**Acceptance Criteria:**
- [ ] مخرجات البناء تتضمن أقسام العقد الستة بالترتيب
- [ ] كل نتيجة تشير إلى طبقة وموقع وأثر وإصلاح
- [ ] بيان الثقة يذكر ما الذي تم تشغيله وما الذي تعذر تقييمه
- [ ] التقرير يصلح لحالة `Full Execution Review` وحالة `Partial Execution Review`

**Risks / Attention Points:**
- بناء التقرير قبل تثبيت العقد سيؤدي إلى مخرجات يصعب مراجعتها آليًا

**Technical Notes:**
- اجعل المجمع يقبل بيانات محوّلة، لا مخرجات خام من الأوامر

---

### DO-T-008 — بناء مجمع تقرير المراجعة التنفيذي في مسار PowerShell

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 4 hours |
| **Source** | `sys.md FR-001`, `sys.md FR-003..FR-012`, `sys.md FR-014`, `plan.md §5`, `plan.md §9` |
| **Depends On** | `DO-T-006`, `CC-T-003` |
| **Parallel** | Yes |
| **Story** | US1 |
| **Milestone** | MS2 |
| **Owner** | Unassigned |

**Description:**
إنشاء مجمع التقرير التنفيذي في

`E:\yarab we elnby\the copy\.Systematize\scripts\powershell\audit-report-builder.ps1`

ومولد بيان الثقة في

`E:\yarab we elnby\the copy\.Systematize\scripts\powershell\confidence-statement-builder.ps1`

بنفس هيكل مسار

`Node`

ومعيار القبول أن يصبح توليد التقرير قابلاً للتكرار من كلا بيئتي التشغيل دون اختلاف في الهيكل أو الحقول.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\audit-report-builder.ps1`
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\confidence-statement-builder.ps1`

**Acceptance Criteria:**
- [ ] التقرير الناتج يطابق ترتيب أقسام العقد
- [ ] بيانات الثقة والتغطية تظهر بالصياغة نفسها دلاليًا
- [ ] الحقول الحرجة لا تختلف بين التنفيذين إلا في تفاصيل البيئة

**Risks / Attention Points:**
- الاختلاف بين التنفيذين سيضعف الثقة في النتائج عند تبدل بيئة التشغيل

**Technical Notes:**
- افصل التوليد النصي عن منطق تجميع النتائج حيثما أمكن

---

## Phase 4: User Story 2 — مراجعة مع فشل أو غياب فحوصات آلية (Priority: P1)

**Goal**:
ضمان أن المراجعة لا تنهار عند الفشل أو النقص، بل تتحول إلى تقرير صريح في الثقة والتغطية.

**Source**:
`sys.md Scenario 2`, `sys.md FR-004`, `sys.md FR-005`, `sys.md FR-011`, `sys.md NFR-003`

**Independent Test**:
عند تعطيل أحد الفحوصات أو غياب متغير بيئة، يجب أن يستمر البناء إلى تقرير نهائي مع تمييز `blocked` أو `failed`، وبيان ثقة منخفض أو متوسط حسب الحالة، من دون إخفاء السبب.

**Milestone**:
`MS3`

### DO-T-009 — تطبيق سياسة خفض الثقة للحالات المحجوبة في مسار Node

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P1 |
| **Estimate** | 4 hours |
| **Source** | `research.md §12`, `sys.md FR-001`, `sys.md FR-004`, `sys.md FR-005`, `sys.md FR-011`, `sys.md NFR-003` |
| **Depends On** | `DO-T-007` |
| **Parallel** | Yes |
| **Story** | US2 |
| **Milestone** | MS3 |
| **Owner** | Unassigned |

**Description:**
إنشاء سياسة خفض الثقة في

`E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\confidence-policy.mjs`

وإضافة اختبارها في

`E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\confidence-policy.test.mjs`

بحيث تربط بين حالات الحجب وغياب البيئة وتضييق التغطية ومستوى الثقة، ومعيار القبول أن يصبح لكل حالة سبب صريح وتأثير محدد على الثقة.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\confidence-policy.mjs`
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\confidence-policy.test.mjs`

**Acceptance Criteria:**
- [ ] السياسة تفرّق بين `Low`, `Medium`, `High`
- [ ] غياب البيئة أو حجب الفحص يخفض الثقة مع تفسير نصي واضح
- [ ] تضييق تغطية الواجهة يُخفض الثقة ولا يُعامل كمرور كامل
- [ ] الاختبار يغطي ثلاث حالات على الأقل: blocked, missing env, partial coverage

**Risks / Attention Points:**
- المبالغة في الثقة أخطر من الفشل الصريح في هذا النوع من المراجعات

**Technical Notes:**
- اجعل السياسة قابلة لإعادة الاستخدام داخل مجمع التقرير

---

### DO-T-010 — تطبيق سياسة خفض الثقة للحالات المحجوبة في مسار PowerShell

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P1 |
| **Estimate** | 3 hours |
| **Source** | `research.md §12`, `sys.md FR-001`, `sys.md FR-004`, `sys.md FR-005`, `sys.md FR-011`, `sys.md NFR-003` |
| **Depends On** | `DO-T-008` |
| **Parallel** | Yes |
| **Story** | US2 |
| **Milestone** | MS3 |
| **Owner** | Unassigned |

**Description:**
إنشاء سياسة خفض الثقة في

`E:\yarab we elnby\the copy\.Systematize\scripts\powershell\confidence-policy.ps1`

بحيث تطبق قواعد الحجب وغياب البيئة وتضييق التغطية نفسها المعتمدة في مسار

`Node`

ومعيار القبول أن تصبح قرارات الثقة متسقة بين البيئتين.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\confidence-policy.ps1`

**Acceptance Criteria:**
- [ ] الدوال تعيد درجة ثقة وسببًا نصيًا واضحًا
- [ ] الحالات الثلاث الأساسية موجودة: blocked, missing env, partial coverage
- [ ] السلوك متوافق دلاليًا مع مسار `Node`

**Risks / Attention Points:**
- غياب هذا التكافؤ سيخلق تقريرين مختلفين لنفس الأدلة

**Technical Notes:**
- لا تضع منطق الثقة داخل باني التقرير مباشرة

---

### CC-T-004 — توثيق سياسة الحجب وخفض الثقة للمشغّل

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P1 |
| **Estimate** | 2 hours |
| **Source** | `research.md §12`, `plan.md §9`, `sys.md FR-001`, `sys.md FR-004`, `sys.md FR-005` |
| **Depends On** | `DO-T-009`, `DO-T-010` |
| **Parallel** | No |
| **Story** | US2 |
| **Milestone** | MS3 |
| **Owner** | Unassigned |

**Description:**
تحديث دليل التشغيل

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\quickstart.md`

وإنشاء عقد السياسة في

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\confidence-policy-contract.md`

لتوثيق متى تكون المراجعة

`Static Analysis Only`

أو

`Partial Execution Review`

أو

`Full Execution Review`

ومعيار القبول أن يستطيع المشغل تصنيف حالة المراجعة من دون اجتهاد شخصي.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\quickstart.md`
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\confidence-policy-contract.md`

**Acceptance Criteria:**
- [ ] الدليل يشرح متى تنخفض الثقة ولماذا
- [ ] العقد يربط كل سبب حجب بدرجة ثقة متوقعة
- [ ] لا توجد صياغات عامة من نوع "الثقة جيدة" من دون سبب قابل للتحقق

**Risks / Attention Points:**
- غياب التوثيق التشغيلي سيعيد الغموض حتى لو كان الكود صحيحًا

**Technical Notes:**
- اجعل الأمثلة مرتبطة بالأهداف الفعلية في المنصة لا بحالات تجريبية عامة

---

## Phase 5: User Story 3 — مراجعة تطبيقات متعددة ذات بنى غير متجانسة (Priority: P2)

**Goal**:
التعامل الصحيح مع أهداف ويب وخلفية ومنطق مشترك وإعدادات سطحية من دون اعتبار غياب الطبقة نفسها خطأً تلقائيًا.

**Source**:
`sys.md Scenario 3`, `sys.md FR-006..FR-013`, `sys.md BR-003`, `sys.md BR-005`

**Independent Test**:
عند تمرير هدف واجهة فقط وهدف خلفية فقط وهدف منطق مشترك، يجب أن يصنف النظام الطبقات المتوقعة والمفقودة بدقة، وأن يخرج السبب الجذري مرة واحدة حتى لو ظهر في أكثر من مقطع.

**Milestone**:
`MS4`

### DO-T-011 — إضافة مصنف النطاق غير المتجانس للويب والخلفية والمنطق المشترك في Node

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P2 |
| **Estimate** | 4 hours |
| **Source** | `sys.md FR-006`, `sys.md FR-007`, `sys.md FR-008`, `sys.md FR-009`, `sys.md FR-010`, `sys.md FR-012`, `sys.md BR-003` |
| **Depends On** | `DO-T-003`, `CC-T-002` |
| **Parallel** | Yes |
| **Story** | US3 |
| **Milestone** | MS4 |
| **Owner** | Unassigned |

**Description:**
إنشاء مصنف النطاق غير المتجانس في

`E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\target-scope-classifier.mjs`

مع اختبار له في

`E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\target-scope-classifier.test.mjs`

ليحدد الطبقات المتوقعة لكل هدف ويحوّل الطبقات غير الموجودة إلى

`not_present`

أو

`out_of_scope`

بدل اعتبارها عيبًا، ومعيار القبول أن تُفصل قواعد الويب والخلفية والمنطق المشترك بوضوح.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\target-scope-classifier.mjs`
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\target-scope-classifier.test.mjs`

**Acceptance Criteria:**
- [ ] أهداف الواجهة فقط لا تُسجَّل ضدها عيوب `server/API`
- [ ] أهداف الخلفية فقط لا تُسجَّل ضدها عيوب `frontend`
- [ ] أهداف المنطق المشترك تُراجع ضمن `shared logic` و`integration` عند اللزوم فقط
- [ ] الاختبار يغطي ثلاثة أنواع أهداف على الأقل

**Risks / Attention Points:**
- التصنيف الخاطئ هنا سيفسد مصداقية التقرير على مستوى الطبقات

**Technical Notes:**
- استخدم الحقول `targetType` و`expectedLayers` من سجل الأهداف بدل التخمين من اسم المسار

---

### DO-T-012 — إضافة مصنف النطاق غير المتجانس للويب والخلفية والمنطق المشترك في PowerShell

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P2 |
| **Estimate** | 3 hours |
| **Source** | `sys.md FR-006`, `sys.md FR-007`, `sys.md FR-008`, `sys.md FR-009`, `sys.md FR-010`, `sys.md FR-012`, `sys.md BR-003` |
| **Depends On** | `DO-T-004`, `CC-T-002` |
| **Parallel** | Yes |
| **Story** | US3 |
| **Milestone** | MS4 |
| **Owner** | Unassigned |

**Description:**
إنشاء مصنف النطاق غير المتجانس في

`E:\yarab we elnby\the copy\.Systematize\scripts\powershell\target-scope-classifier.ps1`

ليطبق قواعد التصنيف نفسها المعتمدة في مسار

`Node`

ومعيار القبول أن تنتج بيئتا التشغيل الحالة نفسها لكل هدف من أهداف المنصة.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\target-scope-classifier.ps1`

**Acceptance Criteria:**
- [ ] التصنيف يخرج `inspected`, `blocked`, `out_of_scope`, `not_present` عند الحاجة
- [ ] غياب طبقة غير متوقعة لا يُسجل كعيب
- [ ] السلوك متوافق مع أمثلة مسار `Node`

**Risks / Attention Points:**
- تناقض التصنيف بين المسارين سيؤدي إلى اختلاف في شدة النتائج وترتيبها

**Technical Notes:**
- أعد استخدام السجل البرمجي للأهداف بدل إدخال جداول يدوية ثانية

---

### CC-T-005 — توثيق قواعد الطبقات المفقودة ودمج السبب الجذري

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P2 |
| **Estimate** | 3 hours |
| **Source** | `sys.md Scenario 3`, `sys.md FR-013`, `sys.md BR-003`, `sys.md BR-005`, `AGENTS.md` |
| **Depends On** | `DO-T-011`, `DO-T-012` |
| **Parallel** | No |
| **Story** | US3 |
| **Milestone** | MS4 |
| **Owner** | Unassigned |

**Description:**
تحديث ملف السياق

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\AGENTS.md`

وإنشاء قواعد النطاق غير المتجانس في

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\heterogeneous-scope-rules.md`

لتوثيق متى يكون غياب الطبقة طبيعيًا ومتى يُدمج السبب الجذري في نتيجة واحدة، ومعيار القبول أن يملك المشغل والسكربت المصدر نفسه للحكم في الحالات المختلطة.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\AGENTS.md`
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\heterogeneous-scope-rules.md`

**Acceptance Criteria:**
- [ ] القواعد توضح صراحة أن غياب الطبقة غير الموجودة أصلًا ليس عيبًا
- [ ] قواعد الدمج تفرض تسجيل السبب الجذري مرة واحدة
- [ ] التوثيق يربط الكيانات الستة بسير التقرير والتنفيذ

**Risks / Attention Points:**
- التوثيق الناقص هنا سيعيد تضارب التصنيف بين المراجع البشري والمحوّل البرمجي

**Technical Notes:**
- اجعل أمثلة الدمج مرتبطة بحالات تكامل فعلية بين الواجهة والخلفية والمنطق المشترك

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**:
إقفال سطح العقود والتحقق النهائي وتسجيل أدلة الجاهزية.

**Milestone**:
`MS5`

### DO-T-013 — توسيع فحص العقود والحوكمة للسطح الجديد

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P1 |
| **Estimate** | 2 hours |
| **Source** | `plan.md §12`, `plan.md §15`, `sys.md NFR-005`, `contracts/*` |
| **Depends On** | `DO-T-002`, `CC-T-003`, `CC-T-004`, `CC-T-005` |
| **Parallel** | No |
| **Story** | Polish |
| **Milestone** | MS5 |
| **Owner** | Unassigned |

**Description:**
توسيع ملف التحقق

`E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\verify-contracts.mjs`

ليتحقق من وجود العقود الجديدة والقالب التنفيذي الجديد وعدم عودة العبارات أو الهياكل المخالفة، ومعيار القبول أن يفشل التحقق فور حذف قسم إلزامي أو عقد جديد أو إعادة صياغة قديمة.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\verify-contracts.mjs`

**Acceptance Criteria:**
- [ ] التحقق يرصد غياب `confidence-policy-contract.md`
- [ ] التحقق يرصد غياب `heterogeneous-scope-rules.md`
- [ ] التحقق يرصد رجوع قالب التقرير إلى بنية لا تطابق العقد النهائي
- [ ] التحقق يبقى قابلاً للتشغيل من دون الاعتماد على حالة محلية خاصة

**Risks / Attention Points:**
- إهمال هذا التحقق سيجعل العقود تتآكل مع التعديلات اللاحقة

**Technical Notes:**
- تجنب فحوصًا هشة تعتمد على مسافات أو ترتيب أسطر غير جوهري

---

### CC-T-006 — تنفيذ تحقق الجاهزية النهائي وتسجيل أدلة التشغيل الجاف

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P1 |
| **Estimate** | 3 hours |
| **Source** | `plan.md §9`, `plan.md §15`, `sys.md AC-001..AC-014`, `research.md §12` |
| **Depends On** | `DO-T-013` |
| **Parallel** | No |
| **Story** | Polish |
| **Milestone** | MS5 |
| **Owner** | Unassigned |

**Description:**
إنشاء سجل جاهزية نهائي في

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\checklists\execution-readiness.md`

وتسجيل أدلة التشغيل الجاف في

`E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\dry-run-evidence.md`

بحيث يثبت المرور على الأهداف الـ 28، والفحوصات الأربعة، وبيان الثقة، والأخطار المفتوحة، ومعيار القبول أن يصبح الانتقال إلى التنفيذ أو التسليم مبنيًا على أدلة مسجلة لا على الانطباع.

**Expected Outputs:**
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\checklists\execution-readiness.md`
- [ ] `E:\yarab we elnby\the copy\features\002-audit-platform-apps\contracts\dry-run-evidence.md`

**Acceptance Criteria:**
- [ ] السجل يذكر صراحة عدد الأهداف التي تمت مراجعتها وعدد الأهداف المحجوبة
- [ ] السجل يذكر ما الذي شُغّل فعليًا وما الذي تعذر تشغيله
- [ ] السجل يربط الأدلة بالمعايير التنفيذية في `plan.md`
- [ ] أي مانع متبقٍ يظهر كبند صريح لا كتلميح داخل السرد

**Risks / Attention Points:**
- تخطي هذا السجل سيُضعف قرار الجاهزية النهائي وسيجعل الحالة غير قابلة للمراجعة لاحقًا

**Technical Notes:**
- استخدم نفس مصطلحات العقود حتى لا ينشأ قاموس ثانٍ للمخرجات

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: يبدأ فورًا لأنه يزيل انسداد سير العمل.
- **Foundation**: يعتمد على اكتمال Setup بالكامل لأنه يحدد السجل والعقود والمحوّلات.
- **User Story 1**: يبدأ بعد Foundation لأنه يحتاج سجلات وفحوصات ودمجًا ثابتًا.
- **User Story 2**: يبدأ بعد اكتمال مجمع التقرير في User Story 1.
- **User Story 3**: يبدأ بعد تثبيت السجل وقواعد الدمج، ويمكن تنفيذه بالتوازي مع User Story 2 بعد Foundation إذا توفرت السعة.
- **Polish**: يبدأ بعد اكتمال قصص الاستخدام المطلوبة وقواعد العقود.

### User Story Dependencies

- **User Story 1 (P1)**: يعتمد على Foundation فقط، وهو نواة الـ MVP.
- **User Story 2 (P1)**: يعتمد على User Story 1 لأن سياسة الثقة تحتاج مجمع التقرير القابل للعرض.
- **User Story 3 (P2)**: يعتمد على Foundation مباشرة، لكنه يجب أن ينتهي قبل الإقفال النهائي لأن قواعده تدخل في التقرير والعقود.

### Within-Phase Order

- **Setup**: `DO-T-001` ثم `DO-T-002`
- **Foundation**: `CC-T-001` ثم `DO-T-003` و`DO-T-004` و`CC-T-002` ثم `DO-T-005` و`DO-T-006`
- **User Story 1**: `CC-T-003` ثم `DO-T-007` و`DO-T-008`
- **User Story 2**: `DO-T-009` و`DO-T-010` ثم `CC-T-004`
- **User Story 3**: `DO-T-011` و`DO-T-012` ثم `CC-T-005`
- **Polish**: `DO-T-013` ثم `CC-T-006`

### Parallel Opportunities

- بعد `CC-T-001` يمكن تنفيذ `DO-T-003` و`DO-T-004` و`CC-T-002` بالتوازي.
- بعد `CC-T-002` يمكن تنفيذ `DO-T-005` و`DO-T-006` بالتوازي بمجرد جاهزية السجل الخاص بكل مسار.
- بعد `CC-T-003` يمكن تنفيذ `DO-T-007` و`DO-T-008` بالتوازي.
- بعد اكتمال User Story 1 يمكن تنفيذ `DO-T-009` و`DO-T-010` بالتوازي.
- بعد Foundation يمكن تنفيذ `DO-T-011` و`DO-T-012` بالتوازي دون انتظار User Story 2.

---

## Milestone Mapping

| Milestone | Phase | Tasks | Total Estimate |
|-----------|-------|-------|----------------|
| `MS1` Scope Baseline | Setup + Foundation | `DO-T-001`, `DO-T-002`, `CC-T-001`, `DO-T-003`, `DO-T-004`, `CC-T-002`, `DO-T-005`, `DO-T-006` | 27 hours |
| `MS2` Automated Evidence | User Story 1 | `CC-T-003`, `DO-T-007`, `DO-T-008` | 11 hours |
| `MS3` Layer Audit | User Story 2 | `DO-T-009`, `DO-T-010`, `CC-T-004` | 9 hours |
| `MS4` Normalization | User Story 3 | `DO-T-011`, `DO-T-012`, `CC-T-005` | 10 hours |
| `MS5` Executive Report | Polish | `DO-T-013`, `CC-T-006` | 5 hours |

---

## Implementation Strategy

### MVP First

1. أكمل Setup
2. أكمل Foundation
3. أكمل User Story 1
4. نفّذ تحققًا مستقلاً يثبت توليد التقرير التنفيذي الكامل
5. أوقف الإضافة الوظيفية حتى تُراجع النتيجة على عينة أهداف حقيقية

### Incremental Delivery

1. ثبّت السجل والعقود أولًا
2. أطلق التقرير التنفيذي الأساسي
3. أضف سياسة الحجب وخفض الثقة
4. أضف دعم البنى غير المتجانسة
5. أغلق السطح بعقود تحقق وتشغيل جاف موثق

### Parallel Team Strategy

1. منفذ أول: Setup + Foundation العقود والسجلات
2. منفذ ثانٍ: مسار `Node`
3. منفذ ثالث: مسار `PowerShell`
4. بعد ذلك يلتقي الجميع عند `CC-T-004`, `CC-T-005`, `DO-T-013`, `CC-T-006`

---

## Post-Generation Review

### Duplication Check
- [x] No two tasks produce the same file
- [x] No semantic duplicates

### Orphan Check
- [x] Every task has a source
- [x] Every task has at least one expected output
- [x] No orphan tasks remain except the first setup task and the last polish task

### Estimate Sanity Check
- [x] No task exceeds 4 hours
- [x] Total estimate is realistic for a medium governance workflow
- [x] Layer distribution matches the project type

### Testability Check
- [x] Every acceptance criterion is testable
- [x] Every user story has an independent test description

### Traceability Check
- [x] Every task traces to a source in `plan.md` or `sys.md`
- [x] Every `FR-001` through `FR-014` is covered by at least one task
- [x] Every key entity from `AGENTS.md` is represented through registry, normalization, reporting, or readiness tasks

---

## Tasks Quality Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Every task has a unique layer-prefixed ID | ☑ |
| 2 | Every task has a tangible output | ☑ |
| 3 | Every task has a time estimate not exceeding 4 hours | ☑ |
| 4 | Dependencies are clearly defined | ☑ |
| 5 | Acceptance criteria are testable | ☑ |
| 6 | Tasks are ordered by priority and execution flow | ☑ |
| 7 | No duplicate tasks remain | ☑ |
| 8 | Every task traces to a source in plan or sys | ☑ |
| 9 | Risks or attention points are documented where relevant | ☑ |
| 10 | Layer summary totals are calculated | ☑ |
| 11 | Milestone mapping is complete | ☑ |
| 12 | Post-generation review completed | ☑ |

---

## Notes

- الـ MVP المقترح هو: Setup + Foundation + User Story 1
- لا توجد مهام `Backend` أو `Frontend` لأن ناتج الميزة الحالي يغيّر الحوكمة والأدوات والعقود فقط
- تعتمد جاهزية التنفيذ على إبقاء التكافؤ بين مساري `Node` و`PowerShell`
- أي انحراف بين العقود والسجلات والقالب التنفيذي يجب أن يُعامل كمانع قبل الإقفال

---

## Changelog

| التاريخ | الإصدار | التغيير | المؤلف |
|---------|---------|---------|--------|
| 2026-03-18 | 1.0 | إنشاء قائمة المهام الذرية وربطها بالخطة والنظام | Codex |
| 2026-03-18 | 1.1 | إكمال موجات التقرير والثقة والنطاق غير المتجانس والتحقق النهائي | Codex |

