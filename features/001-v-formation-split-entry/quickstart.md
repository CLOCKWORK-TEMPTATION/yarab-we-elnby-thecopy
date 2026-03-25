# Quickstart: V-Formation Split Entry Animation

## Prerequisites

- Node.js + pnpm installed
- Repository cloned and on branch `001-v-formation-split-entry`

## Setup

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

## What to Modify

**Single file**: `apps/web/src/hooks/use-hero-animation.ts`

### Current Code (Phase 3 card entry)

The current implementation uses a single `forEach` loop that moves all 7 cards from `y: "120vh"` (bottom) upward with stagger.

### Required Change

Replace the single forEach with two `fromTo()` calls:

```typescript
// Group A: cards [3,4,5,6] — enter from bottom-right, move up
// Group B: cards [0,1,2] — enter from top-left, move down
// Both use position parameter "0" for synchronization
```

### Files NOT to Touch

- `apps/web/src/lib/hero-config.ts` — final positions (read-only)
- `apps/web/src/components/HeroAnimation.tsx` — React component
- `apps/web/src/components/LauncherCenterCard.tsx` — V_LAYOUT

## Verification

1. **Visual**: Run dev server, scroll to V-Formation animation
   - 4 cards should enter from bottom-right and rise
   - 3 cards should enter from top-left and descend
   - All 7 should move to final V positions together

2. **Performance**: Open DevTools → Performance tab
   - Record during animation
   - Verify ≥ 60fps (no frame drops)

3. **Responsive**: Test on 3 breakpoints
   - Desktop: ≥ 1280px
   - Tablet: 768-1280px
   - Mobile: < 768px

4. **Final positions**: Compare card coordinates with original
   - Deviation must be ≤ 1px per card

## Key References

| Document | Purpose |
|----------|---------|
| [sys.md](sys.md) | What to build (PRD) |
| [research.md](research.md) | Technical feasibility (GSAP patterns) |
| [plan.md](plan.md) | How to build it |
| [AGENTS.md](AGENTS.md) | Entity definitions and validation rules |
