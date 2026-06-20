import test from 'node:test';
import assert from 'node:assert/strict';
import { getUserMessageForError } from './result.ts';

test('maps save directory errors to a user-facing message', () => {
  assert.equal(
    getUserMessageForError({ code: 'save_dir_not_found', message: 'missing', recoverable: true }),
    '未在默认路径找到星露谷存档，请手动选择存档目录。',
  );
});

test('falls back to error message for unknown codes', () => {
  assert.equal(
    getUserMessageForError({ code: 'custom_error', message: '自定义错误', recoverable: true }),
    '自定义错误',
  );
});
