import npcGiftPreferences from './npcGiftPreferences.json' with { type: 'json' };
import npcSocialData from './npcSocialData.json' with { type: 'json' };

export interface NpcGiftPreferences {
  npc: string;
  lovedItemIds: Array<number | string>;
  lovedItemNames: string[];
  likedItemIds?: Array<number | string>;
  likedItemNames?: string[];
  neutralItemIds?: Array<number | string>;
  neutralItemNames?: string[];
  hatedItemIds?: Array<number | string>;
  hatedItemNames?: string[];
  dislikedItemIds?: Array<number | string>;
  dislikedItemNames?: string[];
  excludedLovedItemIds?: Array<number | string>;
  excludedLovedItemNames?: string[];
  excludedLikedItemIds?: Array<number | string>;
  excludedLikedItemNames?: string[];
  excludedNeutralItemIds?: Array<number | string>;
  excludedNeutralItemNames?: string[];
}

export interface NpcSocialData {
  socialNpcs: string[];
  marriageCandidates: string[];
  universalGiftPreferences: Omit<NpcGiftPreferences, 'npc'>;
}

export const NPC_SOCIAL_DATA: NpcSocialData = npcSocialData as NpcSocialData;
export const SOCIAL_NPCS: string[] = NPC_SOCIAL_DATA.socialNpcs;
export const MARRIAGE_CANDIDATE_NPCS: string[] = NPC_SOCIAL_DATA.marriageCandidates;
export const UNIVERSAL_GIFT_PREFERENCES: Omit<NpcGiftPreferences, 'npc'> = NPC_SOCIAL_DATA.universalGiftPreferences;
export const NPC_GIFT_PREFERENCES: NpcGiftPreferences[] = npcGiftPreferences as NpcGiftPreferences[];
