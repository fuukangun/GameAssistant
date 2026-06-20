import test from 'node:test';
import assert from 'node:assert/strict';
import { isTauriRuntime } from './tauriEnvironment.ts';

test('detects Tauri runtime from injected internals', () => {
  assert.equal(isTauriRuntime({ __TAURI_INTERNALS__: {} }), true);
  assert.equal(isTauriRuntime({}), false);
});
