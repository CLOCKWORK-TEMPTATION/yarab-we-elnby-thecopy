# Deep Research Plan: V-Formation Split Entry Animation

## Research Card

| Field | Value |
|-------|-------|
| **Concept / Feature** | V-Formation Split Entry Animation |
| **Version** | 1.0 |
| **Created** | 2026-03-18 |
| **Author** | Claude (Research Agent) |
| **Source** | sys.md |
| **Research Readiness** | ☑ Ready |
| **Research Type** | ☑ Technical |
| **Research Depth** | ☑ Surface |
| **Time Priority** | ☑ High |
| **Timeframe** | Hours |
| **Geography** | N/A |
| **Domain / Sector** | Frontend Animation (GSAP) |
| **Linked Sys** | [sys.md](sys.md) |
| **Feature Branch** | `001-v-formation-split-entry` |

---

## 1. Executive Summary from Source

### 1.1 Core Problem
أنيميشن دخول كروت التكوين V يستخدم نقطة دخول واحدة (أسفل الشاشة) لجميع الكروت السبعة، مما ينتج حركة أحادية تفتقر للعمق البصري.

### 1.2 Primary User
مشاهد الصفحة الرئيسية الذي يتفاعل مع أنيميشن scroll-based.

### 1.3 Pain / Need / Current Impact
الأنيميشن الحالي لا يعكس ديناميكية التكوين V ولا يميزه بصرياً عن تكوينات أخرى محتملة.

### 1.4 Current Alternative or Status Quo
جميع الكروت السبعة تدخل من `y: "120vh"` (أسفل الشاشة) مع stagger delay 0.12s، ثم تنتقل لمواقعها في شكل V عبر GSAP ScrollTrigger.

### 1.5 Value Proposition
تقسيم الدخول لمجموعتين (4 من أسفل-يمين + 3 من أعلى-يسار) يخلق حركة تقاربية ديناميكية تعكس شكل V نفسه.

### 1.6 Why This Concept is Better
الحركة ثنائية الاتجاه أكثر إثارة بصرياً من الحركة أحادية الاتجاه. كل مجموعة تدخل من الجهة التي ستستقر فيها.

### 1.7 Initial Scope Boundary
تعديل Phase 3 (card entry) فقط في use-hero-animation.ts. لا تغيير في المواقع النهائية أو أي phase آخر.

### 1.8 Riskiest Assumption
ASM-002: التزامن بين المجموعتين — هل يمكن لـ GSAP تشغيل مجموعتين بنفس اللحظة في timeline واحد؟

### 1.9 Initial Success Metric
المواقع النهائية مطابقة للأصل بفارق ≤ 1px مع ≥ 60fps.

---

## 2. Research Decision: Why Research?

**Research Purpose:**
التحقق من أن GSAP يدعم النمط المطلوب (مجموعتان بنقاط دخول مختلفة في timeline واحد مع ScrollTrigger) وتحديد أفضل نمط تنفيذ.

**Core Research Question:**
هل يمكن لـ GSAP timeline واحد مع ScrollTrigger تشغيل مجموعتين من العناصر من اتجاهين مختلفين بالتزامن دون مشاكل أداء أو توافق؟

---

## 3. Research Goal

**Decision Target:**
تأكيد الجدوى التقنية وتحديد نمط التنفيذ الأمثل (Pattern B: explicit two-group fromTo).

**Expected Decision After Research:**
- ☑ Proceed to Define / Plan

---

## 4. Research Questions

### 4.1 Problem Questions
1. هل الأنيميشن أحادي الاتجاه مشكلة حقيقية تؤثر على التجربة البصرية؟ → نعم، الحركة من اتجاه واحد أقل ديناميكية
2. هل تقسيم نقاط الدخول يحل المشكلة فعلاً؟ → نعم، يخلق حركة تقاربية أكثر إثارة
3. هل المشكلة خاصة بالتكوين V أم تشمل تكوينات أخرى؟ → خاصة بـ V حالياً (out of scope للبقية)

### 4.2 User & Behavior Questions
1. هل المستخدم يلاحظ الفرق بين أنيميشن أحادي وثنائي الاتجاه؟ → نعم — التأثير البصري واضح
2. هل سرعة الأنيميشن الحالية مناسبة للنمط الجديد؟ → نعم — 0.7s duration كافية
3. هل stagger delay يحتاج تعديل؟ → محتمل — يحتاج اختبار بصري

### 4.3 Market & Alternatives Questions
<!-- Skipped — not applicable for internal UI animation feature -->

