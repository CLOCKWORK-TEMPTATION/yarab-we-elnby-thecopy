# Tasks: Strict Engineering Code Review

**Input**: Design documents from
`E:\yarab we elnby\the copy\features\003-strict-code-review\`

**Prerequisites**: `plan.md` و`sys.md` مطلوبان، وتم استخدام
`research.md`
و
`AGENTS.md`
و
`contracts/`
و
`quickstart.md`

**Tests**: هذه الميزة تتضمن مهام تحقق صريحة لأن
`plan.md §8`
يفرض مسار
validation & regression
ولأن readiness الحالية متوقفة على نجاح هذه المسارات.

**Organization**: المهام مرتبة حسب القصص ومراحل التأسيس حتى تبقى كل زيادة
قابلة للتنفيذ والاختبار والاستلام استقلاليًا.

---

## Quick Reference Checklist

- [x] DO-T-001 — مواءمة سطح أمر المراجعة وعقد الامتداد
- [x] DO-T-002 — إصلاح توليد الخطة الكاملة داخل مسار `setup-plan`
- [x] DO-T-003 — إصلاح دلالات البوابات المسبقة قبل مرحلة `plan`
- [x] BE-T-001 — إنشاء سياق طلب المراجعة وحالة البوابات
- [x] BE-T-002 — إنشاء مخططات الدليل والنتيجة
- [x] CC-T-001 — إنشاء المرجع المعماري الجذري وربطه بطبقة المراجع
- [x] DO-T-004 — تقوية محلل تحديث سياق الوكيل ضد اختلاف تنسيق الخطة
- [x] BE-T-003 — إنشاء ماسح جرد المستودع والطبقات المكتشفة
- [x] BE-T-004 — إنشاء وحدة تدقيق الأدوات والإعدادات
- [x] BE-T-005 — إنشاء مشغل الفحوصات الآلية الأساسية
- [x] CC-T-002 — إنشاء مولد الملخص التنفيذي وأخطر المشكلات
- [x] BE-T-006 — إنشاء منسق القصة الأولى لمراجعة ما قبل التطوير
- [x] BE-T-007 — إنشاء نموذج الثقة المنخفضة عند التعذر الجزئي
- [x] BE-T-008 — إنشاء وحدة تدقيق حدود التطوير والإنتاج
- [x] BE-T-009 — إنشاء وحدة تدقيق الخادم والمنطق المشترك
- [x] BE-T-010 — إنشاء وحدة تدقيق الواجهة والتكامل بين الطبقات
- [x] BE-T-011 — إنشاء وحدة تدقيق الأمن والجاهزية الإنتاجية
- [x] CC-T-003 — إنشاء مسار تطبيع النتائج وإزالة التكرار
- [x] CC-T-004 — إنشاء مولد الأولويات وخطة الإصلاح ذات المراحل الخمس
- [x] BE-T-012 — إنشاء خط أنابيب المراجعة الكامل وكتابة `review.md`
- [x] DO-T-005 — إضافة حزمة اختبارات انحدار لمسار المراجعة والبوابات
- [x] CC-T-005 — تحديث الدليل السريع والعقود لتطابق السلوك المنفذ

---

## Execution Summary

| Layer | Task Count | Total Estimate | Parallel Opportunities |
|-------|-----------|----------------|----------------------|
| 🗄️ Backend | 12 | 30 hours | 5 tasks |
| 🎨 Frontend | 0 | 0 hours | 0 tasks |
| 🔧 DevOps | 5 | 13 hours | 2 tasks |
| 🔗 Cross-Cutting | 5 | 10 hours | 3 tasks |
| **Total** | **22** | **53 hours** | **10 tasks** |

| Phase | Task Count | Total Estimate |
|-------|-----------|----------------|
| Setup | 3 | 8 hours |
| Foundation | 4 | 8 hours |
| User Story 1 (P1) | 5 | 12 hours |
| User Story 2 (P2) | 5 | 13 hours |
| User Story 3 (P3) | 3 | 7 hours |
| Polish | 2 | 5 hours |
| **Total** | **22** | **53 hours** |

---

## Phase 1: Setup

**Purpose**: تثبيت سطح الأوامر والبوابات المشتركة قبل بناء منطق المراجعة
**Milestone**: MS1

### DO-T-001 — Align review command surface and extension contract

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Source** | plan.md §4.1, plan.md §12.2, sys.md FR-001 |
| **Depends On** | None |
| **Parallel** | No |
| **Story** | Setup |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
مواءمة ملفات سطح الأمر
و
عقد الامتداد
في
`commands/syskit.review.md`
و
`.Systematize/extensions/commands/review.md`
و
اختبار التهيئة
بحيث يملك أمر المراجعة توصيفًا واحدًا غير متصادم مع السطح الحالي
ومعيار قبول يوجّه إلى بوابة المراجعة الهندسية الصارمة.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\commands\syskit.review.md`
- [x] `E:\yarab we elnby\the copy\.Systematize\extensions\commands\review.md`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\configuration.test.mjs`

**Acceptance Criteria:**
- [x] يوجد تعريف واحد واضح للأمر ولا تبقى فجوة بين ملف الأمر وعقد الامتداد.
- [x] يمر اختبار التهيئة المرتبط بتعريف
  `syskit.review`
  بعد التعديل.
- [x] لا يحدث تضارب مع handoff الحالي إلى
  `implement`
  أو
  `plan`

**Risks / Attention Points:**
- يوجد تصادم اسمي محتمل بين المراجعة الحاكمة الحالية وبين ميزة التدقيق الجديدة.

**Technical Notes:**
- استعمل العقد الموجود بدل اختراع أمر جديد ما لم تفرض الأدلة خلاف ذلك.

---

### DO-T-002 — Fix full-plan generation in setup-plan pipeline

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Source** | plan.md §4.2, plan.md §15, sys.md FR-012 |
| **Depends On** | DO-T-001 |
| **Parallel** | Yes |
| **Story** | Setup |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
إصلاح مسار
`setup-plan`
في
`.Systematize/scripts/node/lib/setup-plan.mjs`
و
`.Systematize/scripts/node/lib/common.mjs`
و
الغلاف
PowerShell
بحيث يركب القالب الأساسي كاملًا ثم يطبق أي
preset overlay
من دون أن ينتج
preset fragment
ناقصًا، ومعيار القبول هو توليد
`plan.md`
كاملة في فرع ميزة جديد.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\setup-plan.mjs`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\common.mjs`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\setup-plan.ps1`

