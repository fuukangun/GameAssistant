import communityCenterBundles from './communityCenterBundles.json' with { type: 'json' };
import type { InventoryItem, StardewSaveSnapshot } from '../../shared/types.ts';
import { normalizeItemId } from './items.ts';

export type CommunityCenterRoute = StardewSaveSnapshot['farm']['communityCenterRoute'];
export type CommunityCenterCompletionSource = 'save_bundle_state' | 'summary_only';
export type CommunityCenterStatus = 'active' | 'completed' | 'route_unknown' | 'joja_route';

export interface CommunityCenterRequirement {
  itemId: number | string;
  itemName: string;
  requiredStack?: number;
  minQuality?: number;
}

export interface CommunityCenterBundle {
  id: string;
  name: string;
  saveKey?: number;
  requirements: CommunityCenterRequirement[];
}

export interface CommunityCenterRoom {
  id: string;
  name: string;
  bundles: CommunityCenterBundle[];
}

export interface CommunityCenterDeliverable {
  roomId: string;
  roomName: string;
  bundleId: string;
  bundleName: string;
  itemId: number | string;
  itemName: string;
  requiredStack: number;
  availableStack: number;
  inventoryItems: InventoryItem[];
}

export interface CommunityCenterRequirementSummary extends CommunityCenterRequirement {
  requiredStack: number;
  availableStack: number;
  deliverable: boolean;
}

export interface CommunityCenterBundleSummary {
  id: string;
  name: string;
  saveKey?: number;
  completed?: boolean;
  completionSource: CommunityCenterCompletionSource;
  requirements: CommunityCenterRequirementSummary[];
}

export interface CommunityCenterRoomSummary {
  id: string;
  name: string;
  completionSource: CommunityCenterCompletionSource;
  bundles: CommunityCenterBundleSummary[];
}

export interface CommunityCenterSummary {
  route: CommunityCenterRoute;
  status: CommunityCenterStatus;
  completionSource: CommunityCenterCompletionSource;
  shouldSuggestCommunityCenter: boolean;
  overall: {
    completed: boolean;
    percentage: number;
  };
  rooms: CommunityCenterRoomSummary[];
  deliverables: CommunityCenterDeliverable[];
}

export const COMMUNITY_CENTER_BUNDLES: CommunityCenterRoom[] = communityCenterBundles as CommunityCenterRoom[];
export function createCommunityCenterSummary(snapshot: StardewSaveSnapshot): CommunityCenterSummary {
  const route = snapshot.farm.communityCenterRoute;
  const completed = snapshot.progression.communityCenter?.completed ?? false;
  const status = getStatus(route, completed);
  const shouldSuggestCommunityCenter = status === 'active';
  const inventory = Array.isArray(snapshot.inventory) ? snapshot.inventory : [];
  const rooms = buildRoomSummaries(shouldSuggestCommunityCenter ? inventory : [], snapshot);
  const deliverables = shouldSuggestCommunityCenter ? collectDeliverables(rooms, inventory) : [];

  return {
    route,
    status,
    completionSource: hasBundleStates(snapshot) ? 'save_bundle_state' : 'summary_only',
    shouldSuggestCommunityCenter,
    overall: {
      completed,
      percentage: completed ? 100 : clampPercent(snapshot.progression.communityCenter?.percentage ?? 0),
    },
    rooms,
    deliverables,
  };
}

function getStatus(route: CommunityCenterRoute, completed: boolean): CommunityCenterStatus {
  if (route === 'joja') {
    return 'joja_route';
  }

  if (route === 'unknown') {
    return 'route_unknown';
  }

  return completed ? 'completed' : 'active';
}

function buildRoomSummaries(inventory: InventoryItem[], snapshot: StardewSaveSnapshot): CommunityCenterRoomSummary[] {
  const inventoryById = createInventoryIndex(inventory);
  const bundleStatesByKey = createBundleStatesByKey(snapshot);
  const completionSource = hasBundleStates(snapshot) ? 'save_bundle_state' : 'summary_only';

  return COMMUNITY_CENTER_BUNDLES.map((room) => ({
    id: room.id,
    name: room.name,
    completionSource,
    bundles: room.bundles.map((bundle) => ({
      id: bundle.id,
      name: bundle.name,
      saveKey: bundle.saveKey,
      completed: bundle.saveKey !== undefined ? bundleStatesByKey.get(bundle.saveKey)?.completed : undefined,
      completionSource,
      requirements: bundle.requirements.map((requirement) => {
        const requiredStack = requirement.requiredStack ?? 1;
        const matchingItems = inventoryById.get(normalizeItemId(requirement.itemId)) ?? [];
        const availableStack = matchingItems.reduce((total, item) => total + Math.max(0, item.stack), 0);

        return {
          ...requirement,
          requiredStack,
          availableStack,
          deliverable: availableStack >= requiredStack,
        };
      }),
    })),
  }));
}

function collectDeliverables(
  rooms: CommunityCenterRoomSummary[],
  inventory: InventoryItem[],
): CommunityCenterDeliverable[] {
  const inventoryById = createInventoryIndex(inventory);
  const remainingStackById = createInventoryStackIndex(inventory);
  const deliverables: CommunityCenterDeliverable[] = [];

  for (const room of rooms) {
    for (const bundle of room.bundles) {
      if (bundle.completed) {
        continue;
      }

      for (const requirement of bundle.requirements) {
        const itemId = normalizeItemId(requirement.itemId);
        const remainingStack = remainingStackById.get(itemId) ?? 0;
        if (remainingStack < requirement.requiredStack) {
          continue;
        }

        remainingStackById.set(itemId, remainingStack - requirement.requiredStack);
        const inventoryItems = inventoryById.get(itemId) ?? [];
        deliverables.push({
          roomId: room.id,
          roomName: room.name,
          bundleId: bundle.id,
          bundleName: bundle.name,
          itemId: requirement.itemId,
          itemName: requirement.itemName,
          requiredStack: requirement.requiredStack,
          availableStack: requirement.availableStack,
          inventoryItems,
        });
      }
    }
  }

  return deliverables;
}

function createBundleStatesByKey(snapshot: StardewSaveSnapshot): Map<number, { completed: boolean }> {
  const states = snapshot.progression.communityCenter?.bundleStates ?? [];
  return new Map(states.map((state) => [state.key, { completed: state.completed }]));
}

function hasBundleStates(snapshot: StardewSaveSnapshot): boolean {
  return (snapshot.progression.communityCenter?.bundleStates?.length ?? 0) > 0;
}

function createInventoryStackIndex(inventory: InventoryItem[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const item of inventory) {
    const id = normalizeItemId(item.id);
    index.set(id, (index.get(id) ?? 0) + Math.max(0, item.stack));
  }

  return index;
}

function createInventoryIndex(inventory: InventoryItem[]): Map<string, InventoryItem[]> {
  const index = new Map<string, InventoryItem[]>();
  for (const item of inventory) {
    const id = normalizeItemId(item.id);
    index.set(id, [...(index.get(id) ?? []), item]);
  }

  return index;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
