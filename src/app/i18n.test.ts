import test from 'node:test';
import assert from 'node:assert/strict';
import { formatGoalLabel, formatPlanTitle, formatWeatherLabel, t } from './i18n.ts';

test('formats core UI labels in Chinese and English', () => {
  assert.equal(t('zh-CN', 'app.title'), '游戏助手');
  assert.equal(t('en-US', 'app.title'), 'Game Assistant');
  assert.equal(t('zh-CN', 'game.stardewValley'), '星露谷物语');
  assert.equal(t('zh-CN', 'game.saveCount', { count: 4 }), '已识别存档 4');
  assert.equal(t('zh-CN', 'saves.manualPick'), '选择存档文件夹并导入');
  assert.equal(t('zh-CN', 'notice.afterSleepSave'), '当前计划基于最近一次睡觉后的存档生成');
  assert.equal(t('en-US', 'notice.afterSleepSave'), 'Generated from the most recent after-sleep save');
  assert.equal(formatGoalLabel('money', 'en-US'), 'Money First');
  assert.equal(formatWeatherLabel('stormy', 'en-US'), 'Storm');
  assert.equal(t('zh-CN', 'navigation.backToTop'), '返回顶部');
  assert.equal(t('zh-CN', 'summary.skullCavern'), '骷髅洞穴');
  assert.equal(t('en-US', 'summary.volcanoDungeon'), 'Volcano Dungeon');
  assert.equal(t('zh-CN', 'inventory.source.chest'), '储物箱');
  assert.equal(t('en-US', 'inventory.source.chest'), 'Chest');
  assert.equal(t('zh-CN', 'exploration.section.mapUnlocks'), '地图解锁');
  assert.equal(t('en-US', 'exploration.section.mapUnlocks'), 'Map Unlocks');
  assert.equal(t('zh-CN', 'communityProgress.deliverableCount', { count: 3 }), '当前库存可交付 3 项');
  assert.equal(t('en-US', 'communityProgress.deliverableCount', { count: 3 }), '3 deliverable items in inventory');
  assert.equal(t('zh-CN', 'communityProgress.title'), '社区中心收集包');
  assert.equal(t('en-US', 'communityProgress.title'), 'Community Center Bundles');
  assert.equal(t('zh-CN', 'jojaProgress.price', { price: 15000 }), '15000金');
  assert.equal(t('en-US', 'jojaProgress.price', { price: 15000 }), '15000g');
});

test('interpolates translated strings', () => {
  assert.equal(t('en-US', 'giftModal.title', { npc: 'Sebastian' }), 'Giftable Items for Sebastian');
});

test('formats localized plan titles', () => {
  const planDate = { year: 1, season: 'winter' as const, day: 23, sourceSaveDate: { year: 1, season: 'winter' as const, day: 23 } };

  assert.equal(formatPlanTitle(planDate, 'zh-CN'), '今日计划 - 第1年 冬季 第23日');
  assert.equal(formatPlanTitle(planDate, 'en-US'), "Today's Plan - Winter 23, Year 1");
});
