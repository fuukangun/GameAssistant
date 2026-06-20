import test from 'node:test';
import assert from 'node:assert/strict';
import { demoSnapshot } from '../stardew/fixtures/demoSnapshot.ts';
import { createPlannerStore } from './plannerStore.ts';

test('initializes planner state from a save snapshot', () => {
  const store = createPlannerStore(demoSnapshot);
  const state = store.getState();

  assert.equal(state.selectedWeather, demoSnapshot.weatherForTomorrow);
  assert.equal(state.planDate.season, 'summer');
  assert.equal(state.planDate.day, 15);
  assert.equal(state.plan.title, '今日计划 - 第1年 夏季 第15日');
});

test('updates weather in planner state', () => {
  const store = createPlannerStore(demoSnapshot);

  store.getState().setWeather('stormy');

  assert.equal(store.getState().selectedWeather, 'stormy');
  assert.doesNotMatch(store.getState().plan.title, /stormy/);
});

test('updates planner goal in planner state', () => {
  const store = createPlannerStore(demoSnapshot);

  store.getState().setGoal('money');

  assert.equal(store.getState().goal, 'money');
});

test('regenerates plan after manual correction changes', () => {
  const store = createPlannerStore(demoSnapshot);

  store.getState().setManualCorrection('harvestedToday', true);

  assert.equal(
    store.getState().plan.actions.some((item) => item.id === 'harvest-ready-crops'),
    false,
  );
});

test('rebuilds plan state when switching to another snapshot', () => {
  const store = createPlannerStore(demoSnapshot);
  const winterSnapshot = {
    ...demoSnapshot,
    time: { year: 1, season: 'winter' as const, day: 28 },
    weatherForTomorrow: 'snowy' as const,
  };

  store.getState().setManualCorrection('harvestedToday', true);
  store.getState().setSnapshot(winterSnapshot);

  const state = store.getState();
  assert.equal(state.snapshot.time.season, 'winter');
  assert.equal(state.planDate.year, 1);
  assert.equal(state.planDate.season, 'winter');
  assert.equal(state.planDate.day, 28);
  assert.equal(state.selectedWeather, 'snowy');
  assert.equal(state.manualCorrections.harvestedToday, false);
});
