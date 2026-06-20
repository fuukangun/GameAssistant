import { COMMUNITY_CENTER_BUNDLES, type CommunityCenterRoom } from './communityCenter.ts';
import { BASIC_PLANTING_OPTIONS, type CropPlantingOption } from './crops.ts';
import { FISH_CATALOG, type FishCatalogEntry } from './fish.ts';
import { ITEM_CATALOG, type ItemCatalogEntry } from './items.ts';
import { BIRTHDAYS, FESTIVALS, type Birthday, type Festival } from './calendar.ts';
import { JOJA_PROJECTS, type JojaProject } from './joja.ts';
import { ITEM_ICON_ID_LIST } from './itemIconIds.ts';
import { NPC_GIFT_PREFERENCES, NPC_SOCIAL_DATA, type NpcGiftPreferences, type NpcSocialData } from './npcs.ts';
import { PREPARATION_RULES } from './preparationRules.ts';
import { PROCESSING_RULES, type ProcessingRule } from './processingRules.ts';
import { SAVE_PARSING_RULES, type SaveParsingRules } from './saveParsingRules.ts';
import { UPGRADE_RULES, type UpgradeRule } from './upgradeRules.ts';

export const SUPPORTED_STATIC_DATA_GAME_VERSION = '1.6.x';
export const SUPPORTED_STATIC_DATA_SCHEMA_VERSION = '1';

export const EXPECTED_STATIC_DATA_SECTIONS = [
  'fish',
  'crops',
  'npcs',
  'items',
  'birthdays',
  'festivals',
  'communityCenter',
  'joja',
  'itemIconIds',
  'npcSocialData',
  'saveParsingRules',
  'preparationRules',
  'processingRules',
  'upgradeRules',
] as const;

const ARRAY_STATIC_DATA_SECTIONS = [
  'fish',
  'crops',
  'npcs',
  'items',
  'birthdays',
  'festivals',
  'communityCenter',
  'joja',
  'itemIconIds',
  'processingRules',
  'upgradeRules',
] as const satisfies readonly StaticDataSectionName[];

const OBJECT_STATIC_DATA_SECTIONS = [
  'npcSocialData',
  'saveParsingRules',
  'preparationRules',
] as const satisfies readonly StaticDataSectionName[];

export type StaticDataSectionName = typeof EXPECTED_STATIC_DATA_SECTIONS[number];

export interface StaticDataPackMetadata {
  gameVersion: string;
  schemaVersion: string;
  generatedAt?: string;
  source?: string;
}

export interface StaticDataPackSections {
  fish: unknown[];
  crops: unknown[];
  npcs: unknown[];
  items: unknown[];
  birthdays: unknown[];
  festivals: unknown[];
  communityCenter: unknown[];
  joja: unknown[];
  itemIconIds: unknown[];
  npcSocialData: unknown;
  saveParsingRules: unknown;
  preparationRules: unknown;
  processingRules: unknown[];
  upgradeRules: unknown[];
}

export interface StaticDataPack {
  metadata: StaticDataPackMetadata;
  sections: Partial<StaticDataPackSections>;
}

export type StaticDataPackWarning =
  | 'game_version_mismatch'
  | 'schema_version_mismatch'
  | 'missing_section';

export type StaticDataPackValidationResult =
  | {
    ok: true;
    warnings: StaticDataPackWarning[];
    missingSections: StaticDataSectionName[];
  }
  | {
    ok: false;
    reason: 'invalid_data' | 'missing_metadata' | 'missing_required_field';
    warnings: StaticDataPackWarning[];
    missingSections: StaticDataSectionName[];
  };

export interface StaticDataPackValidationOptions {
  supportedGameVersion?: string;
  supportedSchemaVersion?: string;
}

export interface ResolvedStaticDataPack {
  metadata?: StaticDataPackMetadata;
  sections: {
    fish: FishCatalogEntry[] | unknown[];
    crops: CropPlantingOption[] | unknown[];
    npcs: NpcGiftPreferences[] | unknown[];
    items: ItemCatalogEntry[] | unknown[];
    birthdays: Birthday[] | unknown[];
    festivals: Festival[] | unknown[];
    communityCenter: CommunityCenterRoom[] | unknown[];
    joja: JojaProject[] | unknown[];
    itemIconIds: string[] | unknown[];
    npcSocialData: NpcSocialData | unknown;
    saveParsingRules: SaveParsingRules | unknown;
    preparationRules: typeof PREPARATION_RULES | unknown;
    processingRules: ProcessingRule[] | unknown[];
    upgradeRules: UpgradeRule[] | unknown[];
  };
  validation: StaticDataPackValidationResult;
}

