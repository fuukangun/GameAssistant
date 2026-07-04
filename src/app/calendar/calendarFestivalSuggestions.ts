import type { AppLanguage } from '../config/localConfig.ts';
import type { Festival } from '../../stardew/data/calendar.ts';
import { MARRIAGE_CANDIDATE_NPCS } from '../../stardew/data/npcs.ts';
import type { StardewSaveSnapshot } from '../../shared/types.ts';

const DANCE_PARTNER_NPCS = new Set(MARRIAGE_CANDIDATE_NPCS);

export function buildFestivalSuggestion(snapshot: StardewSaveSnapshot, festival: Festival, language: AppLanguage): string | undefined {
  if (festival.relatedData?.budgetSuggestion !== undefined && snapshot.wallet.money < festival.relatedData.budgetSuggestion) {
    return language === 'zh-CN'
      ? `当前金币低于 ${festival.relatedData.budgetSuggestion}，草莓种子预算可能不足。`
      : `Current gold is below ${festival.relatedData.budgetSuggestion}, so the strawberry seed budget may be short.`;
  }
  if (festival.relatedData?.requiredHearts !== undefined && snapshot.relationships.length > 0) {
    const dancePartnerRelationships = snapshot.relationships.filter((relationship) => DANCE_PARTNER_NPCS.has(relationship.npc));
    if (dancePartnerRelationships.length === 0) {
      return undefined;
    }

    const highestHearts = Math.max(...dancePartnerRelationships.map((relationship) => relationship.hearts));
    const heartsMissing = festival.relatedData.requiredHearts - highestHearts;
    if (heartsMissing > 0) {
      return language === 'zh-CN'
        ? `当前还没有 ${festival.relatedData.requiredHearts} 心舞伴，最高好感还差 ${heartsMissing} 心。`
        : `No ${festival.relatedData.requiredHearts}-heart dance partner is confirmed; the closest candidate still needs ${heartsMissing} hearts.`;
    }
  }
  if (festival.relatedData?.requiresFishingRod && !snapshot.player.equipment.fishingRodName) {
    return language === 'zh-CN' ? '当前未解析到鱼竿，建议节日前确认钓鱼装备。' : 'No fishing rod was parsed, so confirm fishing gear before the festival.';
  }
  return undefined;
}
