import test from 'node:test';
import assert from 'node:assert/strict';
import { formatItemName } from './itemDisplay.ts';

test('uses catalog Chinese names for Chinese UI when save item names are English', () => {
  assert.equal(formatItemName({ id: 117, name: 'Anchor' }, 'zh-CN'), '锚');
  assert.equal(formatItemName({ id: 388, name: 'Wood' }, 'zh-CN'), '木材');
  assert.equal(formatItemName({ id: 201, name: 'Complete Breakfast' }, 'zh-CN'), '完整早餐');
});

test('keeps save item names for English UI', () => {
  assert.equal(formatItemName({ id: 117, name: 'Anchor' }, 'en-US'), 'Anchor');
});

test('falls back to save item name when catalog entry is missing', () => {
  assert.equal(formatItemName({ id: 'UnknownModItem', name: 'Mystery Mod Item' }, 'zh-CN'), 'Mystery Mod Item');
});
