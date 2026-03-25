# Tasks: V-Formation Split Entry Animation

<!--
  Atomic, traceable, layer-typed tasks for implementing split entry animation.
  Source: plan.md + sys.md + AGENTS.md + research.md
  Profile: S (Small) — single file, single dev, ≤ 2 days
-->

**Input**: Design documents from `/specs/001-v-formation-split-entry/`
**Prerequisites**: plan.md ✅, sys.md ✅, research.md ✅, AGENTS.md ✅, quickstart.md ✅

**Tests**: Not explicitly requested in sys.md. Visual verification tasks included instead.

**Organization**: Tasks grouped by milestone (MS1 → MS2 → MS3) matching plan.md §7.2.

---

## Task ID Convention

| Layer | Prefix | Count |
|-------|--------|-------|
| 🎨 Frontend | `FE-T-` | 3 |
| 🔗 Cross-Cutting | `CC-T-` | 1 |

---

## Quick Reference Checklist

- [ ] FE-T-002 — Understand code + Implement Group A [3,4,5,6] entry from bottom-right
- [ ] FE-T-003 — Implement Group B [0,1,2] entry from top-left with sync (duration: 0.82s)
- [ ] FE-T-004 — Verify final positions, responsive, and performance
- [ ] CC-T-001 — Update documentation and close feature

---

## Execution Summary

| Layer | Task Count | Total Estimate | Parallel Opportunities |
|-------|-----------|----------------|----------------------|
| 🎨 Frontend | 3 | 5 hours | 0 tasks |
| 🔗 Cross-Cutting | 1 | 0.5 hours | 0 tasks |
| **Total** | **4** | **5.5 hours** | **0 tasks** |

| Phase | Task Count | Total Estimate |
|-------|-----------|----------------|
| Phase 1: User Story 1 — Split Entry (MS1+MS2) | 2 | 4 hours |
| Phase 2: User Story 2 — Verify Positions (MS3) | 1 | 1 hour |
| Phase 3: Polish | 1 | 0.5 hours |
| **Total** | **4** | **5.5 hours** |

---

## Phase 2: User Story 1 — Split Entry Animation (Priority: P1) 🎯 MVP

**Goal**: تقسيم دخول الكروت إلى مجموعتين — 4 من أسفل-يمين و3 من أعلى-يسار — مع تزامن كامل
**Source**: sys.md Scenario 1, FR-001..FR-005
**Independent Test**: تشغيل الأنيميشن بصرياً — المجموعتان تدخلان من اتجاهين متعاكسين وتنتهيان معاً
**Milestone**: MS2

### FE-T-002 — Understand code + Implement Group A [3,4,5,6] entry from bottom-right

| Field | Value |
|-------|-------|
| **Type** | 🎨 Frontend |
| **Priority** | P0 |
| **Estimate** | 2.5 hours |
| **Source** | sys.md FR-001, FR-003, FR-005; plan.md §4.2 (ADR: Pattern B); AGENTS.md Group A |
| **Depends On** | None |
| **Parallel** | No |
| **Story** | US1 |
| **Milestone** | MS2 |
| **Owner** | Mohamed Aimen Raed |

**Description:**
**Step 0 (Code Understanding):** Read `apps/web/src/hooks/use-hero-animation.ts` and identify the exact Phase 3 card entry section. Map the current `forEach` loop, GSAP timeline structure, ScrollTrigger configuration, stagger (0.12s), duration (0.7s), and easing (power2.out). Verify `hero-config.ts` final positions are separate.

**Step 1 (Implementation):** In `apps/web/src/hooks/use-hero-animation.ts`, replace the single `forEach` loop in Phase 3 card entry with the first of two `fromTo()` calls. This call handles cards at indices [3, 4, 5, 6] (center + right arm of V per BR-001).

Implementation:
1. Filter `.phase-3-img` elements to get cards at indices 3, 4, 5, 6
2. Use `tl.fromTo(groupA, { x: "120vw", y: "120vh" }, { x: 0, y: 0, duration: 0.7, stagger: 0.12, ease: "power2.out" }, 0)` — position `0` for sync
3. Entry point: bottom-right offscreen (`x: "120vw", y: "120vh"`)
4. Gather point: `x: 0, y: 0` (same as current behavior)
5. Keep same duration (0.7s), stagger (0.12s), and easing (power2.out)

**Expected Outputs:**
- [ ] Phase 3 code location identified (line numbers documented in commit message)
- [ ] Modified `apps/web/src/hooks/use-hero-animation.ts` — Group A fromTo added

**Acceptance Criteria:**
- [ ] Cards [3,4,5,6] start from offscreen bottom-right (AC-001)
- [ ] Cards [3,4,5,6] move upward to gather point smoothly (AC-003)
- [ ] Animation uses position parameter `0` for timeline sync (FR-005)
- [ ] Stagger, duration, and easing match spec (0.12s, 0.7s, power2.out)

**Risks / Attention Points:**
- RK-001: Ensure bottom-right coordinates are far enough offscreen to be invisible on all breakpoints
- The exact `x` and `y` values for offscreen may need tuning — start with `"120vw"` and `"120vh"`

