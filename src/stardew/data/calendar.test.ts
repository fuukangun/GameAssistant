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

test('covers the 1.2.0 core festival calendar', () => {
  const requiredFestivalIds = [
    'egg-festival',
    'flower-dance',
    'luau',
    'dance-of-moonlight-jellies',
    'stardew-valley-fair',
    'spirits-eve',
    'festival-of-ice',
    'night-market',
    'feast-of-the-winter-star',
  ];

  assert.deepEqual(
    requiredFestivalIds.filter((id) => !FESTIVALS.some((festival) => festival.id === id)),
    [],
  );
});

test('validates festival localization and date ranges', () => {
  for (const festival of FESTIVALS) {
    assert.ok(festival.name.length > 0, `${festival.id} needs a Chinese name`);
    assert.ok(festival.nameEn.length > 0, `${festival.id} needs an English name`);
    assert.ok(festival.timeHint.length > 0, `${festival.id} needs a Chinese time hint`);
    assert.ok(festival.timeHintEn.length > 0, `${festival.id} needs an English time hint`);
    assert.ok(festival.planningTips.length > 0, `${festival.id} needs Chinese planning tips`);
    assert.ok(festival.planningTipsEn.length > 0, `${festival.id} needs English planning tips`);
    assert.ok(festival.day >= 1 && festival.day <= 28, `${festival.id} day must be in season`);
    if (festival.endDay !== undefined) {
      assert.ok(festival.endDay >= festival.day, `${festival.id} endDay must not precede day`);
      assert.ok(festival.endDay <= 28, `${festival.id} endDay must be in season`);
    }
  }
});

test('models the night market as one multi-day festival', () => {
  const nightMarkets = FESTIVALS.filter((festival) => festival.id === 'night-market');

  assert.equal(nightMarkets.length, 1);
  assert.equal(nightMarkets[0].season, 'winter');
  assert.equal(nightMarkets[0].day, 15);
  assert.equal(nightMarkets[0].endDay, 17);
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