**Acceptance Criteria:**
- [x] لا يعود
  `setup-plan --json`
  إلى إنشاء ملف خطة ناقص عند وجود
  preset
  عالي الأولوية.
- [x] يبقى خرج
  JSON
  كما هو من جهة العقود ولا تنكسر المسارات الحالية.
- [x] يظل التوافق بين مساري
  Node
  و
  PowerShell
  قائمًا.

**Risks / Attention Points:**
- أي تعديل خاطئ في
  `resolveTemplate`
  قد يكسر قوالب أوامر أخرى غير الخطة.

**Technical Notes:**
- اربط هذا التعديل مباشرة بخطر
  `setup-plan` fragment
  المذكور في
  `plan.md §9`

---

### DO-T-003 — Fix prerequisite gate semantics for research-before-plan workflow

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Source** | plan.md §4.2, plan.md §9, sys.md FR-003 |
| **Depends On** | DO-T-001 |
| **Parallel** | Yes |
| **Story** | Setup |
| **Milestone** | MS1 |
| **Owner** | Unassigned |

**Description:**
تعديل بوابة
`check-prerequisites`
في
المسار
Node
والغلاف
PowerShell
واختبار
workflow gates
بحيث لا يُفرض وجود
`plan.md`
قبل
`research.md`
ويصبح الفشل متوافقًا مع الترتيب الحاكم، ومعيار القبول هو نجاح البوابة عبر
مسار البحث قبل التخطيط ومسار الخطة بعد البحث.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\check-prerequisites.mjs`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\check-prerequisites.ps1`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\workflow-gates.test.mjs`

**Acceptance Criteria:**
- [x] ينجح فحص المتطلبات المسبقة في مرحلة البحث من دون
  `plan.md`
- [x] يبقى الفشل مسببًا وصريحًا عندما يغيب
  `sys.md`
  أو
  `constitution`
- [x] يمر اختبار
  workflow gates
  بعد التعديل.

**Risks / Attention Points:**
- التعديل هنا يمس كل الأوامر الحاكمة التي تعتمد نفس البوابة.

**Technical Notes:**
- لا تغيّر أسماء المفاتيح داخل
  JSON
  لأن اختبارات التوافق الحالية تعتمدها.

---

## Phase 2: Foundational

**Purpose**: بناء اللبنات المانعة اللازمة قبل أي قصة مستخدم
**Milestone**: MS2

### BE-T-001 — Create review request context and gate state modules

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Source** | plan.md §6.1, AGENTS.md Core Entities, sys.md FR-001 |
| **Depends On** | DO-T-001, DO-T-002, DO-T-003 |
| **Parallel** | No |
| **Story** | Foundation |
| **Milestone** | MS2 |
| **Owner** | Unassigned |

**Description:**
إنشاء وحدتي
سياق طلب المراجعة
و
حالة البوابة
داخل طبقة
review
بحيث تحملان الفرع والمسار والمخرجات المطلوبة والحالة والمانع والدليل،
ومعيار القبول هو إمكانية تمريرهما بين مراحل المراجعة بلا حقول ضمنية.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\request-context.mjs`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\gate-status.mjs`

**Acceptance Criteria:**
- [x] تغطي البنيتان الحقول المذكورة في
  `AGENTS.md`
- [x] لا توجد حالة جاهزة مع blocker حرج مفتوح.
- [x] كل حقل مطلوب في
  FR-001
  يمكن تمثيله صراحة داخل السياق.

**Risks / Attention Points:**
- أي تبسيط زائد هنا سيؤدي إلى تسرب افتراضات غير موثقة في المراحل اللاحقة.

**Technical Notes:**
- اجعل البنية مستقلة عن الأمر النهائي حتى يمكن إعادة استخدامها في الاختبارات.

---

### BE-T-002 — Create evidence and finding schemas for strict review

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Source** | plan.md §6.1, sys.md FR-012, sys.md FR-013, AGENTS.md Core Entities |
| **Depends On** | BE-T-001 |
| **Parallel** | Yes |
| **Story** | Foundation |
| **Milestone** | MS2 |
| **Owner** | Unassigned |

**Description:**
إنشاء مخططي
الدليل
و
النتيجة
داخل طبقة
review
بنوع وشدة وطبقة وموقع وأثر وإصلاح،
ومعيار القبول هو رفض أي Finding بلا نوع واحد وشدة واحدة أو بلا Evidence واضح.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\evidence-schema.mjs`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\finding-schema.mjs`

**Acceptance Criteria:**
- [x] يفرض المخطط أربعة أنواع فقط للنتائج.
- [x] يفرض المخطط شدة واحدة من الأربع الشدات المعتمدة.
- [x] يرفض إنشاء نتيجة من دون
  location
  و
  impact
  و
  fix

**Risks / Attention Points:**
- أي رخاوة في المخطط ستسمح بتكرار نفس الخلل بأسماء مختلفة.

**Technical Notes:**
- اربط القيم مباشرة بمعايير
  `FR-013`
  و
  `AC-013`

---

### CC-T-001 — Create governance architecture reference and reference-layer link

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Source** | plan.md §12, plan.md §15, quickstart.md Known Blockers |
| **Depends On** | DO-T-001 |
| **Parallel** | Yes |
| **Story** | Foundation |
| **Milestone** | MS2 |
| **Owner** | Unassigned |

**Description:**
إنشاء المرجع المعماري الجذري وربط طبقة المراجع به داخل
`docs/ARCHITECTURE.md`
و
`docs/REFERENCE.md`
بما يفسر مسار الحوكمة والمراجعة الصارمة،
ومعيار القبول هو اختفاء فشل
`verify-contracts`
الناتج من غياب الملف المعماري.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\docs\ARCHITECTURE.md`
- [x] `E:\yarab we elnby\the copy\docs\REFERENCE.md`