### 4.4 Solution & Value Questions
1. هل النمط المقترح (4+3 split) هو الأفضل أم هناك بدائل؟ → 3 أنماط متاحة: wrap, explicit split, stagger from edges
2. هل التقسيم حسب الموقع النهائي (يمين من يمين، يسار من يسار) يعطي أفضل نتيجة بصرية؟ → نعم — حركة تقاربية طبيعية
3. هل يوجد نمط أبسط يحقق نفس التأثير؟ → gsap.utils.wrap() أبسط لكن أقل تحكماً

### 4.5 Technical Feasibility Questions
1. هل GSAP timeline يدعم مجموعتين بنقاط بداية مختلفة في نفس اللحظة؟ → **نعم — position parameter `0`**
2. هل ScrollTrigger متوافق مع اتجاهات دخول مختلفة؟ → **نعم — لا مشاكل معروفة**
3. ما تأثير الأداء لـ 7 عناصر بمسارات مختلفة؟ → **لا يوجد تأثير — GSAP يحسب كل tween مستقلاً**
4. هل يجب استخدام `x/y` (transforms) بدل `left/top`؟ → **نعم — حاسم للأداء**
5. هل `force3D: true` كافي لتسريع GPU؟ → **نعم — GSAP يفعّله تلقائياً**

### 4.6 Risk & Constraint Questions
1. هل هناك خطر من تعارض ScrollTriggers متعددة؟ → **لا — نستخدم ScrollTrigger واحد على الـ timeline**
2. هل تغيير نقاط الدخول يؤثر على المواقع النهائية؟ → **لا — fromTo مستقلة عن مرحلة التموضع**
3. هل responsive breakpoints تحتاج معالجة خاصة؟ → **لا — نقاط الدخول يمكن أن تكون نسب مئوية من الشاشة**

### 4.7 Decision Questions
1. هل النمط المطلوب ممكن تقنياً؟ → **نعم بثقة عالية**
2. هل يحتاج تغييرات في ملفات متعددة؟ → **لا — use-hero-animation.ts فقط**
3. هل يمكن التراجع بسهولة إذا لم يعجب المالك؟ → **نعم — تغيير محصور في forEach واحدة**

---

## 5. Hypotheses & Assumptions

### 5.1 Hypotheses to Validate
- **H1**: GSAP timeline يدعم fromTo() بنقاط بداية مختلفة في نفس position → **✅ محققة**
- **H2**: ScrollTrigger لا يتأثر باتجاه دخول العناصر → **✅ محققة**
- **H3**: 7 عناصر متحركة بمسارات مختلفة لا تؤثر على الأداء (60fps) → **✅ محققة**

### 5.2 Assumptions to Test
- **ASM-001**: تقسيم [3,4,5,6] أسفل-يمين و [0,1,2] أعلى-يسار → **محقق** (تأكيد المالك)
- **ASM-002**: التزامن بين المجموعتين ممكن → **محقق** (position parameter `0`)
- **ASM-003**: نقطة التجمع y:0 → **محقق** (الكود الحالي يستخدمها)

### 5.3 Things to Rule Out or Warn Against
- **تحذير**: لا تضع ScrollTrigger فردي على tweens داخل timeline — يسبب تعارض playhead
- **تحذير**: لا تستخدم `left/top` للتحريك — استخدم `x/y` (transforms) فقط
- **تحذير**: لا تنسَ `will-change: auto` في التنظيف لتحرير GPU memory

---

## 6. Research Boundaries

### 6.1 In Scope
- جدوى GSAP لنمط split-group animation
- أفضل نمط تنفيذ (Pattern B: explicit two-group fromTo)
- تأثير الأداء ومتوافقية ScrollTrigger

### 6.2 Out of Scope
- تصميم الأنيميشن بالتفصيل (مدة، easing، إحداثيات دقيقة)
- تعديل تكوينات أخرى غير V
- اختبار على أجهزة حقيقية

### 6.3 Prohibitions
- No drifting into implementation or detailed design
- No repeating general GSAP knowledge
- No relying on weak sources when primary sources exist
- No hiding contradictions between sources

---

## 7. Required Sources & Priority

### 7.1 Primary Sources
- GSAP Official Documentation (gsap.com/docs)
- ScrollTrigger Official Documentation
- GSAP Config/Performance Docs

### 7.2 Strong Secondary Sources
- Codrops GSAP Tips (tympanus.net)
- DEV Community high-performance animation guides

### 7.3 Supporting Sources
- GSAP Community Forums
- Noble Desktop tutorials

---

## 8. Research Methodology

