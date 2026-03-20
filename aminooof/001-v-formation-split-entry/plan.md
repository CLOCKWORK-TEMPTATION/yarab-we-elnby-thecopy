# Implementation Plan: V-Formation Split Entry Animation

<!--
  This plan is the GOVERNING EXECUTION REFERENCE for building this feature.
  Golden Rule: No implementation starts before this plan is approved.
  No significant change is accepted without updating this plan.

  The sys (PRD) defines WHAT to build. This plan defines HOW to build it.
-->

## Plan Card

| Field | Value |
|-------|-------|
| **Branch** | `001-v-formation-split-entry` |
| **Date** | 2026-03-18 |
| **Sys** | [sys.md](sys.md) |
| **Plan Version** | 1.1 |
| **Status** | ☑ Draft |
| **Readiness** | ☐ Not Ready ☐ Preliminary ☑ Ready for Execution |
| **Product Manager** | Mohamed Aimen Raed |
| **Technical Lead** | Mohamed Aimen Raed |
| **Target Launch** | 2026-03-25 |
| **Project Profile** | ☑ S (Small) |

<!--
  Profile S rationale: تعديل أنيميشن واحد في ملف واحد (use-hero-animation.ts)، مطور واحد، ≤ يومين عمل، لا تكاملات خارجية.
  Skipped per S profile: §3 (Stakeholders — solo dev), §13 (Complexity Tracking), Appendices.
  Simplified: §9 (Risk Registry), §10 (Success Indicators).
-->

---

## 1. Summary *(mandatory)*

**Primary Requirement** (from [sys.md](sys.md)): تقسيم أنيميشن دخول كروت التكوين V من نقطة دخول واحدة إلى نقطتين — 4 كروت [3,4,5,6] من أسفل-يمين و3 كروت [0,1,2] من أعلى-يسار — مع الحفاظ على المواقع النهائية كما هي.

**Technical Approach** (from [research.md](research.md)): Pattern B — Explicit two-group `fromTo()` مع position parameter `0` للتزامن. تعديل محصور في `use-hero-animation.ts` Phase 3 card entry. استبدال حلقة `forEach` واحدة بحلقتين، كل واحدة تستخدم `fromTo()` بإحداثيات بداية مختلفة. GSAP position `0` يضمن تزامن المجموعتين في نفس Timeline مع ScrollTrigger.

---

## 2. Technical Context *(mandatory)*

| Field | Value |
|-------|-------|
| **Language/Version** | TypeScript 5.x (React hooks) |
| **Primary Dependencies** | GSAP 3.x + ScrollTrigger plugin |
| **Storage** | N/A — frontend animation only |
| **Testing Framework** | Visual inspection + DevTools Performance Monitor |
| **Target Platform** | Web — Desktop (≥1280px), Tablet (768-1280px), Mobile (<768px) |
| **Project Type** | Frontend animation modification |
| **Performance Goals** | ≥ 60fps during animation, total animation ≤ 2s |
| **Constraints** | تعديل محصور في `use-hero-animation.ts` فقط. لا تغيير في hero-config.ts أو المواقع النهائية |
| **Scale/Scope** | 7 كروت ثابتة، ملف واحد، ~20 سطر كود تعديل |

---

## 4. Architecture *(mandatory)*

### 4.1 Component Overview

```text
┌─────────────────────────────────────────────────────┐
│  HeroAnimation.tsx (React Component)                │
│  └── .phase-3-img elements (7 cards)                │
└──────────────────┬──────────────────────────────────┘
                   │ refs
                   ▼
┌─────────────────────────────────────────────────────┐
│  use-hero-animation.ts (React Hook)                 │
│  ┌─────────────────────────────────────────────┐    │
│  │  GSAP Master Timeline + ScrollTrigger       │    │
│  │  ├── Phase 1: Initial setup                 │    │
│  │  ├── Phase 2: ...                           │    │
│  │  ├── Phase 3: Card Entry ← التعديل هنا     │    │
│  │  │   ├── Group A [3,4,5,6]: fromTo          │    │
│  │  │   │   from: {x:vw, y:vh} (bottom-right)  │    │
│  │  │   │   to:   {x:0, y:0}   (gather point)  │    │
│  │  │   ├── Group B [0,1,2]: fromTo            │    │
│  │  │   │   from: {x:-vw, y:-vh} (top-left)    │    │
│  │  │   │   to:   {x:0, y:0}    (gather point) │    │
│  │  │   │   duration: 0.82s (equalized end)     │    │
│  │  │   └── position: 0 (synchronized)         │    │
│  │  └── Phase 4: V-Formation positioning       │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────┬──────────────────────────────────┘
                   │ reads positions
                   ▼
┌─────────────────────────────────────────────────────┐
│  hero-config.ts (Static Config) — لا يُعدَّل        │
│  └── cardPositions: V_LAYOUT[0..6]                  │
└─────────────────────────────────────────────────────┘
```

