import test from 'node:test';
import assert from 'node:assert/strict';
import type { ParseWarning } from '../shared/types.ts';
import { formatParseWarningMessage } from './parseWarnings.ts';

test('localizes known parse warnings to English', () => {
  const warning: ParseWarning = {
    code: 'unsupported_multiplayer',
    severity: 'warning',
    message: '检测到多人存档数据，当前版本仅按主玩家基础字段生成计划。',
    fieldPath: 'SaveGame.farmhands',
  };

  assert.equal(
    formatParseWarningMessage(warning, 'en-US'),
    'Multiplayer save data detected. This version generates plans from the host player fields only.',
  );
});

test('keeps known parse warnings in Chinese for Chinese mode', () => {
  const warning: ParseWarning = {
    code: 'missing_field',
    severity: 'error',
    message: '存档缺少年、季节或日期字段，无法生成计划日期。',
  };

  assert.equal(formatParseWarningMessage(warning, 'zh-CN'), '存档缺少年、季节或日期字段，无法生成计划日期。');
});

test('uses localized generic copy for unknown parse warning codes', () => {
  const warning: ParseWarning = {
    code: 'modded_field_ignored',
    severity: 'info',
    message: '中文底层解析提示',
  };

  assert.equal(formatParseWarningMessage(warning, 'en-US'), 'Some save fields could not be fully parsed.');
});
