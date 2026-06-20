import type { CommunityCenterDeliverableDetail } from '../shared/types.ts';

export const COMMUNITY_CENTER_DETAIL_THRESHOLD = 2;

export interface CommunityCenterDeliverableGroup {
  key: string;
  roomName: string;
  bundleName: string;
  items: CommunityCenterDeliverableDetail[];
}

type DeliverableWithStableIds = CommunityCenterDeliverableDetail & {
  roomId?: string;
  bundleId?: string;
};

export function shouldShowCommunityCenterDetailButton(
  deliverables: CommunityCenterDeliverableDetail[] | undefined,
): boolean {
  return (deliverables?.length ?? 0) > COMMUNITY_CENTER_DETAIL_THRESHOLD;
}

export function groupCommunityCenterDeliverables(
  deliverables: CommunityCenterDeliverableDetail[],
): CommunityCenterDeliverableGroup[] {
  const groups: CommunityCenterDeliverableGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of deliverables) {
    const key = getGroupKey(item as DeliverableWithStableIds);
    const existingIndex = indexByKey.get(key);
    if (existingIndex !== undefined) {
      mergeDeliverable(groups[existingIndex], item);
      continue;
    }

    indexByKey.set(key, groups.length);
    groups.push({
      key,
      roomName: item.roomName,
      bundleName: item.bundleName,
      items: [{ ...item }],
    });
  }

  return groups;
}

function getGroupKey(item: DeliverableWithStableIds): string {
  return `${item.roomId ?? item.roomName}:${item.bundleId ?? item.bundleName}`;
}

function mergeDeliverable(
  group: CommunityCenterDeliverableGroup | undefined,
  item: CommunityCenterDeliverableDetail,
) {
  if (!group) {
    return;
  }

  const existing = group.items.find((candidate) => String(candidate.itemId) === String(item.itemId));
  if (!existing) {
    group.items.push({ ...item });
    return;
  }

  existing.requiredStack += item.requiredStack;
  existing.availableStack = Math.max(existing.availableStack, item.availableStack);
}