**Acceptance Criteria:**
- [x] يحتوي
  `docs/ARCHITECTURE.md`
  على عناوين عربية ويربط إلى
  `docs/START_HERE.md`
- [x] تشير
  `docs/REFERENCE.md`
  إلى
  `docs/ARCHITECTURE.md`
- [x] يختفي مانع الملف المفقود من
  `verify-contracts`

**Risks / Attention Points:**
- توثيق معماري عام أو فضفاض سيبقي الفشل قائمًا في خطوات تحقق لاحقة.

**Technical Notes:**
- صغ التوثيق حول حوكمة
  syskit
  ومكان ميزة المراجعة الصارمة داخله.

---

### DO-T-004 — Harden agent-context parser against plan table format drift

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Source** | plan.md §2.1, plan.md §4.2, plan.md §15 |
| **Depends On** | DO-T-002 |
| **Parallel** | Yes |
| **Story** | Foundation |
| **Milestone** | MS2 |
| **Owner** | Unassigned |

**Description:**
تقوية محلل
`update-agent-context`
داخل
Node
وغلافه
PowerShell
مع اختبار مخصص،
بحيث يقرأ حقول
Technical Context
من الجدول أو من
Agent Context Seed
من دون الاعتماد على صيغة واحدة هشة، ومعيار القبول هو نجاح التحديث على خطة مكتملة بصيغتيها.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\update-agent-context.mjs`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\powershell\update-agent-context.ps1`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\update-agent-context.test.mjs`

**Acceptance Criteria:**
- [x] يقرأ المحدث حقول
  Technical Context
  من الجدول عند وجودها.
- [x] يستمر بالعمل مع
  Agent Context Seed
  بوصفه fallback انتقالية.
- [x] يفشل صراحة إذا غابت الحقول الحرجة من المصدرين معًا.

**Risks / Attention Points:**
- حذف fallback مبكرًا سيعيد blocker readiness قبل إغلاق التوافق الكامل.

**Technical Notes:**
- لا تلمس الإرشادات اليدوية داخل
  `CLAUDE.md`
  إلا عبر upsert مضبوط.

---

## Phase 3: User Story 1 — مراجعة قبل تطوير جديد (Priority: P1)

**Goal**: تمكين مراجعة baseline تكشف وضع المراجعة والطبقات والأدوات والفحوصات وأخطر المشكلات قبل بدء أي تطوير جديد.
**Source**: sys.md Scenario 1, sys.md FR-001, FR-002, FR-003, FR-004
**Independent Test**: تشغيل المراجعة على مستودع متعدد الطبقات به سكربتات متاحة وبعضها يفشل، ثم التحقق من ظهور وضع المراجعة وخط الثقة وأخطر خمس مشكلات وتحليل سببي للفشل.
**Milestone**: MS3

### BE-T-003 — Create repository inventory scanner for detected layers and constraints

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Source** | sys.md FR-001, sys.md FR-005, plan.md §4.1 |
| **Depends On** | BE-T-001, BE-T-002 |
| **Parallel** | No |
| **Story** | US1 |
| **Milestone** | MS3 |
| **Owner** | Unassigned |

**Description:**
إنشاء ماسح جرد للمستودع في
طبقة
review
يكتشف مدير الحزم والطبقات والملفات الحاكمة والقيود التشغيلية من الجذر،
ومعيار القبول هو إنتاج inventory صريح يغذي سطر وضع المراجعة بدل أي افتراض.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\inventory-scan.mjs`

**Acceptance Criteria:**
- [x] يلتقط الجذر ومدير الحزم والطبقات المكتشفة والقيود التشغيلية.
- [x] لا يعلن طبقة غير موجودة.
- [x] يمرر ناتجه إلى سياق الطلب والدليل من دون حقول مفقودة.

**Risks / Attention Points:**
- خلط الملفات المولدة أو المؤقتة بسطح المشروع الحي سيشوّه التغطية.

**Technical Notes:**
- استعمل نتائج الجرد لتحديد ما إذا كانت مراجعة
  Full
  أم
  Partial
  من أول سطر.

---

### BE-T-004 — Create toolchain audit module for package scripts and config findings

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Source** | sys.md FR-002, sys.md AC-002, plan.md §2 |
| **Depends On** | BE-T-003 |
| **Parallel** | Yes |
| **Story** | US1 |
| **Milestone** | MS3 |
| **Owner** | Unassigned |

