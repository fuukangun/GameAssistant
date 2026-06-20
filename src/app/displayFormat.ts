import type { Confidence, FarmSummary, RecommendationItem, RelationshipSummary, Season } from '../shared/types.ts';
import { getEquipmentNameLabel } from '../stardew/data/equipmentNames.ts';
import { DISPLAY_FORMAT_LABELS } from '../stardew/data/displayFormatLabels.ts';
import type { AppLanguage } from './config/localConfig.ts';

export function formatSeason(season: Season, language: AppLanguage = 'zh-CN'): string {
  return DISPLAY_FORMAT_LABELS.seasonLabels[language][season];
}

export function formatFarmType(farmType: string, language: AppLanguage = 'zh-CN'): string {
  return DISPLAY_FORMAT_LABELS.farmTypeLabels[language][farmType] ?? farmType;
}

export function formatRoute(route: FarmSummary['communityCenterRoute'], language: AppLanguage = 'zh-CN'): string {
  return DISPLAY_FORMAT_LABELS.routeLabels[language][route];
}

export function formatPriority(priority: RecommendationItem['priority'], language: AppLanguage = 'zh-CN'): string {
  return DISPLAY_FORMAT_LABELS.priorityLabels[language][priority];
}

export function formatConfidence(confidence: Confidence, language: AppLanguage = 'zh-CN'): string {
  return DISPLAY_FORMAT_LABELS.confidenceLabels[language][confidence];
}

export function formatEquipmentName(value: string, language: AppLanguage = 'zh-CN'): string {
  if (language === 'en-US') {
    return value;
  }

  const stackMatch = value.match(/^(.+?) x(\d+)$/);
  if (stackMatch) {
    return `${getEquipmentNameLabel(stackMatch[1]) ?? stackMatch[1]} x${stackMatch[2]}`;
  }

  return getEquipmentNameLabel(value) ?? value;
}

export function formatEquipmentValue(
  value: string | undefined,
  fallback: string,
  language: AppLanguage = 'zh-CN',
  carried: boolean | undefined = true,
): string {
  if (!value) {
    return fallback;
  }

  const name = formatEquipmentName(value, language);
  if (carried === false) {
    return language === 'zh-CN' ? `${name}（未携带）` : `${name} (not carried)`;
  }

  return name;
}

export function formatEquipmentList(values: string[], fallback: string, language: AppLanguage = 'zh-CN'): string {
  return values.length > 0 ? values.map((value) => formatEquipmentName(value, language)).join('、') : fallback;
}

export function formatLuck(dailyLuck: number | undefined, language: AppLanguage = 'zh-CN'): string {
  if (dailyLuck === undefined) {
    return DISPLAY_FORMAT_LABELS.luckLabels[language].unparsed;
  }
  if (dailyLuck > 0.07) {
    return DISPLAY_FORMAT_LABELS.luckLabels[language].veryHappy;
  }
  if (dailyLuck > 0.02) {
    return DISPLAY_FORMAT_LABELS.luckLabels[language].good;
  }
  if (dailyLuck < -0.07) {
    return DISPLAY_FORMAT_LABELS.luckLabels[language].veryDispleased;
  }
  if (dailyLuck < -0.02) {
    return DISPLAY_FORMAT_LABELS.luckLabels[language].mildlyPerturbed;
  }

  return DISPLAY_FORMAT_LABELS.luckLabels[language].neutral;
}

export function formatNpcName(name: string, language: AppLanguage = 'zh-CN'): string {
  return language === 'zh-CN' ? DISPLAY_FORMAT_LABELS.npcNameLabels[name] ?? name : name;
}

export function sortRelationshipsByFriendship(relationships: RelationshipSummary[]): RelationshipSummary[] {
  return [...relationships].sort((left, right) => right.points - left.points);
}
