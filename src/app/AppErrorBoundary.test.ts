import test from 'node:test';
import assert from 'node:assert/strict';
import { formatUnknownError } from './AppErrorBoundary.ts';

test('formats Error instances for the visible crash screen', () => {
  assert.equal(formatUnknownError(new Error('boom')), 'boom');
});

test('formats non-Error thrown values for the visible crash screen', () => {
  assert.equal(formatUnknownError('bad state'), 'bad state');
});

test('falls back when thrown value cannot be described', () => {
  assert.equal(formatUnknownError(null), '未知错误');
});

test('falls back in English when thrown value cannot be described', () => {
  assert.equal(formatUnknownError(null, 'en-US'), 'Unknown error');
});
