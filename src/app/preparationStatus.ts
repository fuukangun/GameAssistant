import type { InventoryItem, StardewSaveSnapshot } from '../shared/types.ts';
import {
  formatPreparationItemName as formatPreparationItemLabel,
  isBombItemId,
  isBombItemName,
  isStaircaseItemId,
  isStaircaseItemName,
} from '../stardew/data/preparationRules.ts';
import { formatEquipmentValue } from './displayFormat.ts';
import { formatItemName, formatItemSource } from './itemDisplay.ts';
import type { AppLanguage } from './config/localConfig.ts';

export interface PreparationStatusRow {
  label: string;
  value: string;
}

export interface PreparationStatusGroup {
  title: string;
  items: PreparationStatusRow[];
}

export type MinePreparationReadiness = 'cautious' | 'ready' | 'strong';

export interface MinePreparationTarget {
  current: number;
  recommended: number;
  step: number;
  label: string;
}

export interface MinePreparationEvidence {
  label: string;
  value: string;
}

export interface MinePreparationAdvice {
  readiness: MinePreparationReadiness;
  targetLevel: MinePreparationTarget;
  riskNotes: string[];
  evidence: MinePreparationEvidence[];
}

const LOW_HEALTH_RATIO = 0.5;
const FOOD_PREVIEW_LIMIT = 3;
const MINE_BOTTOM_LEVEL = 120;

export function buildPreparationStatus(
  snapshot: StardewSaveSnapshot,
  language: AppLanguage = 'zh-CN',
): PreparationStatusGroup {
  const inventory = Array.isArray(snapshot.inventory) ? snapshot.inventory : [];
  const equipment = snapshot.player?.equipment;

  return {
    title: language === 'zh-CN' ? '探索准备' : 'Exploration Prep',
    items: [
      {
        label: language === 'zh-CN' ? '生命' : 'Health',
        value: formatHealthStatus(snapshot, language),
      },
      {
        label: language === 'zh-CN' ? '武器' : 'Weapon',
        value: formatEquipmentValue(
          equipment?.weaponName,
          language === 'zh-CN' ? '未拥有武器' : 'No weapon owned',
          language,
          equipment?.carried?.weapon,
        ),
      },
      {
        label: language === 'zh-CN' ? '食物' : 'Food',
        value: formatItemSummary(inventory.filter(isFoodItem), {
          empty: language === 'zh-CN' ? '未携带食物' : 'No food carried',
          language,
          nameFormatter: formatCatalogItemName,
        }),
      },
      {
        label: language === 'zh-CN' ? '炸弹' : 'Bombs',
        value: formatItemSummary(inventory.filter(isBombItem), {
          empty: language === 'zh-CN' ? '未携带炸弹' : 'No bombs carried',
          language,
          nameFormatter: formatPreparationItemName,
        }),
      },
      {
        label: language === 'zh-CN' ? '楼梯' : 'Staircases',
        value: formatItemSummary(inventory.filter(isStaircaseItem), {
          empty: language === 'zh-CN' ? '未携带楼梯' : 'No staircases carried',
          language,
          nameFormatter: formatPreparationItemName,
        }),
      },
    ],
  };
}

export function buildMinePreparationAdvice(
  snapshot: StardewSaveSnapshot,
  language: AppLanguage = 'zh-CN',
): MinePreparationAdvice {
  const inventory = Array.isArray(snapshot.inventory) ? snapshot.inventory : [];
  const foodItems = inventory.filter(isFoodItem);
  const bombItems = inventory.filter(isBombItem);
  const staircaseItems = inventory.filter(isStaircaseItem);
  const hasCoreSupplies = hasCoreMineSupplies(snapshot, foodItems);
  const targetLevel = buildMinePreparationTarget(
    snapshot.farm?.mineLevel ?? 0,
    hasCoreSupplies && hasUtilitySupplies(bombItems, staircaseItems),
    language,
  );
  const evidence = buildMinePreparationEvidence(snapshot, targetLevel, foodItems, bombItems, staircaseItems, language);
  const riskNotes = buildMineRiskNotes(snapshot, foodItems, language);

  return {
    readiness: calculateMineReadiness(snapshot, foodItems, bombItems, staircaseItems),
    targetLevel,
    riskNotes,
    evidence,
  };
}

