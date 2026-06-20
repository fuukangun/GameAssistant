import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMinePreparationAdvice, buildPreparationStatus } from './preparationStatus.ts';
import type { InventoryItem, PlayerSummary, StardewSaveSnapshot } from '../shared/types.ts';

test('summarizes the first three recognized food items without Unknown Item', () => {
  const status = buildPreparationStatus(snapshot({
    inventory: [
      { id: 403, name: 'Field Snack', stack: 3, isEdible: true, source: 'backpack' },
      { id: 196, name: 'Salad', stack: 8, energy: 113, health: 50 },
      { id: 220, name: 'Chocolate Cake', stack: 2, isEdible: true },
      { id: 226, name: 'Spicy Eel', stack: 1, isEdible: true },
    ],
  }));

  assert.equal(rowValue(status.items, '食物'), '田野小食 x3（背包）、沙拉 x8、巧克力蛋糕 x2 等4种');
  assert.doesNotMatch(rowValue(status.items, '食物'), /Unknown Item/);
});

test('recognizes bomb variants and staircases by item id and name', () => {
  const status = buildPreparationStatus(snapshot({
    inventory: [
      { id: 286, name: 'Cherry Bomb', stack: 1 },
      { id: '(O)287', name: 'Bomb', stack: 4 },
      { id: 288, name: 'Mega Bomb', stack: 2 },
      { id: 71, name: 'Staircase', stack: 5 },
    ],
  }));

  assert.equal(rowValue(status.items, '炸弹'), '樱桃炸弹 x1、炸弹 x4、超级炸弹 x2');
  assert.equal(rowValue(status.items, '楼梯'), '楼梯 x5');
});

test('describes missing weapon and missing food explicitly', () => {
  const status = buildPreparationStatus(snapshot({
    player: {
      health: 42,
      maxHealth: 100,
      equipment: { ringNames: [] },
    },
    inventory: [
      { id: 390, name: 'Stone', stack: 30, isEdible: false },
    ],
  }));

  assert.equal(rowValue(status.items, '生命'), '42 / 100（偏低）');
  assert.equal(rowValue(status.items, '武器'), '未拥有武器');
  assert.equal(rowValue(status.items, '食物'), '未携带食物');
});

test('suggests an entry target before the first mine push', () => {
  const advice = buildMinePreparationAdvice(snapshot({
    farm: { mineLevel: 0 },
    inventory: [
      { id: 403, name: 'Field Snack', stack: 3, isEdible: true },
    ],
  }));

  assert.equal(advice.readiness, 'ready');
  assert.equal(advice.targetLevel.current, 0);
  assert.equal(advice.targetLevel.recommended, 5);
  assert.equal(advice.targetLevel.step, 5);
  assert.equal(advice.targetLevel.label, '先推进到 5 层电梯点');
  assert.deepEqual(advice.riskNotes, ['运势见顶部。']);
});

test('uses a wider target when early mine supplies include bombs and staircases', () => {
  const advice = buildMinePreparationAdvice(snapshot({
    farm: { mineLevel: 35 },
    inventory: [
      { id: 196, name: 'Salad', stack: 5, energy: 113, health: 50 },
      { id: 287, name: 'Bomb', stack: 8 },
      { id: 71, name: 'Staircase', stack: 2 },
    ],
  }));

  assert.equal(advice.readiness, 'strong');
  assert.equal(advice.targetLevel.recommended, 45);
  assert.equal(advice.targetLevel.step, 10);
  assert.equal(advice.targetLevel.label, '尝试推进 10 层到 45 层');
  assert.deepEqual(advice.evidence.map((item) => item.label), ['当前矿洞', '建议目标', '生命', '武器', '食物', '炸弹', '楼梯']);
});

