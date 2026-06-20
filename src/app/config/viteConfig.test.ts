import test from 'node:test';
import assert from 'node:assert/strict';
import viteConfig from '../../../vite.config.ts';

test('uses relative asset paths for Tauri packaged apps', () => {
  assert.equal(viteConfig.base, './');
});
