import type { PlannerInput, RecommendationItem } from '../../../shared/types.ts';
import { FESTIVALS } from '../../data/calendar.ts';
import { formatChineseMonthDay } from '../sharedFormatting.ts';

export function buildFestivalReminders(input: PlannerInput): RecommendationItem[] {
  const festival = FESTIVALS.find(
    (item) => item.season === input.planDate.season
      && item.day <= input.planDate.day
      && input.planDate.day <= (item.endDay ?? item.day),
  );
  if (!festival) {
    return [];
  }

  return [{
    id: `festival-${festival.id}`,
    title: `今天有${festival.name}`,
    category: 'reminder',
    priority: 'must_do',
    confidence: 'high',
    reason: `今天是节日当天，可能影响商店、NPC日程和可安排行动。${festival.timeHint}。`,
    evidence: [
      { source: 'static_data', label: '节日', value: `${formatChineseMonthDay(input.planDate)} ${festival.name}` },
    ],
    uncertainty: ['节日参加与否由玩家决定，进入节日区域可能推进当天时间安排。'],
  }];
}
