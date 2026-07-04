import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecommendationTabs } from './recommendationTabs.ts';

test('creates dashboard tabs in display order', () => {
  const tabs = createRecommendationTabs({ reminders: [], actions: [] });

  assert.deepEqual(tabs.map((tab) => tab.id), ['reminders', 'actions', 'calendar', 'skills', 'friendship', 'exploration']);
  assert.equal(tabs[0].label, '重要提醒');
  assert.equal(tabs[1].label, '推荐行动');
  assert.equal(tabs[2].label, '季节日历');
  assert.equal(tabs[3].label, '角色技能');
  assert.equal(tabs[4].label, '友谊维系');
  assert.equal(tabs[5].label, '探索进度');
});