**Description:**
إنشاء وحدة تدقيق للأدوات والإعدادات في
`package.json`
وسطح الإعدادات المرتبط،
بحيث تستخرج السكربتات المفقودة أو المضللة أو الهشة مع موقع كل خلل،
ومعيار القبول هو إنتاج Findings مرتبطة بأداة أو ملف إعداد محدد.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\toolchain-audit.mjs`

**Acceptance Criteria:**
- [x] ترصد الوحدة السكربتات الأساسية المتاحة وغير المتاحة.
- [x] يخرج كل خلل مع
  location
  و
  evidence
  و
  impact
- [x] لا تخلط بين الأدوات الحرجة والتحسينات الاختيارية.

**Risks / Attention Points:**
- بعض المشاريع متعددة الحزم قد توزع سكربتاتها بين الجذر والحزم الداخلية.

**Technical Notes:**
- اربط النتائج مباشرة بعقد
  `review-report-contract`

---

### BE-T-005 — Create automated checks runner for lint type-check test build evidence

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Source** | sys.md FR-003, sys.md AC-003, plan.md §8.1 |
| **Depends On** | BE-T-003, DO-T-003 |
| **Parallel** | Yes |
| **Story** | US1 |
| **Milestone** | MS3 |
| **Owner** | Unassigned |

**Description:**
إنشاء مشغل الفحوصات الأساسية
`lint`
ثم
`type-check`
ثم
`test`
ثم
`build`
بترتيب ثابت مع تسجيل النجاح أو الفشل أو التعذر كأدلة مستقلة،
ومعيار القبول هو خروج سجل تنفيذي مكتمل لكل أمر متاح.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\automated-checks.mjs`

**Acceptance Criteria:**
- [x] يلتزم ترتيب التشغيل المحدد في
  FR-003
- [x] يميّز بين فشل الأمر وتعذر تشغيله.
- [x] يخزن لكل أمر المخرج الضروري لبناء تحليل بنيوي لاحق.

**Risks / Attention Points:**
- التشغيل المباشر قد يتوقف عند أول فشل إذا لم يُصمم المسار على الاستمرار المقيد.

**Technical Notes:**
- لا تحوّل المخرجات الخام إلى تقرير نهائي داخل هذه الوحدة.

---

### CC-T-002 — Create summary renderer for review mode and top critical issues

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P1 |
| **Estimate** | 2 hours |
| **Source** | sys.md FR-001, sys.md NFR-001, review-report-contract.md |
| **Depends On** | BE-T-002 |
| **Parallel** | Yes |
| **Story** | US1 |
| **Milestone** | MS3 |
| **Owner** | Unassigned |

**Description:**
إنشاء مولد الملخص التنفيذي وسطر وضع المراجعة وأخطر خمس مشكلات،
بحيث يركب مقدمة التقرير من سياق المراجعة ونتائج الشدة الحرجة والعالية،
ومعيار القبول هو التزام الملخص بترتيب التقرير وحد
`15`
سطرًا كحد أعلى للنواة الافتتاحية.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\render-summary.mjs`

**Acceptance Criteria:**
- [x] يبدأ الملخص بوضع المراجعة والثقة والطبقات المكتشفة.
- [x] يعرض أخطر خمس مشكلات فقط قبل أي تفصيل طبقي.
- [x] يبقى الملخص صالحًا حتى عند تعذر بعض الفحوصات.

**Risks / Attention Points:**
- تضخيم الملخص أو تحويله إلى مقدمة إنشائية سيكسر
  NFR-001

**Technical Notes:**
- لا تكرر السبب الجذري نفسه أكثر من مرة داخل الملخص.

---

### BE-T-006 — Create P1 orchestration module for baseline pre-development review

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Source** | sys.md Scenario 1, sys.md FR-004, plan.md §4.1 |
| **Depends On** | BE-T-004, BE-T-005, CC-T-002 |
| **Parallel** | No |
| **Story** | US1 |
| **Milestone** | MS3 |
| **Owner** | Unassigned |

**Description:**
إنشاء منسق القصة الأولى الذي يجمع الجرد وتدقيق الأدوات وتشغيل الفحوصات وتفسيرها
البنيوي لإنتاج
baseline review
صالح قبل أي تطوير جديد،
ومعيار القبول هو إمكانية الحصول على حزمة Evidence وFindings للقصة الأولى فقط.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\p1-orchestrator.mjs`

**Acceptance Criteria:**
- [x] ينتج المنسق Findings تفسر الفشل الخام بنيويًا بدل نقل النص فقط.
- [x] يمكن تشغيله من دون الاعتماد بعد على وحدات
  US2
  و
  US3
- [x] يحقق سيناريو القبول الأول والثاني في
  Scenario 1

**Risks / Attention Points:**
- دمج التحليل البنيوي في هذه النقطة يجب ألا يسبق اكتمال مخطط Finding.

**Technical Notes:**
- استهلك
  `render-summary`
  كمخرج presentation فقط لا كمكان اتخاذ قرار.

---

## Phase 4: User Story 2 — مراجعة مع بيئة ناقصة أو فحوصات متعذرة (Priority: P2)

**Goal**: تمكين استمرار التدقيق مع خفض الثقة بوضوح عندما تتعذر بعض الفحوصات أو تكون البيئة ناقصة.
**Source**: sys.md Scenario 2, sys.md FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011
**Independent Test**: تشغيل المراجعة على مشروع تتعذر فيه بعض الأوامر أو المتغيرات، ثم التحقق من استمرار التدقيق وظهور أثر النقص على الثقة والتغطية.
**Milestone**: MS4

### BE-T-007 — Create degraded-confidence model for partial execution reviews

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P1 |
| **Estimate** | 2 hours |
| **Source** | sys.md Scenario 2, sys.md NFR-003, AGENTS.md State Transitions |
| **Depends On** | BE-T-001, BE-T-002 |
| **Parallel** | Yes |
| **Story** | US2 |
| **Milestone** | MS4 |
| **Owner** | Unassigned |

