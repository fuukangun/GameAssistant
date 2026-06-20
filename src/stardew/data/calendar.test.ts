import test from 'node:test';
import assert from 'node:assert/strict';
import { BIRTHDAYS, FESTIVALS } from './calendar.ts';
import birthdays from './birthdays.json' with { type: 'json' };
import festivals from './festivals.json' with { type: 'json' };

test('loads birthdays from external JSON data', () => {
  assert.deepEqual(BIRTHDAYS, birthdays);
});

test('loads festivals from external JSON data', () => {
  assert.deepEqual(FESTIVALS, festivals);
});

test('covers all core social npc birthdays from the wiki table', () => {
  assert.equal(BIRTHDAYS.length, 34);
  assert.deepEqual(BIRTHDAYS.find((birthday) => birthday.npc === 'Alex'), {
    npc: 'Alex',
    season: 'summer',
    day: 13,
  });
  assert.deepEqual(BIRTHDAYS.find((birthday) => birthday.npc === 'Sebastian'), {
    npc: 'Sebastian',
    season: 'winter',
    day: 10,
  });
});
