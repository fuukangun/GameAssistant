import { formatNpcName } from '../displayFormat.ts';
import type { AppLanguage } from '../config/localConfig.ts';
import type { Festival } from '../../stardew/data/calendar.ts';
import { festivalName, festivalTimeHint, festivalTips } from './calendarEvents.ts';

export function formatBirthdayMessage(input: {
  npc: string;
  birthdayDay: number;
  currentDay: number;
  giftsThisWeek: number;
  giftedToday?: boolean;
  daysBeforeBirthday: number;
  daysAfterBirthdayInWeek: number;
  isSundayBirthday: boolean;
  language: AppLanguage;
}): string {
  const opportunities = getPreBirthdayGiftOpportunities(input.daysBeforeBirthday, input.giftsThisWeek, input.giftedToday);
  if (input.language === 'en-US') {
    return formatBirthdayMessageEn(input, opportunities);
  }

  if (input.daysBeforeBirthday > 0 && input.giftsThisWeek >= 2) {
    return `本周已给 ${input.npc} 送满 2 次常规礼物，Day ${input.birthdayDay} 生日当天仍可突破上限再送 1 次。`;
  }
  if (input.daysBeforeBirthday > 0 && input.giftedToday === undefined) {
    return `${input.npc} 的生日是 Day ${input.birthdayDay}，请先确认今天是否已经送礼；若今天还能送，可优先补 1 次常规礼物。`;
  }
  if (input.daysBeforeBirthday > 0 && input.giftsThisWeek === 0 && opportunities >= 2) {
    return `${input.npc} 的生日是 Day ${input.birthdayDay}，生日前还有 ${opportunities} 个可送礼日，建议先送满 2 次常规礼物，生日当天可突破上限再送第 3 次。`;
  }
  if (input.daysBeforeBirthday > 0 && input.giftsThisWeek === 0 && opportunities === 1) {
    return `${input.npc} 的生日是 Day ${input.birthdayDay}，生日前只剩 1 个可送礼日，建议先送 1 次常规礼物，生日当天再送生日礼物。`;
  }
  if (input.daysBeforeBirthday > 0 && input.giftsThisWeek === 0) {
    return `${input.npc} 即将生日，已来不及在生日前送满常规礼物；请优先准备生日礼物。`;
  }
  if (input.daysBeforeBirthday > 0 && input.giftsThisWeek === 1 && opportunities >= 1) {
    return `本周已给 ${input.npc} 送过 1 次，建议在 Day ${input.birthdayDay} 生日前再送 1 次常规礼物，生日当天可突破上限送第 3 次。`;
  }
  if (input.daysBeforeBirthday > 0 && input.giftsThisWeek === 1) {
    return `${input.npc} 即将生日，生日前已无可补送常规礼物的时间；请优先准备生日礼物。`;
  }
  if (input.daysBeforeBirthday > 0) {
    return `${input.npc} 即将生日，已来不及在生日前送满常规礼物；请优先准备生日礼物。`;
  }
  if (input.isSundayBirthday) {
    return `今天是 ${input.npc} 生日，优先送出最爱或喜欢礼物；今天是本周第一天，本周该 NPC 还可再收 1 次常规礼物。`;
  }
  if (input.giftsThisWeek >= 2) {
    return `今天是 ${input.npc} 生日，虽然本周已送满，但生日可突破上限再送 1 次。`;
  }
  if (input.giftsThisWeek === 0 && input.daysAfterBirthdayInWeek === 0) {
    return `今天是 ${input.npc} 生日，优先送出最爱或喜欢礼物；今天是本周最后一天，本周已无后续常规送礼时间。`;
  }
  if (input.giftsThisWeek === 0) {
    return `今天是 ${input.npc} 生日，优先送出最爱或喜欢礼物；本周后续仍可继续安排常规送礼。`;
  }
  return `今天是 ${input.npc} 生日，优先送出最爱或喜欢礼物。`;
}

export function getPreBirthdayGiftOpportunities(daysBeforeBirthday: number, giftsThisWeek: number, giftedToday?: boolean): number {
  const regularGiftSlotsLeft = Math.max(0, 2 - giftsThisWeek);
  if (giftedToday === undefined || giftedToday) {
    return Math.min(Math.max(0, daysBeforeBirthday - 1), regularGiftSlotsLeft);
  }
  return Math.min(daysBeforeBirthday, regularGiftSlotsLeft);
}