**Description:**
إنشاء نموذج ثقة منقوصة يترجم حالات
success
و
failure
و
unavailable
إلى
review mode
و
confidence baseline
قابلين للعرض،
ومعيار القبول هو عدم توقف التقرير عند أول تعذر مع خفض الثقة وفق أدلة صريحة.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\confidence-model.mjs`

**Acceptance Criteria:**
- [x] يميز النموذج بين
  full execution
  و
  partial execution
  و
  static only
- [x] يربط كل خفض للثقة بسبب محدد ودليل محدد.
- [x] يمكن استهلاكه في الملخص النهائي وقسم التغطية.

**Risks / Attention Points:**
- خفض الثقة بصورة عامة وغير سببية سيحوّل الحكم إلى انطباع لا عقد.

**Technical Notes:**
- راع انتقال الحالة من
  `Plan Preliminary`
  إلى
  `Plan Ready`
  بوصفه مثالًا مشابهًا على بوابة ثقة.

---

### BE-T-008 — Create dev-versus-production boundary audit module

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P1 |
| **Estimate** | 2 hours |
| **Source** | sys.md FR-005, sys.md AC-005, plan.md §5.1 |
| **Depends On** | BE-T-003 |
| **Parallel** | Yes |
| **Story** | US2 |
| **Milestone** | MS4 |
| **Owner** | Unassigned |

**Description:**
إنشاء وحدة تدقيق لحدود
dev / build / production
والاعتماد على البيئة المحلية والمتغيرات وسلوك الكاش،
بحيث تنتج Findings مستقلة حول هشاشة البيئة،
ومعيار القبول هو تغذية قسم
`dev vs production boundaries`
بنتائج سببية ومحددة.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\dev-prod-audit.mjs`

**Acceptance Criteria:**
- [x] ترصد الوحدة الاعتماد على
  `.env.local`
  أو ما يماثله عندما يؤثر على الحكم.
- [x] تفرق بين نجاح
  dev
  وفشل
  build
  أو
  production
- [x] تخرج أثر الخلل على الجاهزية بدل وصفه فقط.

**Risks / Attention Points:**
- الاكتفاء بوجود ملف بيئة ليس دليلًا على خلل؛ يجب ربطه بسلوك أو خطر واضح.

**Technical Notes:**
- اربط كل نتيجة بهذا القسم مباشرة لتسهيل التطبيع اللاحق.

---

### BE-T-009 — Create server and shared-logic audit module

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P1 |
| **Estimate** | 3 hours |
| **Source** | sys.md FR-006, sys.md FR-007, sys.md AC-006, sys.md AC-007 |
| **Depends On** | BE-T-003, BE-T-007 |
| **Parallel** | Yes |
| **Story** | US2 |
| **Milestone** | MS4 |
| **Owner** | Unassigned |

**Description:**
إنشاء وحدة تدقيق للخادم والمنطق المشترك في ملف واحد يراجع
request parsing
و
response shape
و
validation
و
auth
و
error handling
إلى جانب التكرار والاقتران والعقود غير المستقرة،
ومعيار القبول هو خروج نتائج منفصلة لكل من طبقة الخادم والمنطق المشترك عند وجودهما.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\server-shared-audit.mjs`

**Acceptance Criteria:**
- [x] يغطي التدقيق جوانب الخادم المذكورة في
  FR-006
- [x] يغطي التدقيق عيوب المنطق المشترك المذكورة في
  FR-007
- [x] لا يختلق نتائج لطبقة غير موجودة؛ بل يصرح بغيابها إن لزم.

**Risks / Attention Points:**
- دمج طبقتين في ملف واحد قد يطمس حدود النتائج إذا لم يبق المخرج مصنفًا.

**Technical Notes:**
- احتفظ بإخراج layer-specific findings حتى لو تشارك التنفيذ الداخلي.

---

### BE-T-010 — Create frontend and frontend-backend integration audit module

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P1 |
| **Estimate** | 3 hours |
| **Source** | sys.md FR-008, sys.md FR-009, sys.md AC-008, sys.md AC-009 |
| **Depends On** | BE-T-003, BE-T-007 |
| **Parallel** | Yes |
| **Story** | US2 |
| **Milestone** | MS4 |
| **Owner** | Unassigned |

**Description:**
إنشاء وحدة تدقيق لطبقة الواجهة وعقود التكامل بينها وبين الخلفية،
بما يشمل جلب البيانات والحالة والرندر والحقول المطلوبة وnullability وتدفق
auth
وpropagation للأخطاء،
ومعيار القبول هو قدرة الوحدة على إنتاج Findings للواجهة والتكامل دون خلطهما.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\frontend-integration-audit.mjs`

**Acceptance Criteria:**
- [x] تغطي الوحدة حالات الواجهة المطلوبة في
  FR-008
- [x] تغطي العقود المطلوبة في
  FR-009
- [x] تظهر الأخطاء الصامتة وعدم تطابق الحقول كنتائج صريحة عند اكتشافها.

**Risks / Attention Points:**
- وجود أنواع
  TypeScript
  لا يكفي لإثبات سلامة العقود وقت التشغيل.

**Technical Notes:**
- عند غياب واجهة أو خلفية، يجب إرجاع
  skip with reason
  لا
  success

---

### BE-T-011 — Create security and production-readiness audit module

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P1 |
| **Estimate** | 3 hours |
| **Source** | sys.md FR-010, sys.md FR-011, sys.md AC-010, sys.md AC-011, plan.md §5 |
| **Depends On** | BE-T-005, BE-T-007 |
| **Parallel** | Yes |
| **Story** | US2 |
| **Milestone** | MS4 |
| **Owner** | Unassigned |