const BUILT_IN_STATIC_DATA_SECTIONS: StaticDataPackSections = {
  fish: FISH_CATALOG,
  crops: BASIC_PLANTING_OPTIONS,
  npcs: NPC_GIFT_PREFERENCES,
  items: ITEM_CATALOG,
  birthdays: BIRTHDAYS,
  festivals: FESTIVALS,
  communityCenter: COMMUNITY_CENTER_BUNDLES,
  joja: JOJA_PROJECTS,
  itemIconIds: ITEM_ICON_ID_LIST,
  npcSocialData: NPC_SOCIAL_DATA,
  saveParsingRules: SAVE_PARSING_RULES,
  preparationRules: PREPARATION_RULES,
  processingRules: PROCESSING_RULES,
  upgradeRules: UPGRADE_RULES,
};

export function validateStaticDataPack(
  pack: unknown,
  options: StaticDataPackValidationOptions = {},
): StaticDataPackValidationResult {
  if (!isObject(pack)) {
    return invalid('invalid_data', [...EXPECTED_STATIC_DATA_SECTIONS]);
  }

  if (!isObject(pack.metadata)) {
    return invalid('missing_metadata', [...EXPECTED_STATIC_DATA_SECTIONS]);
  }

  if (
    typeof pack.metadata.gameVersion !== 'string'
    || typeof pack.metadata.schemaVersion !== 'string'
    || (pack.metadata.generatedAt !== undefined && typeof pack.metadata.generatedAt !== 'string')
    || (pack.metadata.source !== undefined && typeof pack.metadata.source !== 'string')
  ) {
    return invalid('missing_required_field', findMissingSections(pack));
  }

  const warnings: StaticDataPackWarning[] = [];
  const missingSections = findMissingSections(pack);

  if (pack.metadata.gameVersion !== (options.supportedGameVersion ?? SUPPORTED_STATIC_DATA_GAME_VERSION)) {
    warnings.push('game_version_mismatch');
  }

  if (pack.metadata.schemaVersion !== (options.supportedSchemaVersion ?? SUPPORTED_STATIC_DATA_SCHEMA_VERSION)) {
    warnings.push('schema_version_mismatch');
  }

  if (missingSections.length > 0) {
    warnings.push('missing_section');
  }

  return {
    ok: true,
    warnings,
    missingSections,
  };
}

export function resolveStaticDataPack(
  pack: unknown,
  options: StaticDataPackValidationOptions = {},
): ResolvedStaticDataPack {
  const validation = validateStaticDataPack(pack, options);

  if (!validation.ok || !isObject(pack) || !isObject(pack.sections)) {
    return {
      sections: BUILT_IN_STATIC_DATA_SECTIONS,
      validation,
    };
  }

  return {
    metadata: pack.metadata as StaticDataPackMetadata,
    sections: {
      fish: sectionOrFallback(pack.sections.fish, 'fish'),
      crops: sectionOrFallback(pack.sections.crops, 'crops'),
      npcs: sectionOrFallback(pack.sections.npcs, 'npcs'),
      items: sectionOrFallback(pack.sections.items, 'items'),
      birthdays: sectionOrFallback(pack.sections.birthdays, 'birthdays'),
      festivals: sectionOrFallback(pack.sections.festivals, 'festivals'),
      communityCenter: sectionOrFallback(pack.sections.communityCenter, 'communityCenter'),
      joja: sectionOrFallback(pack.sections.joja, 'joja'),
      itemIconIds: sectionOrFallback(pack.sections.itemIconIds, 'itemIconIds'),
      npcSocialData: sectionOrFallback(pack.sections.npcSocialData, 'npcSocialData'),
      saveParsingRules: sectionOrFallback(pack.sections.saveParsingRules, 'saveParsingRules'),
      preparationRules: sectionOrFallback(pack.sections.preparationRules, 'preparationRules'),
      processingRules: sectionOrFallback(pack.sections.processingRules, 'processingRules'),
      upgradeRules: sectionOrFallback(pack.sections.upgradeRules, 'upgradeRules'),
    },
    validation,
  };
}

function sectionOrFallback<TSection extends StaticDataSectionName>(
  section: unknown,
  name: TSection,
): StaticDataPackSections[TSection] {
  return isValidSection(section, name) ? section as StaticDataPackSections[TSection] : BUILT_IN_STATIC_DATA_SECTIONS[name];
}

function findMissingSections(pack: Record<string, unknown>): StaticDataSectionName[] {
  if (!isObject(pack.sections)) {
    return [...EXPECTED_STATIC_DATA_SECTIONS];
  }

  const sections = pack.sections;
  return EXPECTED_STATIC_DATA_SECTIONS.filter((sectionName) => !isValidSection(sections[sectionName], sectionName));
}

function isValidSection(section: unknown, name: StaticDataSectionName): boolean {
  if ((ARRAY_STATIC_DATA_SECTIONS as readonly string[]).includes(name)) {
    return Array.isArray(section);
  }

  if ((OBJECT_STATIC_DATA_SECTIONS as readonly string[]).includes(name)) {
    return isObject(section);
  }

  return false;
}

function invalid(
  reason: 'invalid_data' | 'missing_metadata' | 'missing_required_field',
  missingSections: StaticDataSectionName[],
): StaticDataPackValidationResult {
  return {
    ok: false,
    reason,
    warnings: [],
    missingSections,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
