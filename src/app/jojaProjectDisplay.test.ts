import test from 'node:test';
import assert from 'node:assert/strict';
import { formatJojaProjectName } from './jojaProjectDisplay.ts';

test('localizes Joja project names', () => {
  assert.equal(formatJojaProjectName('矿车修复', 'zh-CN'), '矿车修复');
  assert.equal(formatJojaProjectName('矿车修复', 'en-US'), 'Minecarts');
  assert.equal(formatJojaProjectName('Unknown Project', 'en-US'), 'Unknown Project');
});