test('keeps the final mine target capped at level 120', () => {
  const advice = buildMinePreparationAdvice(snapshot({
    farm: { mineLevel: 118 },
    inventory: [
      { id: 220, name: 'Chocolate Cake', stack: 2, isEdible: true },
      { id: 288, name: 'Mega Bomb', stack: 3 },
      { id: 71, name: 'Staircase', stack: 1 },
    ],
  }));

  assert.equal(advice.targetLevel.recommended, 120);
  assert.equal(advice.targetLevel.step, 2);
  assert.equal(advice.targetLevel.label, '冲刺到 120 层');
});

test('downgrades readiness and reports risks for low health or missing food', () => {
  const advice = buildMinePreparationAdvice(snapshot({
    farm: { mineLevel: 45 },
    player: {
      health: 38,
      maxHealth: 100,
      equipment: { ringNames: [], weaponName: 'Rusty Sword' },
    },
    inventory: [
      { id: 287, name: 'Bomb', stack: 3 },
    ],
  }));

  assert.equal(advice.readiness, 'cautious');
  assert.match(advice.riskNotes.join(' '), /生命偏低/);
  assert.match(advice.riskNotes.join(' '), /未携带食物/);
  assert.doesNotMatch(advice.riskNotes.join(' '), /dailyLuck|-?\d+\.\d+/);
  assert.deepEqual(advice.riskNotes.at(-1), '运势见顶部。');
});

test('keeps mine prep cautious when the weapon is missing but food is available', () => {
  const advice = buildMinePreparationAdvice(snapshot({
    farm: { mineLevel: 15 },
    player: {
      health: 70,
      maxHealth: 100,
      equipment: { ringNames: [] },
    },
    inventory: [
      { id: 196, name: 'Salad', stack: 2, energy: 113, health: 50 },
    ],
  }));

  assert.equal(advice.readiness, 'cautious');
  assert.match(advice.riskNotes.join(' '), /未拥有武器/);
  assert.doesNotMatch(advice.riskNotes.join(' '), /未携带食物/);
});

test('does not widen mine target when core supplies are missing despite utility items', () => {
  const advice = buildMinePreparationAdvice(snapshot({
    farm: { mineLevel: 35 },
    player: {
      health: 85,
      maxHealth: 100,
      equipment: { ringNames: [], weaponName: 'Rusty Sword' },
    },
    inventory: [
      { id: 287, name: 'Bomb', stack: 8 },
      { id: 71, name: 'Staircase', stack: 2 },
    ],
  }));

  assert.equal(advice.readiness, 'cautious');
  assert.equal(advice.targetLevel.recommended, 40);
  assert.equal(advice.targetLevel.step, 5);
  assert.match(advice.riskNotes.join(' '), /未携带食物/);
});

test('keeps mine prep cautious without a weapon even when food and utility items are available', () => {
  const advice = buildMinePreparationAdvice(snapshot({
    farm: { mineLevel: 35 },
    player: {
      health: 85,
      maxHealth: 100,
      equipment: { ringNames: [] },
    },
    inventory: [
      { id: 196, name: 'Salad', stack: 5, energy: 113, health: 50 },
      { id: 287, name: 'Bomb', stack: 8 },
      { id: 71, name: 'Staircase', stack: 2 },
    ],
  }));

  assert.equal(advice.readiness, 'cautious');
  assert.equal(advice.targetLevel.recommended, 40);
  assert.equal(advice.targetLevel.step, 5);
  assert.match(advice.riskNotes.join(' '), /未拥有武器/);
});

function rowValue(items: { label: string; value: string }[], label: string): string {
  const row = items.find((item) => item.label === label);
  assert.ok(row, `Missing status row: ${label}`);
  return row.value;
}

function snapshot(partial: {
  farm?: { mineLevel?: number };
  player?: Partial<PlayerSummary>;
  inventory?: InventoryItem[];
}): StardewSaveSnapshot {
  return {
    player: {
      maxEnergy: 270,
      health: 100,
      maxHealth: 100,
      maxItems: 36,
      equipment: { ringNames: [], weaponName: 'Rusty Sword' },
      ...partial.player,
    },
    inventory: [],
    ...partial,
    farm: {
      mineLevel: 20,
      ...partial.farm,
    },
  } as StardewSaveSnapshot;
}