**Description:**
إنشاء وحدة تدقيق موحدة للأمن والجاهزية الإنتاجية تفحص
runtime validation
و
authorization
و
secret exposure
و
logging
و
observability
و
performance bottlenecks،
ومعيار القبول هو إخراج Findings أمنية وإنتاجية قابلة للفرز بالشدة مع أدلة تشغيلية أو بنيوية.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\security-readiness-audit.mjs`

**Acceptance Criteria:**
- [x] يرفع غياب
  runtime validation
  في المسارات الحساسة إلى شدة لا تقل عن
  High
- [x] يميز بين المخاطر الأمنية ومخاطر الجاهزية الإنتاجية بدل دمجها بلا تصنيف.
- [x] يغذي قسمي
  `security`
  و
  `performance and production readiness`
  بنتائج مستقلة.

**Risks / Attention Points:**
- الثقة الزائدة في الأنواع أو في نجاح أداة واحدة ستكسر المتطلب الأمني الحاكم.

**Technical Notes:**
- استعمل متطلبات
  `plan.md §5`
  كتوجيه تنفيذي لاكتشاف المخاطر لا كبديل عن Evidence.

---

## Phase 5: User Story 3 — تحويل المراجعة إلى خطة إصلاح (Priority: P3)

**Goal**: تحويل Findings والأدلة إلى تقرير نهائي مطبع وقابل للتحويل مباشرة إلى خطة إصلاح.
**Source**: sys.md Scenario 3, sys.md FR-012, FR-013
**Independent Test**: توليد تقرير نهائي من Findings متقاطعة، ثم التحقق من عدم التكرار وثبات التصنيف ووجود خريطة أولويات وخطة إصلاح من خمس مراحل.
**Milestone**: MS5

### CC-T-003 — Create finding normalizer for deduplication and strict typing

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P1 |
| **Estimate** | 2 hours |
| **Source** | sys.md FR-012, sys.md FR-013, sys.md BR-002, BR-003 |
| **Depends On** | BE-T-006, BE-T-009, BE-T-010, BE-T-011 |
| **Parallel** | No |
| **Story** | US3 |
| **Milestone** | MS5 |
| **Owner** | Unassigned |

**Description:**
إنشاء مسار تطبيع للنتائج يزيل التكرار ويثبت النوع والشدة والطبقة ويجمع السبب
الجذري المشترك في Finding واحدة،
ومعيار القبول هو منع ظهور الخلل نفسه أكثر من مرة بصياغات مختلفة.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\normalize-findings.mjs`

**Acceptance Criteria:**
- [x] لا تبقى نتيجة واحدة تحمل أكثر من نوع أو أكثر من شدة.
- [x] يدمج المسار الخلل العابر للطبقات وفق
  BR-003
- [x] يحتفظ المسار بالدليل والموقع والأثر بعد الدمج.

**Risks / Attention Points:**
- التطبيع المفرط قد يخفي خصوصية بعض الطبقات إذا دُمجت نتائج غير متكافئة.

**Technical Notes:**
- استخدم مخطط
  Finding
  كمرشح نهائي قبل تمرير أي نتيجة إلى التقرير.

---

### CC-T-004 — Create repair priority map and five-phase action plan generator

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P1 |
| **Estimate** | 2 hours |
| **Source** | sys.md Scenario 3, sys.md BR-004, review-report-contract.md |
| **Depends On** | CC-T-003 |
| **Parallel** | Yes |
| **Story** | US3 |
| **Milestone** | MS5 |
| **Owner** | Unassigned |

**Description:**
إنشاء مولد لخريطة الأولويات وخطة إصلاح من خمس مراحل بناءً على الشدة والاعتماد
والأثر التنفيذي،
مع منع أي تقديرات زمنية داخل الخطة،
ومعيار القبول هو إخراج أقسام
Repair Priority Map
و
Action Plan
مطابقة للعقد.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\repair-plan.mjs`

**Acceptance Criteria:**
- [x] يقسم المولد الإصلاحات إلى
  فوري
  وقبل أي ميزة جديدة
  ويمكن تأجيله
  وتحسينات اختيارية
- [x] يبني خطة إصلاح من خمس مراحل كما يفرض
  sys.md
- [x] لا يخرج أي مدة أو ETA داخل الخطة.

**Risks / Attention Points:**
- أي خلط بين KPI أو تقدير زمني وبين خطة الإصلاح سيكسر
  BR-004

**Technical Notes:**
- اجعل الترتيب مبنيًا على severity ثم execution risk ثم dependency depth.

---

### BE-T-012 — Create end-to-end review pipeline and review artifact writer

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P1 |
| **Estimate** | 3 hours |
| **Source** | plan.md §4.1, sys.md FR-012, review-report-contract.md |
| **Depends On** | CC-T-004, DO-T-004 |
| **Parallel** | No |
| **Story** | US3 |
| **Milestone** | MS5 |
| **Owner** | Unassigned |

**Description:**
إنشاء خط الأنابيب النهائي الذي يجمع وحدات
US1
و
US2
و
US3
ويكتب ملف
`review.md`
داخل مجلد الميزة عبر
`setup-review.mjs`
من دون placeholders،
ومعيار القبول هو إمكانية إنتاج artifact نهائي كامل من تشغيل واحد.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\setup-review.mjs`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\pipeline.mjs`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\lib\review\write-review-file.mjs`

**Acceptance Criteria:**
- [x] يكتب المسار ملف
  `review.md`
  كامل الأقسام المطلوبة.
- [x] يتوقف المسار برسالة سببية إذا غابت
  `sys.md`
  أو
  `plan.md`
  أو
  `tasks.md`
