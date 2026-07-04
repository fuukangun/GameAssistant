import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendarPanelModel, getDayOfWeek, getWeekNumber } from './calendarPanelModel.ts';
import { demoSnapshot } from '../stardew/fixtures/demoSnapshot.ts';
import { createCalendarSnapshot, createPlanDate } from '../stardew/fixtures/calendarSnapshots.ts';
import type { AppLanguage } from './config/localConfig.ts';
import type { PlanDate, RelationshipSummary, Season, StardewSaveSnapshot } from '../shared/types.ts';

function snapshotWith(relationships: RelationshipSummary[], overrides: Partial<StardewSaveSnapshot> = {}): StardewSaveSnapshot {
  return {
    ...demoSnapshot,
    ...overrides,
    player: {
      ...demoSnapshot.player,
      ...overrides.player,
      equipment: {
        ...demoSnapshot.player.equipment,
        ...overrides.player?.equipment,
      },
    },
    wallet: {
      ...demoSnapshot.wallet,
      ...overrides.wallet,
    },
    relationships,
  };
}

function planDate(season: Season, day: number): PlanDate {
  return {
    year: 1,
    season,
    day,
    sourceSaveDate: { year: 1, season, day },
  };
}

function model(input: {
  season: Season;
  day: number;
  relationships?: RelationshipSummary[];
  language?: AppLanguage;
  snapshot?: Partial<StardewSaveSnapshot>;
}) {
  return createCalendarPanelModel({
    snapshot: snapshotWith(input.relationships ?? [], input.snapshot),
    planDate: planDate(input.season, input.day),
    language: input.language ?? 'zh-CN',
  });
}

test('builds four weeks and maps Stardew week starts correctly', () => {
  const calendar = model({ season: 'spring', day: 8 });

  assert.equal(calendar.weeks.length, 4);
  assert.equal(calendar.weeks.flatMap((week) => week.days).length, 28);
  assert.deepEqual([1, 8, 15, 22].map(getDayOfWeek), ['sun', 'sun', 'sun', 'sun']);
  assert.deepEqual([7, 14, 21, 28].map(getDayOfWeek), ['sat', 'sat', 'sat', 'sat']);
  assert.equal(getWeekNumber(22), 4);
  assert.equal(calendar.weeks[1].days[0].isToday, true);
});

test('places birthdays and multi-day festivals on the correct season days', () => {
  const calendar = model({ season: 'winter', day: 14 });
  const days = calendar.weeks.flatMap((week) => week.days);
  const day10 = days.find((day) => day.day === 10);
  const nightMarketDays = [15, 16, 17].map((dayNumber) => days.find((day) => day.day === dayNumber));

  assert.equal(day10?.events.some((event) => event.type === 'birthday' && event.npc === 'Sebastian'), true);
  assert.equal(nightMarketDays.every((day) => day?.events.some((event) => event.festivalId === 'night-market')), true);
});

test('warns from the birthday week start and limits pre-birthday gift promises by remaining days', () => {
  const twoDaysBefore = model({
    season: 'summer',
    day: 8,
    relationships: [{ npc: 'Alex', points: 500, hearts: 2, giftsThisWeek: 0, giftedToday: false }],
  });
  const oneDayBefore = model({
    season: 'summer',
    day: 12,
    relationships: [{ npc: 'Alex', points: 500, hearts: 2, giftsThisWeek: 0, giftedToday: false }],
  });
  const previousWeek = model({
    season: 'summer',
    day: 7,
    relationships: [{ npc: 'Alex', points: 500, hearts: 2, giftsThisWeek: 0, giftedToday: false }],
  });

  assert.match(twoDaysBefore.warnings.find((warning) => warning.id.includes('birthday:Alex'))?.message ?? '', /2/);
  assert.match(oneDayBefore.warnings.find((warning) => warning.id.includes('birthday:Alex'))?.message ?? '', /1/);
  assert.equal(previousWeek.warnings.some((warning) => warning.id.includes('birthday:Alex')), false);
});

test('does not count today as a confirmed gift opportunity when giftedToday is unknown', () => {
  const calendar = model({
    season: 'summer',
    day: 8,
    relationships: [{ npc: 'Alex', points: 500, hearts: 2, giftsThisWeek: 0 }],
  });

  const warning = calendar.warnings.find((item) => item.id.includes('birthday:Alex'));
  assert.equal(warning?.priority, 'info');
  assert.match(warning?.message ?? '', /确认今天是否已经送礼/);
});

test('does not suggest another regular gift when weekly birthday gift count is already full and giftedToday is unknown', () => {
  const calendar = model({
    season: 'summer',
    day: 8,
    relationships: [{ npc: 'Alex', points: 500, hearts: 2, giftsThisWeek: 2 }],
  });

  const warning = calendar.warnings.find((item) => item.id.includes('birthday:Alex'));
  assert.match(warning?.message ?? '', /送满 2 次常规礼物/);
  assert.doesNotMatch(warning?.message ?? '', /补 1 次|今天还能送/);
});

test('handles Sunday and Saturday birthday boundaries', () => {
  const sundayBirthday = model({
    season: 'winter',
    day: 1,
    relationships: [{ npc: 'Krobus', points: 500, hearts: 2, giftsThisWeek: 0, giftedToday: false }],
  });
  const saturdayBirthday = model({
    season: 'spring',
    day: 7,
    relationships: [{ npc: 'Lewis', points: 500, hearts: 2, giftsThisWeek: 0, giftedToday: false }],
  });

  assert.equal(sundayBirthday.warnings.some((warning) => warning.message.includes('突破上限送第 3 次')), false);
  assert.match(sundayBirthday.warnings.find((warning) => warning.id.includes('birthday:Krobus'))?.message ?? '', /本周第一天/);
  assert.match(saturdayBirthday.warnings.find((warning) => warning.id.includes('birthday:Lewis'))?.message ?? '', /本周已无后续常规送礼时间/);
});

