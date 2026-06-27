# Static Data Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move remaining rule-like constants and product data out of app code into typed static data modules with loader coverage and regression tests.

**Architecture:** Keep existing UI and planner behavior stable while extracting data definitions into `src/stardew/data`. Business code should consume those modules through small helper APIs so future data updates do not require touching presentation logic. Use the existing static data loader as the fallback boundary and add tests around both loader validation and behavior equivalence.

**Tech Stack:** React, TypeScript, Node test runner, Tauri 2, JSON modules, existing static data loader.

---

### Task 1: Externalize rule datasets

**Files:**
- Create: `src/stardew/data/preparationItemNames.json`
- Create: `src/stardew/data/preparationItemRules.json`
- Create: `src/stardew/data/sprinklerItems.json`
- Create: `src/stardew/data/itemIconIds.json`
- Modify: `src/stardew/data/staticDataLoader.ts`
- Modify: `src/stardew/data/staticDataLoader.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('static data loader exposes preparation, sprinkler, and icon id sections', () => {
  const resolved = resolveStaticDataPack(validPack());
  assert.ok(Array.isArray(resolved.sections.preparationItemRules));
});
```

- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 2: Switch consumers to data modules

**Files:**
- Modify: `src/app/itemIcons.ts`
- Modify: `src/app/preparationStatus.ts`
- Modify: `src/app/explorationStatus.ts`
- Modify: `src/app/displayFormat.ts`
- Modify: `src/stardew/data/equipmentNames.ts`

- [ ] **Step 1: Write failing tests for current hardcoded paths**
- [ ] **Step 2: Run tests and confirm the old path fails the new assertions**
- [ ] **Step 3: Replace hardcoded sets/maps with data-backed helpers**
- [ ] **Step 4: Re-run the focused tests**
- [ ] **Step 5: Commit**

### Task 3: Regression and full verification

**Files:**
- Modify: `src/app/itemIcons.test.ts`
- Modify: `src/app/preparationStatus.test.ts`
- Modify: `src/app/explorationStatus.test.ts`
- Modify: `src/stardew/data/staticDataLoader.test.ts`
- Modify: `src/stardew/data/staticData.test.ts`

- [ ] **Step 1: Add regression coverage for game data behavior**
- [ ] **Step 2: Run the focused test files**
- [ ] **Step 3: Run `npm run typecheck`**
- [ ] **Step 4: Run `npm test`**
- [ ] **Step 5: Run `npm run build`**
- [ ] **Step 6: Run `cargo test --manifest-path src-tauri/Cargo.toml`**
- [ ] **Step 7: Run `npm run tauri:build`**
- [ ] **Step 8: Commit**