**Technical Notes:**
- Pattern B from research.md: explicit two-group fromTo with shared position parameter
- `fromTo()` is preferred over `from()` to explicitly control both start and end points
- GSAP position parameter `0` means "at 0 seconds into the timeline" — both groups start at same point

---

### FE-T-003 — Implement Group B [0,1,2] entry from top-left with sync

| Field | Value |
|-------|-------|
| **Type** | 🎨 Frontend |
| **Priority** | P0 |
| **Estimate** | 1.5 hours |
| **Source** | sys.md FR-002, FR-004, FR-005; plan.md §4.2 (ADR: Pattern B); AGENTS.md Group B |
| **Depends On** | FE-T-002 |
| **Parallel** | No |
| **Story** | US1 |
| **Milestone** | MS2 |
| **Owner** | Mohamed Aimen Raed |

**Description:**
Add the second `fromTo()` call in the same Phase 3 section, handling cards at indices [0, 1, 2] (left arm of V per BR-001).

Implementation:
1. Filter `.phase-3-img` elements to get cards at indices 0, 1, 2
2. Use `tl.fromTo(groupB, { x: "-120vw", y: "-120vh" }, { x: 0, y: 0, duration: 0.82, stagger: 0.12, ease: "power2.out" }, 0)` — SAME position `0`. **Duration = 0.82s** (not 0.7s) to equalize total animation time with Group A (see QL-01 resolution)
3. Entry point: top-left offscreen (`x: "-120vw", y: "-120vh"`)
4. Gather point: `x: 0, y: 0` (same as Group A)
5. **Critical**: position parameter MUST be `0` (same as FE-T-002) for synchronization (FR-005)

**Expected Outputs:**
- [ ] Modified `apps/web/src/hooks/use-hero-animation.ts` — Group B fromTo added alongside Group A

**Acceptance Criteria:**
- [ ] Cards [0,1,2] start from offscreen top-left (AC-002)
- [ ] Cards [0,1,2] move downward to gather point smoothly (AC-004)
- [ ] Both groups start and end within ≤ 50ms of each other (AC-005, FR-005)
- [ ] Animation plays correctly with ScrollTrigger (scroll-driven)
- [ ] No visual overlap or collision between the two groups during entry (RK-001)

**Risks / Attention Points:**
- RK-002: Synchronization — verify visually that both groups start and end together
- RK-001: Top-left and bottom-right paths should not cross — geometrically they shouldn't since they converge to center from opposite corners

**Technical Notes:**
- Both `fromTo()` calls use position `0` — GSAP documentation confirms this synchronizes them at the same point in the parent timeline
- **QL-01 Resolution**: Group B duration set to 0.82s (not 0.7s) to equalize total animation time:
  - Group A: 0.7s + (0.12 × 3) = 1.06s total
  - Group B: 0.82s + (0.12 × 2) = 1.06s total
  - End-sync difference: 0ms ✅ (FR-005 requires ≤50ms)
- Both groups START at position 0 (synchronized start) AND END at the same time (synchronized end)

---

**Checkpoint**: Split entry animation functional — both groups enter from opposite directions

---

## Phase 3: User Story 2 — Verify Final Positions (Priority: P1)

**Goal**: التأكد من أن المواقع النهائية لجميع الكروت السبعة مطابقة تماماً للسلوك السابق
**Source**: sys.md Scenario 2, FR-006, FR-007
**Independent Test**: مقارنة إحداثيات الكروت بعد الأنيميشن مع القيم المرجعية
**Milestone**: MS3

### FE-T-004 — Verify final positions, responsive, and performance

| Field | Value |
|-------|-------|
| **Type** | 🎨 Frontend |
| **Priority** | P0 |
| **Estimate** | 1 hour |
| **Source** | sys.md FR-006, FR-007, AC-006, AC-007; NFR-001, NFR-003 |
| **Depends On** | FE-T-003 |
| **Parallel** | No |
| **Story** | US2 |
| **Milestone** | MS3 |
| **Owner** | Mohamed Aimen Raed |

**Description:**
Run the dev server and perform comprehensive verification:
1. **Final positions (AC-006, AC-007)**: After animation completes, verify all 7 cards are in their correct V-Formation positions. Compare with hero-config.ts reference values. Deviation must be ≤ 1px per card (BR-002).
2. **Performance (NFR-001)**: Open DevTools Performance tab, record during animation, verify ≥ 60fps with no frame drops. Total animation ≤ 2 seconds.
3. **Responsive (NFR-003)**: Test on 3 breakpoints:
   - Desktop: ≥ 1280px
   - Tablet: 768-1280px
   - Mobile: < 768px
4. **Browser compatibility (NFR-010)**: Test on Chrome + one other browser (Firefox/Edge/Safari)
5. **Visual check**: Both groups enter from correct directions, converge, then move to V positions together.

**Expected Outputs:**
- [ ] Verification report: all 7 card positions match reference
- [ ] Performance screenshot: ≥ 60fps confirmed
- [ ] Responsive check: 3 breakpoints verified

