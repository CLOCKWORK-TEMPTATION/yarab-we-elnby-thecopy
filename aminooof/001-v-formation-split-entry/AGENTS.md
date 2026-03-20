# Entities: V-Formation Split Entry Animation

> Extracted from [sys.md](sys.md) — FR-001..007, BR-001..002

---

## Card (كارت)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| index | number | Yes | 0 ≤ index ≤ 6 | Unique identifier within formation |
| group | enum | Yes | `"bottom-right"` \| `"top-left"` | Determined by BR-001 |
| entryPoint | {x, y} | Yes | Offscreen coordinates | Group A: bottom-right, Group B: top-left |
| gatherPoint | {x, y} | Yes | y: 0 (center) | Shared between both groups |
| finalPosition | {top, left, rotation} | Yes | From hero-config.ts | Must match reference ≤ 1px (BR-002) |

### Group Assignment (BR-001)

| Group | Name | Indices | Entry Direction | Movement |
|-------|------|---------|----------------|----------|
| A | bottom-right | [3, 4, 5, 6] | أسفل-يمين خارج الشاشة | صعود ↑ |
| B | top-left | [0, 1, 2] | أعلى-يسار خارج الشاشة | هبوط ↓ |

---

## Formation (تكوين)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string | Yes | `"V"` for this feature |
| cards | Card[7] | Yes | Always 7 cards |
| entryAnimation | AnimationPhase[] | Yes | 3 phases: entry → gather → position |

---

## AnimationPhase (مرحلة أنيميشن)

| Phase | Name | Duration | Easing | Description |
|-------|------|----------|--------|-------------|
| 1 | Entry | ~0.7s per card (stagger 0.12s) | power2.out | المجموعتان تدخلان من اتجاهين متعاكسين |
| 2 | Gather | implicit (end of entry) | — | الكروت تصل لنقطة التجمع y:0 |
| 3 | Position | ~3.3s | power3.inOut | السبعة يتجهون لمواقعهم النهائية في شكل V |

### State Transitions

```text
[offscreen] → Entry Phase → [gather point y:0] → Position Phase → [final V position]
                                                                         │
                                                                    STABLE STATE
```

---

## Validation Rules

1. **BR-001**: Cards [3,4,5,6] MUST be in group `bottom-right`, cards [0,1,2] MUST be in group `top-left`
2. **BR-002**: Final positions MUST NOT change — deviation ≤ 1px from hero-config.ts reference
3. **FR-005**: Both groups MUST start and end within ≤ 50ms of each other
4. **NFR-001**: Total animation ≤ 2 seconds at ≥ 60fps

---

## Key File Mapping

| Entity | Source File | Modifiable |
|--------|-----------|------------|
| Card positions (final) | `apps/web/src/lib/hero-config.ts` | NO |
| Card animation (entry) | `apps/web/src/hooks/use-hero-animation.ts` | YES — Phase 3 only |
| Card DOM elements | `apps/web/src/components/HeroAnimation.tsx` | NO |
| V_LAYOUT coordinates | `apps/web/src/components/LauncherCenterCard.tsx` | NO |
