import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('does not render developer links in the app sidebar', () => {
  const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  const cssSource = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

  assert.equal(appSource.includes('about-link'), false);
  assert.equal(appSource.includes('developerUrl'), false);
  assert.equal(cssSource.includes('.about-link'), false);
});
