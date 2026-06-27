# Rules/Data Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining fish, gift, static-data, community-center, and fixture gaps, then continue crop ROI, empty plot, and mine-prep rule calibration.

**Architecture:** Keep rule logic in the existing `src/stardew/data` and `src/app` helpers, and keep presentation code thin. Use the current JSON-backed static-data pattern where possible, with tests proving the runtime still falls back safely when packs are incomplete. Prefer small, local expansions over new abstractions unless they reduce repeated rule-matching logic.

**Tech Stack:** TypeScript, Node test runner, Vite/Tauri app, JSON static data modules.

---

### Task 1: Fish rule coverage

**Files:**
- Modify: `src/stardew/data/fish.ts`
- Modify: `src/stardew/data/fishCatalog.json`
- Modify: `src/stardew/data/fish.test.ts`
- Modify: `src/app/explorationStatus.ts`

- [ ] **Step 1: Write the failing test**

Add cases for more fish access gates/time windows so the current catalog behavior is pinned before changing logic.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/stardew/data/fish.test.ts`

- [ ] **Step 3: Write minimal implementation**

Expand access checks and any missing catalog entries needed by the tests.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/stardew/data/fish.test.ts src/app/explorationStatus.test.ts`

---

### Task 2: NPC gift coverage and exception cleanup

**Files:**
- Modify: `src/stardew/data/npcs.ts`
- Modify: `src/stardew/data/npcGiftPreferences.json`
- Modify: `src/stardew/data/npcs.test.ts`
- Modify: `src/app/giftSuggestions.ts`
- Modify: `src/app/giftSuggestions.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests for missing edge gifts and exception handling, especially cases that should not be treated as universal matches.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/stardew/data/npcs.test.ts src/app/giftSuggestions.test.ts`

- [ ] **Step 3: Write minimal implementation**

Add the missing exception data and tighten matching helpers where the tests show incorrect universal fallback.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/stardew/data/npcs.test.ts src/app/giftSuggestions.test.ts`

---

### Task 3: Static data externalization cleanup

**Files:**
- Modify: `src/stardew/data/staticData.ts`
- Modify: `src/stardew/data/staticDataLoader.ts`
- Modify: `src/stardew/data/staticDataLoader.test.ts`
- Modify: `src/app/recommendationDisplayData.json`
- Modify: `src/app/recommendationTextData.json`
- Modify: `src/app/explorationStatus.ts`

- [ ] **Step 1: Write the failing test**

Add tests that prove remaining runtime text/constants are still loaded from data files or safe fallbacks.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/stardew/data/staticDataLoader.test.ts`

- [ ] **Step 3: Write minimal implementation**

Move remaining hard-coded strings/constants into data files where practical, keep fallback behavior intact.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/stardew/data/staticDataLoader.test.ts src/app/recommendationDisplay.test.ts`

---

### Task 4: Community center detail and fixtures

**Files:**
- Modify: `src/stardew/data/communityCenter.ts`
- Modify: `src/app/communityCenterActionDetails.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/stardew/data/communityCenter.test.ts`
- Modify: `src/app/communityCenterActionDetails.test.ts`
- Add: fixture files under `src/stardew/fixtures/`

- [ ] **Step 1: Write the failing test**

Add coverage for more detailed deliverable grouping and the fixture scenarios that need it.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/stardew/data/communityCenter.test.ts src/app/communityCenterActionDetails.test.ts`

- [ ] **Step 3: Write minimal implementation**

Improve grouping/coverage and add the missing fixture files.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/stardew/data/communityCenter.test.ts src/app/communityCenterActionDetails.test.ts`

---

### Task 5: Crop ROI, empty plots, and mine prep calibration

**Files:**
- Modify: `src/stardew/data/crops.ts`
- Modify: `src/app/farmPlotStatus.ts`
- Modify: `src/app/preparationStatus.ts`
- Modify: `src/stardew/data/crops.test.ts`
- Modify: `src/app/farmPlotStatus.test.ts`
- Modify: `src/app/preparationStatus.test.ts`

- [ ] **Step 1: Write the failing test**

Add conservative ROI and empty-plot/mining behavior cases that are currently under-specified.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/stardew/data/crops.test.ts src/app/farmPlotStatus.test.ts src/app/preparationStatus.test.ts`

- [ ] **Step 3: Write minimal implementation**

Calibrate the existing helpers without changing the page structure.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/stardew/data/crops.test.ts src/app/farmPlotStatus.test.ts src/app/preparationStatus.test.ts`