test('summarizes multiple birthdays in the same week without merging gift counts', () => {
  const calendar = model({
    season: 'summer',
    day: 8,
    relationships: [
      { npc: 'Alex', points: 500, hearts: 2, giftsThisWeek: 0, giftedToday: false },
      { npc: 'Maru', points: 500, hearts: 2, giftsThisWeek: 2, giftedToday: true },
    ],
  });

  const summary = calendar.warnings.find((warning) => warning.type === 'multi_birthday_week');
  assert.match(summary?.message ?? '', /亚历克斯.*Day 13/);
  assert.match(summary?.message ?? '', /玛鲁.*Day 10/);
  assert.equal(calendar.warnings.some((warning) => warning.id.includes('birthday:Alex')), true);
  assert.equal(calendar.warnings.some((warning) => warning.id.includes('birthday:Maru')), true);
});

test('generates festival advance windows and the winter star special warning', () => {
  const day14 = model({ season: 'winter', day: 14 });
  const day15 = model({ season: 'winter', day: 15 });
  const winterStar = model({ season: 'winter', day: 24 });

  assert.equal(day14.warnings.some((warning) => warning.id === 'festival:night-market:1'), true);
  assert.equal(day15.warnings.some((warning) => warning.id === 'festival:night-market:today'), true);
  assert.equal(winterStar.warnings.some((warning) => warning.type === 'winter_star' && warning.message.includes('不占周上限')), true);
});

test('sorts calendar warnings by importance: must do, info, then recommended', () => {
  const calendar = model({
    season: 'winter',
    day: 8,
    relationships: [{ npc: 'Sebastian', points: 500, hearts: 2, giftsThisWeek: 2, giftedToday: true }],
  });

  assert.deepEqual(calendar.warnings.map((warning) => warning.priority), ['must_do', 'info', 'info', 'recommended', 'recommended']);
  assert.deepEqual(calendar.warnings.map((warning) => warning.id), [
    'festival:festival-of-ice:today',
    'birthday:Harvey:14',
    'festival:night-market:7',
    'birthdays:winter:week-2',
    'birthday:Sebastian:10',
  ]);
});

test('uses English festival and warning text in English mode', () => {
  const calendar = model({ season: 'winter', day: 14, language: 'en-US' });
  const nightMarket = calendar.weeks
    .flatMap((week) => week.days)
    .find((day) => day.day === 15)
    ?.events.find((event) => event.festivalId === 'night-market');

  assert.equal(nightMarket?.title, 'Night Market');
  assert.doesNotMatch(calendar.warnings.map((warning) => warning.message).join('\n'), /夜市|明天|准备/);
});

test('adds P1 festival suggestions from wallet, friendship, and fishing rod state', () => {
  const eggFestival = createCalendarPanelModel({
    snapshot: createCalendarSnapshot({ wallet: { money: 200 } }),
    planDate: createPlanDate('spring', 12),
    language: 'zh-CN',
  });
  const flowerDance = createCalendarPanelModel({
    snapshot: createCalendarSnapshot({
      relationships: [{ npc: 'Haley', points: 500, hearts: 2, giftsThisWeek: 0 }],
    }),
    planDate: createPlanDate('spring', 21),
    language: 'zh-CN',
  });
  const festivalOfIce = createCalendarPanelModel({
    snapshot: createCalendarSnapshot({ player: { equipment: { ringNames: [] } } }),
    planDate: createPlanDate('winter', 7),
    language: 'zh-CN',
  });

  assert.match(eggFestival.warnings.find((warning) => warning.id === 'festival:egg-festival:1')?.message ?? '', /金币低于 1000/);
  assert.match(flowerDance.warnings.find((warning) => warning.id === 'festival:flower-dance:3')?.message ?? '', /4 心舞伴.*还差 2 心/);
  assert.match(festivalOfIce.warnings.find((warning) => warning.id === 'festival:festival-of-ice:1')?.message ?? '', /未解析到鱼竿/);
});

test('checks Flower Dance hearts against marriage candidates instead of every social NPC', () => {
  const flowerDance = createCalendarPanelModel({
    snapshot: createCalendarSnapshot({
      relationships: [
        { npc: 'Linus', points: 2500, hearts: 10, giftsThisWeek: 0 },
        { npc: 'Haley', points: 500, hearts: 2, giftsThisWeek: 0 },
      ],
    }),
    planDate: createPlanDate('spring', 21),
    language: 'zh-CN',
  });

  assert.match(flowerDance.warnings.find((warning) => warning.id === 'festival:flower-dance:3')?.message ?? '', /4 心舞伴.*还差 2 心/);
});

test('keeps P1 festival suggestions conservative when save data is sufficient or unavailable', () => {
  const eggFestival = createCalendarPanelModel({
    snapshot: createCalendarSnapshot({ wallet: { money: 5000 } }),
    planDate: createPlanDate('spring', 12),
    language: 'en-US',
  });
  const flowerDance = createCalendarPanelModel({
    snapshot: createCalendarSnapshot({
      relationships: [{ npc: 'Haley', points: 1000, hearts: 4, giftsThisWeek: 0 }],
    }),
    planDate: createPlanDate('spring', 21),
    language: 'en-US',
  });

  const messages = [...eggFestival.warnings, ...flowerDance.warnings].map((warning) => warning.message).join('\n');
  assert.doesNotMatch(messages, /金币|还差|鱼竿/);
  assert.doesNotMatch(messages, /budget may be short|still needs/);
});
