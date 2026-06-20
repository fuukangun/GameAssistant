export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export type Weather = 'sunny' | 'rainy' | 'stormy' | 'snowy' | 'windy';

export type PlannerGoal = 'free' | 'money';

export type Confidence = 'high' | 'medium' | 'low';

export interface SaveTime {
  year: number;
  season: Season;
  day: number;
}

export interface PlanDate extends SaveTime {
  sourceSaveDate: SaveTime;
}

export interface ManualCorrections {
  wateredToday: boolean;
  harvestedToday: boolean;
  giftedToday: boolean;
}

export interface PlannerInput {
  snapshot: StardewSaveSnapshot;
  planDate: PlanDate;
  selectedWeather: Weather;
  goal: PlannerGoal;
  manualCorrections: ManualCorrections;
}

export interface StardewSaveSnapshot {
  saveIdentity: SaveIdentity;
  parseMeta: ParseMeta;
  farm: FarmSummary;
  farmPlotSummary?: FarmPlotSummary;
  player: PlayerSummary;
  time: SaveTime;
  weatherForTomorrow?: Weather;
  wallet: WalletSummary;
  skills: SkillSummary;
  inventory: InventoryItem[];
  crops: CropSummary[];
  readyMachineOutputs: ProducedItemSummary[];
  animalProducts: ProducedItemSummary[];
  animalFeed: AnimalFeedSummary;
  progression: ProgressionSummary;
  relationships: RelationshipSummary[];
}

export interface FarmPlotSummary {
  plantedCropCount: number;
  tilledTileCount: number;
  occupiedObjectCount: number;
  resourceClumpCount: number;
  buildingCount: number;
  /**
   * Conservative count of HoeDirt tiles on the farm that do not currently contain a crop.
   * This does not mean every farmable tile on the map is empty.
   */
  emptyTileCount?: number;
  parsedFields: string[];
  unknownFields: string[];
}

export interface SaveIdentity {
  uniqueId?: string;
  filePath: string;
  fileModifiedAt: string;
}

export interface ParseMeta {
  status: 'ok' | 'partial' | 'failed';
  gameVersion?: string;
  parserVersion: string;
  warnings: ParseWarning[];
}

export interface ParseWarning {
  code:
    | 'missing_field'
    | 'unknown_game_version'
    | 'unsupported_multiplayer'
    | 'modded_field_ignored'
    | 'bundle_parse_failed'
    | 'crop_parse_failed';
  severity: 'info' | 'warning' | 'error';
  message: string;
  fieldPath?: string;
}

export interface FarmSummary {
  farmName: string;
  playerName: string;
  farmType: string;
  hasDesertAccess: boolean;
  hasIslandAccess?: boolean;
  hasSkullCavernAccess?: boolean;
  hasVolcanoDungeonAccess?: boolean;
  skullCavernLevel?: number;
  mineLevel: number;
  communityCenterRoute: 'community_center' | 'joja' | 'unknown';
}

export interface PlayerSummary {
  maxEnergy: number;
  health?: number;
  maxHealth?: number;
  dailyLuck?: number;
  maxItems: number;
  equipment: EquipmentSummary;
}

export interface EquipmentSummary {
  weaponName?: string;
  bootsName?: string;
  ringNames: string[];
  fishingRodName?: string;
  baitName?: string;
  hoeName?: string;
  pickaxeName?: string;
  axeName?: string;
  wateringCanName?: string;
  scytheName?: string;
  trashCanName?: string;
  panName?: string;
  carried?: Partial<Record<EquipmentSlot, boolean>>;
}

export type EquipmentSlot =
  | 'weapon'
  | 'boots'
  | 'rings'
  | 'fishingRod'
  | 'bait'
  | 'hoe'
  | 'pickaxe'
  | 'axe'
  | 'wateringCan'
  | 'scythe'
  | 'trashCan'
  | 'pan';

export interface WalletSummary {
  money: number;
  totalMoneyEarned?: number;
}

export interface SkillSummary {
  farming: number;
  mining: number;
  foraging: number;
  fishing: number;
  combat: number;
}

export interface InventoryItem {
  id: number | string;
  name: string;
  stack: number;
  quality?: number;
  isEdible?: boolean;
  energy?: number;
  health?: number;
  source?: 'backpack' | 'chest' | 'fridge';
  sourceLabel?: string;
}

export interface CropSummary {
  id: number | string;
  name: string;
  isReady: boolean;
  daysLeft?: number;
  quantity: number;
  sellPrice: number;
}

export interface ProducedItemSummary {
  id: number | string;
  name: string;
  quantity: number;
  source: 'machine' | 'animal';
  sourceName?: string;
}

export interface AnimalFeedSummary {
  animalCount: number;
  hayCount?: number;
  daysRemaining?: number;
}

export interface ProgressionSummary {
  communityCenter?: {
    completed: boolean;
    percentage: number;
    bundleStates?: CommunityCenterBundleState[];
  };
  joja?: {
    completedProjects: number;
    totalProjects: number;
    completedMarkers?: string[];
  };
}

export interface CommunityCenterBundleState {
  key: number;
  completed: boolean;
  donatedSlots: boolean[];
}

export interface RelationshipSummary {
  npc: string;
  points: number;
  hearts: number;
  status?: string;
  giftedToday?: boolean;
  giftsThisWeek?: number;
  talkedToday?: boolean;
}

export interface RecommendationItem {
  id: string;
  title: string;
  category: 'reminder' | 'profit' | 'collection' | 'progress' | 'risk' | 'maintenance';
  priority: 'must_do' | 'recommended' | 'optional';
  confidence: Confidence;
  reason: string;
  evidence: Evidence[];
  uncertainty: string[];
  estimate?: Estimate;
  detail?: RecommendationDetail;
}

export interface RecommendationDetail {
  communityCenterDeliverables?: CommunityCenterDeliverableDetail[];
}

export interface CommunityCenterDeliverableDetail {
  roomName: string;
  bundleName: string;
  itemId: number | string;
  itemName: string;
  requiredStack: number;
  availableStack: number;
}

export interface Evidence {
  source: 'save' | 'static_data' | 'user_input' | 'derived';
  label: string;
  value: string;
}

export interface Estimate {
  kind: 'fixed' | 'projected' | 'range';
  goldMin?: number;
  goldMax?: number;
  gold?: number;
  description: string;
}

export interface PlanRecommendation {
  title: string;
  subtitle: string;
  dataNotice: string;
  reminders: RecommendationItem[];
  actions: RecommendationItem[];
  parseWarnings: ParseWarning[];
}