Phases A-E executed as Surface depth research (hours, not days).

---

## 9. Quality Criteria

Research ACCEPTED: answers core question clearly, tests critical hypotheses, compares patterns, ends with actionable recommendation.

---

## 10. Declared Assumptions from Source

- **ASM-001**: كروت [3,4,5,6] من أسفل-يمين و [0,1,2] من أعلى-يسار — **محقق في جلسة clarify**
- **ASM-002**: الحركتان تبدآن بالتزامن — **مؤكد تقنياً (position `0`)**
- **ASM-003**: نقطة التجمع عند y:0 — **مؤكد من الكود الحالي**

---

## 11. Research Report

### 11.1 Executive Summary

البحث يؤكد بثقة عالية أن GSAP يدعم النمط المطلوب بشكل كامل. النمط الأمثل هو **Pattern B** (explicit two-group `fromTo()` with position `0`) — حيث نقسم حلقة forEach الحالية إلى حلقتين: واحدة لكروت [3,4,5,6] من أسفل-يمين وأخرى لكروت [0,1,2] من أعلى-يسار، مع استخدام نفس position marker لضمان التزامن. لا توجد مشاكل أداء أو توافق مع ScrollTrigger. التغيير محصور في ملف واحد (`use-hero-animation.ts`) ويمكن التراجع عنه بسهولة. **التوصية: PROCEED.**

### 11.2 Domain Landscape Map

| العنصر | الحالة |
|--------|--------|
| **المكتبة** | GSAP v3 — المكتبة الأكثر استخداماً للأنيميشن على الويب |
| **النمط الحالي** | forEach واحدة + fromTo من y:120vh + stagger 0.12s |
| **النمط المطلوب** | حلقتان مستقلتان + fromTo من اتجاهين + position `0` للتزامن |
| **البدائل** | Pattern A (gsap.utils.wrap) — أبسط لكن أقل تحكم. Pattern C (stagger from:edges) — لا يدعم 4+3 split |
| **الأداء** | 7 عناصر بتحويلات (transforms) = حِمل لا يُذكر. force3D تلقائي |

### 11.3 Research Question Answers

| # | Question | Answer | Source | Confidence |
|---|----------|--------|--------|-----------|
| 4.5.1 | هل GSAP timeline يدعم مجموعتين في نفس اللحظة؟ | نعم — position parameter `0` يفرض التزامن | GSAP Timeline Docs | High |
| 4.5.2 | هل ScrollTrigger متوافق مع اتجاهات مختلفة؟ | نعم — الاتجاه مجرد قيم x/y، لا تأثير على ScrollTrigger | ScrollTrigger Mistakes Guide | High |
| 4.5.3 | تأثير الأداء لـ 7 عناصر بمسارات مختلفة؟ | لا يوجد — GSAP يحسب كل tween مستقلاً، 7 عناصر = حِمل منخفض جداً | GSAP Config Docs + DEV Community | High |
| 4.5.4 | x/y vs left/top؟ | x/y (transforms) إلزامي — يتجاوز Layout و Paint | GSAP Performance Best Practices | High |
| 4.5.5 | force3D كافي؟ | نعم — GSAP يفعّله تلقائياً للتسريع GPU | GSAP Config Docs | High |
| 4.6.1 | خطر تعارض ScrollTriggers؟ | لا — ScrollTrigger واحد على parent timeline (النمط الحالي) | ScrollTrigger Mistakes Guide | High |
| 4.7.1 | هل ممكن تقنياً؟ | نعم — مدعوم بالكامل | All sources | High |
| 4.7.2 | كم ملف يتغير؟ | ملف واحد: use-hero-animation.ts | Code analysis | High |

### 11.4 Evidence & Sources

| # | Source | Type | Reliability | Date | Reference |
|---|--------|------|------------|------|-----------|
| 1 | GSAP Timeline Documentation | Primary | High | 2025 | gsap.com/docs/v3/GSAP/Timeline/ |
| 2 | ScrollTrigger Tips & Mistakes | Primary | High | 2025 | gsap.com/resources/st-mistakes/ |
| 3 | GSAP Config Docs (force3D) | Primary | High | 2025 | gsap.com/docs/v3/GSAP/gsap.config/ |
| 4 | Codrops — 7 Must-Know GSAP Tips | Secondary | High | 2025-09 | tympanus.net/codrops/2025/09/03/ |
| 5 | DEV Community — High-Performance Animation | Secondary | Medium | 2025 | dev.to/kolonatalie |
| 6 | Lexo — will-change & GPU Guide | Secondary | Medium | 2025-01 | lexo.ch/blog/2025/01 |
| 7 | GSAP Community Forums | Supporting | Medium | 2025 | gsap.com/community/forums |