**Acceptance Criteria:**
- [ ] All 7 cards reach their final V-Formation positions (AC-006)
- [ ] Position deviation ≤ 1px from hero-config.ts reference (AC-007)
- [ ] Animation runs at ≥ 60fps (NFR-001, KPI-003)
- [ ] Total animation ≤ 2 seconds (KPI-001)
- [ ] Works on desktop, tablet, and mobile breakpoints (NFR-003)
- [ ] No visual regression — other page elements unaffected

**Risks / Attention Points:**
- If final positions are off, it means Phase 4 (positioning) was accidentally affected — revert and check
- Mobile may need different offscreen values if `120vw`/`120vh` causes scrollbar issues

**Technical Notes:**
- Use DevTools Elements panel to inspect computed styles of each card after animation
- Compare `top`, `left`, `rotation` values with hero-config.ts cardPositions
- quickstart.md has the full verification checklist

---

**Checkpoint**: All acceptance criteria verified — feature complete

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates and feature closure
**Milestone**: MS3

### CC-T-001 — Update documentation and close feature

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P2 |
| **Estimate** | 0.5 hours |
| **Source** | plan.md §12 (Project Structure), §16.2 (Pre-Launch Checklist) |
| **Depends On** | FE-T-004 |
| **Parallel** | No |
| **Story** | Polish |
| **Milestone** | MS3 |
| **Owner** | Mohamed Aimen Raed |

**Description:**
1. Update plan.md Pre-Launch Checklist (§16.2) — mark completed items
2. Commit all changes with descriptive message referencing FR-001..FR-007
3. Create PR to main branch (if applicable)
4. Update quickstart.md if any values changed during implementation (offscreen coordinates, timing)

**Expected Outputs:**
- [ ] Updated plan.md §16.2 checklist
- [ ] Git commit with all changes
- [ ] PR ready for merge (optional)

**Acceptance Criteria:**
- [ ] All code changes committed
- [ ] plan.md Pre-Launch Checklist updated
- [ ] No uncommitted changes remain

**Risks / Attention Points:**
- None

**Technical Notes:**
- None

---

## Dependencies & Execution Order

### Phase Dependencies

```text
FE-T-002 (Understand code + Group A entry)
    ↓
FE-T-003 (Group B entry + sync — duration: 0.82s)
    ↓
FE-T-004 (Verify all)
    ↓
CC-T-001 (Close)
```

### Execution Notes

- **Strictly sequential** — each task depends on the previous one
- **No parallel opportunities** — single file, single developer, sequential modifications
- **MVP**: FE-T-002 + FE-T-003 = split entry working (2 tasks, 4h)
- **Complete**: + FE-T-004 + CC-T-001 = verified and closed (4 tasks, 5.5h)

---

## Milestone Mapping

| Milestone | Phase | Tasks | Total Estimate |
|-----------|-------|-------|----------------|
| MS1+MS2: Code understood + Split entry working | US1 (MVP) | FE-T-002, FE-T-003 | 4 hours |
| MS3: Verified + closed | US2 + Polish | FE-T-004, CC-T-001 | 1.5 hours |

---

## Implementation Strategy

### MVP First (Recommended)

1. FE-T-002: Understand code + Group A from bottom-right (2.5h)
2. FE-T-003: Group B from top-left + sync — duration 0.82s (1.5h)
3. **STOP and VALIDATE**: Visual check — both groups entering from correct directions and ending together
4. FE-T-004: Full verification (1h)
5. CC-T-001: Close (0.5h)

**Total**: ~5.5 hours (1 working day)

---

## Post-Generation Review

### Duplication Check
- [x] No two tasks produce the same file (FE-T-002 and FE-T-003 modify use-hero-animation.ts but different aspects)
- [x] No semantic duplicates

### Orphan Check
- [x] Every task has a source (plan/sys section)
- [x] Every task has at least one expected output
- [x] No orphan tasks (linear dependency chain)

### Estimate Sanity Check
- [x] No task exceeds 4 hours (max is 2.5h)
- [x] Total estimate (5.5h) realistic for single-file animation change
- [x] Layer distribution matches project type (100% frontend + documentation)

### Testability Check
- [x] Every acceptance criterion is testable (visual + DevTools + coordinate comparison)
- [x] Both user stories have independent test descriptions

### Traceability Check
- [x] Every task traces to plan.md or sys.md
- [x] FR-001 → FE-T-002, FR-002 → FE-T-003, FR-003 → FE-T-002, FR-004 → FE-T-003, FR-005 → FE-T-002+003, FR-006 → FE-T-004, FR-007 → FE-T-004
- [x] All AGENTS.md entities covered: Card groups in FE-T-002/003, Formation in FE-T-004, AnimationPhase in FE-T-001

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

## Changelog

| التاريخ | الإصدار | التغيير | المؤلف |
|---------|---------|--------|--------|
| 2026-03-18 | 1.0 | إنشاء المهام — 5 مهام (4 FE + 1 CC) | Claude |
| 2026-03-18 | 1.1 | سد فجوات التحليل: دمج FE-T-001 في FE-T-002، حل تزامن QL-01 (Group B duration=0.82s)، تحديث التقديرات والاعتماديات | Claude |