export function formatMultiBirthdayMessage(birthdays: Array<{ npc: string; day: number }>, language: AppLanguage): string {
  const names = birthdays.map((birthday) => `${formatNpcName(birthday.npc, language)} Day ${birthday.day}`).join(language === 'zh-CN' ? '、' : ', ');
  return language === 'zh-CN'
    ? `本周有多个生日：${names}。每个 NPC 的每周送礼次数独立计算。`
    : `Multiple birthdays this week: ${names}. Weekly gift counts are tracked separately for each NPC.`;
}

export function formatFestivalMessage(
  festival: Festival,
  startsInDays: number,
  isFestivalDay: boolean,
  smartSuggestion: string | undefined,
  language: AppLanguage,
): string {
  const name = festivalName(festival, language);
  const timeHint = festivalTimeHint(festival, language);
  const tips = festivalTips(festival, language).join(language === 'zh-CN' ? '；' : '; ');
  const suffix = smartSuggestion ? `${language === 'zh-CN' ? ' ' : ' '}${smartSuggestion}` : '';
  if (language === 'en-US') {
    if (isFestivalDay) {
      return `${name} is today: ${timeHint}. ${tips}.${suffix}`;
    }
    if (startsInDays === 1) {
      return `${name} starts tomorrow: ${timeHint}. Final check: ${tips}.${suffix}`;
    }
    return `${name} starts in ${startsInDays} days. Prepare now: ${tips}.${suffix}`;
  }
  if (isFestivalDay) {
    return `今天是${name}：${timeHint}。${tips}。${suffix}`;
  }
  if (startsInDays === 1) {
    return `${name}明天开始：${timeHint}。最终确认：${tips}。${suffix}`;
  }
  return `${name}还有 ${startsInDays} 天开始。现在准备：${tips}。${suffix}`;
}

function formatBirthdayMessageEn(input: Parameters<typeof formatBirthdayMessage>[0], opportunities: number): string {
  if (input.daysBeforeBirthday > 0 && input.giftsThisWeek >= 2) {
    return `${input.npc} already has 2 regular gifts this week. The Day ${input.birthdayDay} birthday gift can still exceed the weekly limit.`;
  }
  if (input.daysBeforeBirthday > 0 && input.giftedToday === undefined) {
    return `${input.npc}'s birthday is Day ${input.birthdayDay}. Confirm whether you already gave a gift today before planning another regular gift.`;
  }
  if (input.daysBeforeBirthday > 0 && input.giftsThisWeek === 0 && opportunities >= 2) {
    return `${input.npc}'s birthday is Day ${input.birthdayDay}. There are ${opportunities} confirmed gift days before it, so give 2 regular gifts first and save the birthday gift as an extra third gift.`;
  }
  if (input.daysBeforeBirthday > 0 && input.giftsThisWeek === 0 && opportunities === 1) {
    return `${input.npc}'s birthday is Day ${input.birthdayDay}. Only 1 regular gift fits before then, so give that first and save the birthday gift.`;
  }
  if (input.daysBeforeBirthday > 0 && input.giftsThisWeek === 1 && opportunities >= 1) {
    return `${input.npc} has 1 gift this week. Give 1 more regular gift before Day ${input.birthdayDay}, then use the birthday gift as the extra third gift.`;
  }
  if (input.daysBeforeBirthday > 0) {
    return `${input.npc}'s birthday is coming up. There is no confirmed time left for regular gifts before it, so prepare the birthday gift.`;
  }
  if (input.isSundayBirthday) {
    return `Today is ${input.npc}'s birthday. Give a loved or liked gift; this is the first day of the week, so this NPC can still receive 1 more regular gift this week.`;
  }
  if (input.giftsThisWeek >= 2) {
    return `Today is ${input.npc}'s birthday. The weekly regular gift limit is full, but the birthday gift can still exceed it.`;
  }
  if (input.giftsThisWeek === 0 && input.daysAfterBirthdayInWeek === 0) {
    return `Today is ${input.npc}'s birthday. Give a loved or liked gift; this is the last day of the week, so there is no later regular gift window.`;
  }
  if (input.giftsThisWeek === 0) {
    return `Today is ${input.npc}'s birthday. Give a loved or liked gift; regular gifts can still be planned later this week.`;
  }
  return `Today is ${input.npc}'s birthday. Give a loved or liked gift.`;
}