### 11.5 Hypotheses: Validated vs Invalidated

| # | Hypothesis | Status | Evidence | Confidence |
|---|-----------|--------|----------|-----------|
| H1 | GSAP timeline يدعم fromTo بنقاط بداية مختلفة في نفس position | ✅ Validated | Position parameter `0` forces simultaneous start — official docs | High |
| H2 | ScrollTrigger لا يتأثر باتجاه دخول العناصر | ✅ Validated | الاتجاه مجرد x/y values — ScrollTrigger يتحكم بالـ playhead فقط | High |
| H3 | 7 عناصر بمسارات مختلفة لا تؤثر على الأداء | ✅ Validated | GSAP يحسب كل tween مستقلاً — 7 عناصر حِمل منخفض جداً | High |

### 11.6 Risks & Constraints Discovered

| # | Risk/Constraint | Severity | Impact | Mitigation |
|---|----------------|----------|--------|-----------|
| 1 | استخدام left/top بدل x/y يسبب layout thrashing | HIGH | تقطع ملحوظ في الأنيميشن | الكود الحالي يستخدم top/left في مرحلة التموضع — يجب الحذر عند التعديل |
| 2 | نسيان will-change:auto في التنظيف يسبب تسريب GPU memory | MEDIUM | تراكم طبقات GPU | الكود الحالي يتعامل مع هذا بالفعل في cleanup |
| 3 | إضافة ScrollTrigger فردي على tweens داخل timeline | HIGH | تعارض playhead وسلوك غير متوقع | لا نضيف ScrollTriggers جديدة — نستخدم الموجود |

### 11.7 Opportunities for Improvement or Repositioning

- يمكن استخدام `gsap.utils.wrap()` لنمط alternating أبسط في المستقبل
- يمكن إضافة stagger `from: "edges"` لتكوينات أخرى
- النمط المُنفذ يمكن تعميمه لتكوينات أخرى (كل تكوين بأنيميشن دخول فريد)

### 11.8 Final Recommendation

**PROCEED** — GSAP يدعم النمط المطلوب بشكل كامل وبثقة عالية. التنفيذ يتطلب تعديل `use-hero-animation.ts` فقط: استبدال حلقة forEach الواحدة بحلقتين (واحدة لكل مجموعة) مع position parameter مشترك للتزامن. الأداء لن يتأثر. المخاطر محدودة ومعروفة.

### 11.9 Readiness for Define/Plan

- ☑ Ready

**Explanation:** جميع الفرضيات محققة بثقة عالية. لا توجد مجهولات حرجة. التقنية مدعومة. التغيير محصور ومنخفض المخاطر.

---

## 12. Final Judgment

| Field | Value |
|-------|-------|
| **Verdict** | PROCEED |
| **Confidence Level** | HIGH |

**Reasons:**
1. GSAP يدعم pattern المطلوب بالكامل — position parameter `0` يضمن التزامن
2. لا مشاكل أداء أو توافق مع ScrollTrigger — مؤكد من المصادر الرسمية
3. التغيير محصور في ملف واحد (use-hero-animation.ts) — منخفض المخاطر وقابل للتراجع
4. جميع الفرضيات الثلاث محققة بثقة عالية

**Required Actions Before Define/Plan:**
1. لا إجراءات مطلوبة — جاهز للانتقال لـ `/syskit.plan`
2. (اختياري) التحقق من أن الكود الحالي يستخدم `x/y` transforms وليس `left/top` في مرحلة الدخول — **FACT: الكود يستخدم `y: "120vh"` (transform) في الدخول لكن `top/left` (CSS) في التموضع النهائي — هذا لن يتأثر لأننا نعدّل الدخول فقط**
3. (اختياري) تحديد الإحداثيات الدقيقة لنقطتي الدخول (أسفل-يمين وأعلى-يسار) — يمكن تأجيلها لمرحلة التنفيذ

---

## 13. Delivery Notes

- البحث بعمق Surface — مناسب لميزة تقنية في domain معروف مع ≤3 مجهولات
- جميع المصادر الأساسية من GSAP الرسمي
- لا تعارضات بين المصادر
- الثقة عالية في جميع الاستنتاجات
- تحذير واحد مهم: الكود الحالي يستخدم `top/left` (CSS positioning) في مرحلة التموضع النهائي وليس `x/y` transforms — هذا خارج نطاق التعديل لكنه ملاحظة للمستقبل
