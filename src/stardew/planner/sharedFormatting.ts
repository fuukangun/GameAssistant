import type { SaveTime } from '../../shared/types.ts';

export function formatChineseMonthDay(date: SaveTime): string {
  return `${formatSeason(date.season)} 第${date.day}日`;
}

function formatSeason(season: SaveTime['season']): string {
  return {
    spring: '春季',
    summer: '夏季',
    fall: '秋季',
    winter: '冬季',
  }[season];
}
