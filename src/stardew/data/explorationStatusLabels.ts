import explorationStatusLabels from './explorationStatusLabels.json' with { type: 'json' };

export interface ExplorationStatusLabelsData {
  openStatus: Record<string, string>;
  closedOrUnknownStatus: Record<string, string>;
  pendingStatus: Record<string, string>;
  shopFestivalStatus: Record<string, string>;
  shopWednesdayStatus: Record<string, string>;
  shopDefaultStatus: Record<string, string>;
  sprinklerFoundStatus: Record<string, string>;
  sprinklerMissingStatus: Record<string, string>;
  seedPendingStatus: Record<string, string>;
  seedNoneStatus: Record<string, string>;
  fishTodayNoneStatus: Record<string, string>;
  fishTodayPrefix: Record<string, string>;
  fishTodaySuffix: Record<string, string>;
  fishingRodLabel: Record<string, string>;
  baitLabel: Record<string, string>;
  fishingRodPending: Record<string, string>;
  baitPending: Record<string, string>;
  mineUnparsed: Record<string, string>;
  mineDepthPrefix: Record<string, string>;
  mineDepthSuffix: Record<string, string>;
  grottoRouteLabel: Record<string, string>;
  volcanoRouteLabel: Record<string, string>;
  routeStatusUnconfirmed: Record<string, string>;
  jojaProgressUnparsed: Record<string, string>;
  communityCenterUnparsed: Record<string, string>;
  communityCenterRestored: Record<string, string>;
  communityCenterProgressPrefix: Record<string, string>;
  communityCenterProgressSuffix: Record<string, string>;
  communityCenterDeliverablePrefix: Record<string, string>;
  communityCenterDeliverableSuffix: Record<string, string>;
  jojaPurchasedPrefix: Record<string, string>;
  jojaPurchasedSuffix: Record<string, string>;
}

export const EXPLORATION_STATUS_LABELS = explorationStatusLabels as ExplorationStatusLabelsData;