### 4.2 Architectural Decisions

| Decision | Context | Rejected Alternatives | Rationale |
|----------|---------|----------------------|-----------|
| **Pattern B: Explicit two-group fromTo** | تقسيم الكروت لمجموعتين بإحداثيات دخول مختلفة | **Pattern A**: config-driven (إضافة entryConfig object) — مرفوض لأنه يضيف تعقيد غير مبرر لتغيير واحد. **Pattern C**: nested timelines — مرفوض لأن timeline واحد مع position parameter أبسط وأكفأ | أقل تعقيد، تعديل محصور، position `0` يضمن التزامن بدون timelines متعددة |
| **تعديل use-hero-animation.ts فقط** | التغيير محصور في Phase 3 card entry | تعديل hero-config.ts لإضافة entryPoints — مرفوض لأنه يكسر فصل المسؤوليات (config = مواقع نهائية فقط) | الحفاظ على SRP: الأنيميشن في hook، الإحداثيات الثابتة في config |
| **y:0 كنقطة تجمع مشتركة** | المجموعتان تحتاجان نقطة التقاء قبل التموضع | نقطة تجمع مخصصة لكل مجموعة — مرفوض لأنه يضيف تعقيد بلا فائدة | السلوك الحالي يستخدم y:0 — التوافق مضمون |

---

## 5. Security & Privacy *(mandatory)*

| Domain | Requirement | Implementation |
|--------|-------------|---------------|
| **Authentication** | N/A — أنيميشن عام | لا يتطلب مصادقة |
| **Authorization** | N/A | لا صلاحيات |
| **Encryption** | N/A — لا بيانات | لا بيانات حساسة |
| **Audit Logging** | N/A — تغيير بصري frontend | لا تسجيل مطلوب |

---

## 7. Phased Execution Plan *(mandatory)*

### 7.1 Phases

| Phase | Objective | Duration | Deliverables | Transition Criteria |
|-------|-----------|----------|-------------|-------------------|
| **Phase 0: Research** | التحقق من جدوى GSAP | ✅ مكتمل | [research.md](research.md) — Verdict: PROCEED | ☑ 3 فرضيات محققة بثقة عالية |
| **Phase 1: Design** | خطة التنفيذ + عقود | ✅ مكتمل | plan.md + AGENTS.md + quickstart.md | ☑ Readiness Gate |
| **Phase 2: Build** | تعديل Phase 3 في use-hero-animation.ts | ≤ 2.5 ساعة | كود معدّل — حلقتا fromTo بدل forEach واحدة (Group B duration=0.82s للتزامن) | AC-001..AC-005 pass |
| **Phase 3: Verify** | فحص بصري + أداء + responsive | ≤ 1 ساعة | تقرير اختبار | AC-006, AC-007 pass + ≥60fps |
| **Phase 4: Launch** | دمج في main | ≤ 30 دقيقة | merge + tag | مراجعة المالك |

### 7.2 Milestones

| Milestone | Target Date | Deliverable | Owner |
|-----------|------------|-------------|-------|
| Plan approved | 2026-03-18 | Approved plan.md | Mohamed Aimen Raed |
| Code modified | 2026-03-19 | use-hero-animation.ts updated (Group B duration=0.82s) | Mohamed Aimen Raed |
| Verified | 2026-03-19 | All ACs pass | Mohamed Aimen Raed |
| Merged | 2026-03-20 | PR merged to main | Mohamed Aimen Raed |

---

## 8. Testing Strategy *(mandatory)*

### 8.1 Test Levels

