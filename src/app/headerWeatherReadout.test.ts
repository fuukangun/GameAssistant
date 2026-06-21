import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('renders today weather as read-only in the header', () => {
  const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  const weatherBlockStart = appSource.indexOf("t(language, 'header.weather')");
  const luckBlockStart = appSource.indexOf("t(language, 'header.luck')");

  assert.notEqual(weatherBlockStart, -1);
  assert.notEqual(luckBlockStart, -1);

  const weatherBlock = appSource.slice(weatherBlockStart, luckBlockStart);

  assert.equal(weatherBlock.includes('<select'), false);
  assert.equal(weatherBlock.includes('setWeather'), false);
  assert.match(weatherBlock, /status-readout/);
});