function formatHealthStatus(snapshot: StardewSaveSnapshot, language: AppLanguage): string {
  const health = snapshot.player?.health;
  const maxHealth = snapshot.player?.maxHealth;
  if (health === undefined && maxHealth === undefined) {
    return language === 'zh-CN' ? '生命未解析' : 'Health unparsed';
  }

  const status = `${health ?? '?'} / ${maxHealth ?? '?'}`;
  if (health !== undefined && maxHealth !== undefined && maxHealth > 0 && health / maxHealth < LOW_HEALTH_RATIO) {
    return language === 'zh-CN' ? `${status}（偏低）` : `${status} (low)`;
  }

  return status;
}

function buildMinePreparationTarget(
  rawMineLevel: number,
  hasUtilitySuppliesForPush: boolean,
  language: AppLanguage,
): MinePreparationTarget {
  const current = clampMineLevel(rawMineLevel);
  const step = calculateMineTargetStep(current, hasUtilitySuppliesForPush);
  const recommended = Math.min(MINE_BOTTOM_LEVEL, current + step);

  return {
    current,
    recommended,
    step: recommended - current,
    label: formatMineTargetLabel(current, recommended, language),
  };
}

function calculateMineTargetStep(current: number, hasUtilitySuppliesForPush: boolean): number {
  if (current >= MINE_BOTTOM_LEVEL) {
    return 0;
  }

  if (current >= 115) {
    return MINE_BOTTOM_LEVEL - current;
  }

  return hasUtilitySuppliesForPush ? 10 : 5;
}

function formatMineTargetLabel(current: number, recommended: number, language: AppLanguage): string {
  if (current >= MINE_BOTTOM_LEVEL) {
    return language === 'zh-CN' ? '矿洞已到达 120 层' : 'Mine level 120 reached';
  }

  if (recommended >= MINE_BOTTOM_LEVEL) {
    return language === 'zh-CN' ? '冲刺到 120 层' : 'Push to level 120';
  }

  if (current === 0 && recommended === 5) {
    return language === 'zh-CN' ? '先推进到 5 层电梯点' : 'Start by reaching the level 5 elevator';
  }

  const step = recommended - current;
  return language === 'zh-CN'
    ? `尝试推进 ${step} 层到 ${recommended} 层`
    : `Try pushing ${step} levels to level ${recommended}`;
}

function buildMinePreparationEvidence(
  snapshot: StardewSaveSnapshot,
  targetLevel: MinePreparationTarget,
  foodItems: InventoryItem[],
  bombItems: InventoryItem[],
  staircaseItems: InventoryItem[],
  language: AppLanguage,
): MinePreparationEvidence[] {
  const equipment = snapshot.player?.equipment;
  const evidence: MinePreparationEvidence[] = [
    {
      label: language === 'zh-CN' ? '当前矿洞' : 'Current mine level',
      value: `${targetLevel.current}`,
    },
    {
      label: language === 'zh-CN' ? '建议目标' : 'Suggested target',
      value: `${targetLevel.recommended}`,
    },
    {
      label: language === 'zh-CN' ? '生命' : 'Health',
      value: formatHealthStatus(snapshot, language),
    },
  ];

  if (equipment?.weaponName) {
    evidence.push({
      label: language === 'zh-CN' ? '武器' : 'Weapon',
      value: formatEquipmentValue(equipment.weaponName, '', language, equipment.carried?.weapon),
    });
  }

  if (foodItems.length > 0) {
    evidence.push({
      label: language === 'zh-CN' ? '食物' : 'Food',
      value: formatItemSummary(foodItems, {
        empty: '',
        language,
        nameFormatter: formatCatalogItemName,
      }),
    });
  }

  if (bombItems.length > 0) {
    evidence.push({
      label: language === 'zh-CN' ? '炸弹' : 'Bombs',
      value: formatItemSummary(bombItems, {
        empty: '',
        language,
        nameFormatter: formatPreparationItemName,
      }),
    });
  }

  if (staircaseItems.length > 0) {
    evidence.push({
      label: language === 'zh-CN' ? '楼梯' : 'Staircases',
      value: formatItemSummary(staircaseItems, {
        empty: '',
        language,
        nameFormatter: formatPreparationItemName,
      }),
    });
  }

  return evidence;
}

function buildMineRiskNotes(
  snapshot: StardewSaveSnapshot,
  foodItems: InventoryItem[],
  language: AppLanguage,
): string[] {
  const notes: string[] = [];
  const health = snapshot.player?.health;
  const maxHealth = snapshot.player?.maxHealth;
  if (health !== undefined && maxHealth !== undefined && maxHealth > 0 && health / maxHealth < LOW_HEALTH_RATIO) {
    notes.push(language === 'zh-CN' ? '生命偏低，建议先回血再下矿。' : 'Health is low; heal before entering the mines.');
  }

  if (foodItems.length === 0) {
    notes.push(language === 'zh-CN' ? '未携带食物，续航风险较高。' : 'No food carried, so sustain is risky.');
  }

  if (!snapshot.player?.equipment?.weaponName) {
    notes.push(language === 'zh-CN' ? '未拥有武器，战斗风险较高。' : 'No weapon owned, so combat is risky.');
  }

  notes.push(language === 'zh-CN' ? '运势见顶部。' : 'Luck is shown at the top.');
  return notes;
}