- [x] يدعم
  `--validate-existing`
  من دون توليد placeholders جديدة.

**Risks / Attention Points:**
- إعادة كتابة
  `setup-review.mjs`
  بصورة تعزلها عن
  command-runtime-contracts
  ستكسر سلوك الأوامر الحاكم.

**Technical Notes:**
- أبق الكتابة النهائية منفصلة عن توليد Findings لتسهيل الاختبار.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: تثبيت التحقق والانحدار وتحديث وثائق الاستهلاك الأخيرة
**Milestone**: MS5

### DO-T-005 — Add review runtime regression suites and execution proof commands

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P1 |
| **Estimate** | 3 hours |
| **Source** | plan.md §8, plan.md §15, quickstart.md First Run |
| **Depends On** | BE-T-012, CC-T-001 |
| **Parallel** | Yes |
| **Story** | Polish |
| **Milestone** | MS5 |
| **Owner** | Unassigned |

**Description:**
إضافة حزمة اختبارات انحدار ومسارات إثبات تشغيل لمسار
review
ولعقود الكتابة والتحقق،
بحيث تغطي إنشاء
`review.md`
وحالة الفشل المسبب وتوافق البوابة مع
feature-status،
ومعيار القبول هو مرور الاختبارات الجديدة واندماجها في أوامر الإثبات.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\setup-review.test.mjs`
- [x] `E:\yarab we elnby\the copy\.Systematize\scripts\node\tests\review-runtime-contracts.test.mjs`

**Acceptance Criteria:**
- [x] توجد حالة نجاح كاملة لمسار توليد
  `review.md`
- [x] توجد حالة فشل مفسر عند غياب artifact prerequisite
- [x] يمكن إضافة الأوامر الجديدة إلى مسار الإثبات من دون كسر السلسلة الحالية.

**Risks / Attention Points:**
- توسيع التحقق بلا تثبيت fixtures سيجعل الاختبارات هشة على حالات المستودع المتغيرة.

**Technical Notes:**
- راع اختلاف
  Windows
  و
  Linux
  في المسارات داخل الاختبارات الجديدة.

---

### CC-T-005 — Update feature quickstart and contracts to match delivered runtime

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P2 |
| **Estimate** | 2 hours |
| **Source** | plan.md §12.1, plan.md §14, quickstart.md, contracts/* |
| **Depends On** | DO-T-005 |
| **Parallel** | No |
| **Story** | Polish |
| **Milestone** | MS5 |
| **Owner** | Unassigned |

**Description:**
تحديث الدليل السريع وعقود
المخرجات
والبوابات
وسياق الوكيل
لتطابق السلوك المنفذ فعليًا بعد اكتمال
review runtime،
ومعيار القبول هو أن تصبح الوثائق قابلة للاستهلاك من دون تناقض مع التنفيذ أو الاختبارات.

**Expected Outputs:**
- [x] `E:\yarab we elnby\the copy\features\003-strict-code-review\quickstart.md`
- [x] `E:\yarab we elnby\the copy\features\003-strict-code-review\contracts\review-report-contract.md`
- [x] `E:\yarab we elnby\the copy\features\003-strict-code-review\contracts\workflow-gate-contract.md`
- [x] `E:\yarab we elnby\the copy\features\003-strict-code-review\contracts\agent-context-contract.md`

**Acceptance Criteria:**
- [x] يطابق كل أمر مذكور في
  quickstart
  السلوك الفعلي بعد التنفيذ.
- [x] لا تبقى العقود أوسع أو أضيق من السلوك المنفذ.
- [x] تذكر الوثائق blockers المفتوحة فقط إذا بقيت فعلًا بعد التنفيذ.

**Risks / Attention Points:**
- ترك وثائق مرحلة التخطيط كما هي بعد التنفيذ سيولد drift تعاقديًا جديدًا.

**Technical Notes:**
- حدّث السجل النهائي داخل الوثائق إذا تغيرت أوامر الإثبات الرسمية.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: يبدأ فورًا ولا يعتمد إلا على الخطة الحالية.
- **Foundation**: يعتمد على إغلاق Setup لأن البنية الحاكمة والبوابات يجب أن تستقر أولًا.
- **US1**: يعتمد على Foundation لأنه يحتاج مخططات السياق والدليل والنتيجة.
- **US2**: يعتمد على US1 baseline حتى يبني degraded mode فوق مسار يعمل أصلًا.
- **US3**: يعتمد على US1 وUS2 لأن التطبيع وخطة الإصلاح لا معنى لهما بلا Findings مكتملة.
- **Polish**: يعتمد على US3 لأنه يثبت الاختبارات والوثائق النهائية فوق سلوك منفذ.

### Story Dependencies

- **Setup**: DO-T-001 -> DO-T-002 و DO-T-003
- **Foundation**: BE-T-001 -> BE-T-002، وCC-T-001 وDO-T-004 يسيران بعد Setup
- **US1**: BE-T-003 -> BE-T-004 وBE-T-005 -> BE-T-006، وCC-T-002 يدعم التنسيق
- **US2**: BE-T-007 يسبق BE-T-009 وBE-T-010 وBE-T-011، وBE-T-008 مستقل نسبيًا بعد الجرد
- **US3**: CC-T-003 -> CC-T-004 -> BE-T-012
- **Polish**: DO-T-005 -> CC-T-005

### Parallel Opportunities

- يمكن تنفيذ
  DO-T-002
  و
  DO-T-003
  بالتوازي بعد
  DO-T-001
- يمكن تنفيذ
  CC-T-001
  و
  DO-T-004
  بالتوازي مع
  BE-T-002
  بعد اكتمال
  BE-T-001
- يمكن تنفيذ
  BE-T-004
  و
  BE-T-005
  و
  CC-T-002
  بالتوازي بعد
  BE-T-003
- يمكن تنفيذ
  BE-T-008
  و
  BE-T-009
  و
  BE-T-010
  و
  BE-T-011
  بالتوازي الجزئي بعد
  BE-T-007
- يمكن تنفيذ
  DO-T-005
  بعد اكتمال
  BE-T-012
  مباشرة ثم إنهاء الوثائق في
  CC-T-005

---

## Milestone Mapping

| Milestone | Plan Milestone Label | Tasks | Total Estimate |
|-----------|----------------------|-------|----------------|
| MS1 | Plan baseline complete | DO-T-001, DO-T-002, DO-T-003 | 8 hours |
| MS2 | Design contracts generated | BE-T-001, BE-T-002, CC-T-001, DO-T-004 | 8 hours |
| MS3 | Governance fixes approved | BE-T-003, BE-T-004, BE-T-005, CC-T-002, BE-T-006 | 12 hours |
| MS4 | Validation green path | BE-T-007, BE-T-008, BE-T-009, BE-T-010, BE-T-011 | 13 hours |
| MS5 | Ready for tasks review | CC-T-003, CC-T-004, BE-T-012, DO-T-005, CC-T-005 | 12 hours |

---

## Implementation Strategy

### MVP First

نطاق
`MVP`
هو:

- Setup كامل
- Foundation كامل
- User Story 1 كامل

هذا يكفي لإثبات أن المراجعة تستطيع:

1. اكتشاف الطبقات والأدوات.
2. تشغيل الفحوصات الأساسية.
3. إصدار baseline report أولي قبل أي تطوير جديد.

### Incremental Delivery

1. أغلق Setup وFoundation أولًا حتى تختفي blockers الحاكمة.
2. سلّم
   US1
   كبوابة baseline قابلة للاستخدام.
3. أضف
   US2
   لتغطية degraded execution والطبقات المتبقية.
4. أضف
   US3
   لتحويل النتائج إلى artifact إصلاحي كامل.
5. اختم بـ
   Polish
   لتثبيت الاختبارات والوثائق النهائية.

### Parallel Team Strategy

- مطور حوكمة أول:
  DO-T-001 إلى DO-T-004
- مطور Runtime:
  BE-T-001 إلى BE-T-006
- مطور Audit Modules:
  BE-T-007 إلى BE-T-011
- مالك الوثائق والعقود:
  CC-T-001 إلى CC-T-005

---

## Post-Generation Review

### Duplication Check

- [x] No two tasks produce the same file
- [x] No semantic duplicates (different wording, same work)

### Orphan Check

- [x] Every task has a source (plan/sys section or requirement ID)
- [x] Every task has at least one expected output
- [x] No task exists without dependencies or dependents except DO-T-001 and CC-T-005

### Estimate Sanity Check

- [x] No task exceeds 4 hours
- [x] Total estimate is realistic for project scope
- [x] Layer distribution matches project type

### Testability Check

- [x] Every acceptance criterion is testable
- [x] Every user story has an independent test description

### Traceability Check

- [x] Every task traces to a source in plan.md or sys.md
- [x] Every FR-XXX from sys.md has at least one task
- [x] Every entity from AGENTS.md has at least one task

**FR Coverage Summary**

- FR-001 -> BE-T-001, BE-T-003, CC-T-002
- FR-002 -> BE-T-004
- FR-003 -> DO-T-003, BE-T-005
- FR-004 -> BE-T-006
- FR-005 -> BE-T-008
- FR-006 -> BE-T-009
- FR-007 -> BE-T-009
- FR-008 -> BE-T-010
- FR-009 -> BE-T-010
- FR-010 -> BE-T-011
- FR-011 -> BE-T-011
- FR-012 -> CC-T-003, CC-T-004, BE-T-012
- FR-013 -> BE-T-002, CC-T-003

**Entity Coverage Summary**

- Review Request -> BE-T-001
- Gate Status -> BE-T-001
- Evidence Record -> BE-T-002, BE-T-005
- Finding -> BE-T-002, CC-T-003
- Report Artifact -> BE-T-012, CC-T-005

---

## Tasks Quality Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Every task has a unique layer-prefixed ID | ☑ |
| 2 | Every task has a tangible output (files/artifacts) | ☑ |
| 3 | Every task has a time estimate (≤ 4 hours) | ☑ |
| 4 | Dependencies are clearly defined | ☑ |
| 5 | Acceptance criteria are testable | ☑ |
| 6 | Tasks are ordered by priority | ☑ |
| 7 | No duplicate tasks | ☑ |
| 8 | Every task traces to a source in plan/sys | ☑ |
| 9 | Risks/attention points documented where relevant | ☑ |
| 10 | Layer summary totals are calculated | ☑ |
| 11 | Milestone mapping is complete | ☑ |
| 12 | Post-generation review completed | ☑ |

---

## Notes

- لا توجد مهام
  Frontend
  في هذا الإصدار لأن الميزة تعمل داخل إطار حوكمة ووثائق وRuntime أوامر.
- أي مهمة تتجاوز
  4
  ساعات في التنفيذ الفعلي يجب تقسيمها قبل العمل لا أثناءه.
- ما يزال readiness الكلي للمبادرة متوقفًا على إغلاق blockers المذكورة في
  `plan.md §15`
  حتى بعد اكتمال
  `tasks.md`

---

## Changelog

| التاريخ | الإصدار | التغيير | المؤلف |
|---------|---------|--------|--------|
| 2026-03-23 | 1.0 | إنشاء قائمة مهام ذرية من الخطة والـ sys والعقود | Codex |