| Level | Purpose | Owner | Success Criteria |
|-------|---------|-------|-----------------|
| Visual inspection | التحقق من مسارات الدخول | Mohamed Aimen Raed | المجموعتان تدخلان من الاتجاهين الصحيحين |
| Performance test | التحقق من سلاسة الأنيميشن | Mohamed Aimen Raed | ≥ 60fps في DevTools Performance |
| Acceptance test | التحقق من المواقع النهائية | Mohamed Aimen Raed | إحداثيات مطابقة للمرجع ≤ 1px |
| Responsive test | التحقق على 3 breakpoints | Mohamed Aimen Raed | يعمل على desktop/tablet/mobile |

### 8.2 Feature Acceptance Criteria

| Feature | Must Work | Must Not Break | Edge Case |
|---------|-----------|---------------|-----------|
| Group A entry [3,4,5,6] | تدخل من أسفل-يمين وتصعد | أنيميشنات أخرى في الصفحة | مقاطعة أثناء الدخول |
| Group B entry [0,1,2] | تدخل من أعلى-يسار وتهبط | أنيميشنات أخرى في الصفحة | شاشات صغيرة جداً |
| Synchronization | المجموعتان تبدآن وتنتهيان معاً (≤50ms) | ScrollTrigger timing | scroll سريع جداً |
| Final positioning | 7 كروت في مواقعها النهائية V | hero-config.ts positions | تغيير حجم الشاشة أثناء الأنيميشن |

---

## 9. Risk Registry *(mandatory)*

| Risk | Probability | Impact | Score | Mitigation | Owner |
|------|-------------|--------|-------|-----------|-------|
| RK-001: تداخل مسارات الكروت بصرياً | Med | Med | 4 | المجموعتان من اتجاهين متعاكسين — التقاطع غير محتمل هندسياً | Mohamed Aimen Raed |
| RK-002: عدم تزامن المجموعتين | Low | High | 4 | GSAP position `0` يفرض التزامن — مؤكد من الوثائق الرسمية | Mohamed Aimen Raed |
| RK-003: تراجع الأداء على الأجهزة الضعيفة | Low | Med | 2 | GSAP يستخدم GPU transforms تلقائياً (force3D) — لا overhead إضافي | Mohamed Aimen Raed |

### Risk Domains Checklist

- [x] Scope risks — لا مخاطر نطاق كبيرة (التغيير محصور)
- [x] Technical risks — RK-002 مغطى بـ position parameter
- [x] Resource risks — لا مخاطر (مطور واحد، مهمة صغيرة)
- [x] Integration risks — لا تكاملات خارجية
- [x] Security risks — لا مخاطر أمنية (تغيير بصري)
- [x] Budget risks — لا كلفة إضافية

---

## 10. Success Indicators *(mandatory)*

### 10.1 Pre-Launch Indicators

| Indicator | What It Proves | Target | Timing |
|-----------|---------------|--------|--------|
| All ACs pass | التنفيذ صحيح | 7/7 AC pass | قبل merge |
| 60fps maintained | الأداء سليم | ≥ 60fps | قبل merge |
| 3 breakpoints work | Responsive سليم | desktop + tablet + mobile | قبل merge |

### 10.2 Post-Launch Indicators

| Indicator | What It Proves | Target | Timing |
|-----------|---------------|--------|--------|
| No visual regression | التغيير لم يكسر شيئاً | 0 bugs reported | أول أسبوع |
| Final positions match | المواقع النهائية سليمة | ≤ 1px deviation | فوري |

---

## 11. Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| §3 — القواعد الحاكمة: لا يبدأ التنفيذ قبل اعتماد الدستور | ☑ Pass | الدستور v2.0.0 مكتمل |
| §3 — لا تُقبل متطلبات مبهمة | ☑ Pass | 7 FRs واضحة وقابلة للاختبار |
| §3 — كل افتراض مكتوب وله مالك | ☑ Pass | ASM-001 محقق، ASM-002/003 مفتوحة لكن منخفضة الخطورة |
| §3 — كل قرار معماري يسبقه بدائل | ☑ Pass | ADR-001, ADR-002 مع بدائل مرفوضة |
| §4 — بوابة: لا ننتقل للبناء إلا إذا اعتُمدت المتطلبات | ☑ Pass | FR-001..007 معتمدة مع ACs |
| §20 — معايير القبول محددة | ☑ Pass | AC-001..007 |

