import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultPlanWeather } from './weather.ts';

test('uses parsed save weather as the default plan weather', () => {
  assert.equal(getDefaultPlanWeather({ weatherForTomorrow: 'stormy' }), 'stormy');
});

test('returns undefined when no parsed save weather is available', () => {
  assert.equal(getDefaultPlanWeather({}), undefined);
});