function calculateMineReadiness(
  snapshot: StardewSaveSnapshot,
  foodItems: InventoryItem[],
  bombItems: InventoryItem[],
  staircaseItems: InventoryItem[],
): MinePreparationReadiness {
  if (!hasCoreMineSupplies(snapshot, foodItems)) {
    return 'cautious';
  }

  let score = 0;

  const health = snapshot.player?.health;
  const maxHealth = snapshot.player?.maxHealth;
  if (health !== undefined && maxHealth !== undefined && maxHealth > 0 && health / maxHealth >= LOW_HEALTH_RATIO) {
    score += 1;
  }

  if (snapshot.player?.equipment?.weaponName) {
    score += 1;
  }

  if (foodItems.length > 0) {
    score += 1;
  }

  if (bombItems.length > 0) {
    score += 1;
  }

  if (staircaseItems.length > 0) {
    score += 1;
  }

  if (score >= 5) {
    return 'strong';
  }

  if (score >= 3) {
    return 'ready';
  }

  return 'cautious';
}

function hasCoreMineSupplies(snapshot: StardewSaveSnapshot, foodItems: InventoryItem[]): boolean {
  const health = snapshot.player?.health;
  const maxHealth = snapshot.player?.maxHealth;
  const hasEnoughHealth = health !== undefined && maxHealth !== undefined && maxHealth > 0 && health / maxHealth >= LOW_HEALTH_RATIO;

  return hasEnoughHealth
    && Boolean(snapshot.player?.equipment?.weaponName)
    && foodItems.length > 0;
}

function formatItemSummary(
  items: InventoryItem[],
  options: { empty: string; language: AppLanguage; nameFormatter: (item: InventoryItem, language: AppLanguage) => string },
): string {
  if (items.length === 0) {
    return options.empty;
  }

  const preview = items.slice(0, FOOD_PREVIEW_LIMIT).map((item) => formatStackedItem(item, options));
  const suffix = items.length > FOOD_PREVIEW_LIMIT
    ? options.language === 'zh-CN'
      ? ` 等${items.length}种`
      : ` and ${items.length - FOOD_PREVIEW_LIMIT} more`
    : '';

  return `${preview.join(options.language === 'zh-CN' ? '、' : ', ')}${suffix}`;
}

function formatStackedItem(
  item: InventoryItem,
  options: { language: AppLanguage; nameFormatter: (item: InventoryItem, language: AppLanguage) => string },
): string {
  const name = options.nameFormatter(item, options.language);
  const source = formatItemSource(item, options.language);
  const sourceText = source ? options.language === 'zh-CN' ? `（${source}）` : ` (${source})` : '';
  return `${name} x${item.stack}${sourceText}`;
}

function formatCatalogItemName(item: InventoryItem, language: AppLanguage): string {
  return formatItemName(item, language);
}

function formatPreparationItemName(item: InventoryItem, language: AppLanguage): string {
  return formatPreparationItemLabel(item.id, item.name, language === 'zh-CN' ? 'zh-CN' : 'en-US');
}

function isFoodItem(item: InventoryItem): boolean {
  return item.isEdible === true
    || (item.energy !== undefined && item.energy > 0)
    || (item.health !== undefined && item.health > 0);
}

function isBombItem(item: InventoryItem): boolean {
  return isBombItemId(item.id) || isBombItemName(item.name);
}

function isStaircaseItem(item: InventoryItem): boolean {
  return isStaircaseItemId(item.id) || isStaircaseItemName(item.name);
}

function hasUtilitySupplies(bombItems: InventoryItem[], staircaseItems: InventoryItem[]): boolean {
  return totalStack(bombItems) > 0 || totalStack(staircaseItems) > 0;
}

function totalStack(items: InventoryItem[]): number {
  return items.reduce((total, item) => total + Math.max(0, item.stack), 0);
}

function clampMineLevel(mineLevel: number): number {
  if (!Number.isFinite(mineLevel)) {
    return 0;
  }

  return Math.min(MINE_BOTTOM_LEVEL, Math.max(0, Math.trunc(mineLevel)));
}