**Result: PASS** — لا مخالفات.

---

## 12. Project Structure *(mandatory)*

### 12.1 Documentation (this feature)

```text
specs/001-v-formation-split-entry/
├── sys.md              ✅ Created
├── research.md         ✅ Created (Phase 0 — PROCEED)
├── plan.md             ✅ This file
├── AGENTS.md           📋 Phase 1 output
├── quickstart.md       📋 Phase 1 output
├── checklists/
│   └── requirements.md ✅ Created
└── tasks.md            📋 /syskit.tasks output
```

### 12.2 Source Code (files to modify)

```text
apps/web/src/
├── hooks/
│   └── use-hero-animation.ts   ← الملف الوحيد المعدّل (Phase 3 card entry)
├── lib/
│   └── hero-config.ts          ← لا يُعدَّل (مواقع نهائية ثابتة)
└── components/
    ├── HeroAnimation.tsx        ← لا يُعدَّل (React component)
    └── LauncherCenterCard.tsx   ← لا يُعدَّل (V_LAYOUT)
```

**Structure Decision**: تعديل ملف واحد فقط (`use-hero-animation.ts`) — لا حاجة لإنشاء ملفات جديدة. الكود الجديد يحل محل حلقة forEach الحالية في Phase 3.

---

## 14. Change Management *(mandatory)*

### 14.1 Change Request Process

Every change to this plan must answer:
1. **What** changed?
2. **Why** did it change?
3. **What** is the impact on scope, time, and cost?
4. **Who** approved it?

### 14.2 Change Log

| Version | Date | Change | Reason | Approved By |
|---------|------|--------|--------|-------------|
| 1.0 | 2026-03-18 | Initial version | — | Mohamed Aimen Raed |
| 1.1 | 2026-03-18 | سد فجوات التحليل: حل تزامن QL-01 (Group B duration=0.82s)، تحديث المراحل والتقديرات | Mohamed Aimen Raed |

---

## 15. Readiness Gate *(mandatory)*

| Gate | Status | Blocking Items |
|------|--------|---------------|
| **Not Ready** | ☐ | — |
| **Preliminary** | ☐ | — |
| **Ready for Execution** | ☑ | None |

**Reasoning:**
- Research complete: PROCEED with HIGH confidence
- All FRs have ACs
- Architecture decisions documented with alternatives
- Risk registry complete (all 6 domains checked)
- Constitution check: PASS
- Single-file change with clear implementation pattern

---

## 16. Plan Quality Checklist

### 16.1 Pre-Approval Checklist *(mandatory)*

- [x] Problem is clearly defined (in sys)
- [x] Expected value is known and measurable (in sys)
- [x] Scope (in/out) is documented (in sys)
- [x] Stakeholders and decision rights are documented (solo dev — in constitution)
- [x] Functional requirements are written and testable (in sys — FR-001..007)
- [x] Non-functional requirements are approved (in sys — NFR-001..005)
- [x] Business rules are explicitly written (in sys — BR-001, BR-002)
- [x] Integrations and failure plans are documented (N/A — no integrations)
- [x] Risks are identified with mitigation plans (RK-001..003)
- [x] Acceptance criteria are defined (AC-001..007)
- [x] Phased execution plan is ready (4 phases)

### 16.2 Pre-Launch Checklist *(fill before launch)*

- [ ] All tests pass
- [ ] Performance is within approved limits
- [ ] Documentation is complete
- [ ] Support team is ready (N/A — solo)
- [ ] Rollback plan is ready (git revert)
- [ ] Monitoring and alerts are active (N/A — client-side animation)

---

## 17. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | Mohamed Aimen Raed | | |
| Technical Lead | Mohamed Aimen Raed | | |

---

## Changelog

| التاريخ | الإصدار | التغيير | المؤلف |
|---------|---------|--------|--------|
| 2026-03-18 | 1.0 | إنشاء خطة التنفيذ الكاملة | Claude |
| 2026-03-18 | 1.1 | سد فجوات التحليل: حل تزامن QL-01، تحديث العمارة والمراحل | Claude |
