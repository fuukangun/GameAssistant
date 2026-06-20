import test from 'node:test';
import assert from 'node:assert/strict';
import type { CommunityCenterDeliverableDetail } from '../shared/types.ts';
import {
  COMMUNITY_CENTER_DETAIL_THRESHOLD,
  groupCommunityCenterDeliverables,
  shouldShowCommunityCenterDetailButton,
} from './communityCenterActionDetails.ts';

const deliverables: CommunityCenterDeliverableDetail[] = [
  { roomName: '茶水间', bundleName: '春季作物收集包', itemId: 24, itemName: '防风草', requiredStack: 1, availableStack: 1 },
  { roomName: '工艺室', bundleName: '建筑收集包', itemId: 388, itemName: '木材', requiredStack: 99, availableStack: 120 },
  { roomName: '工艺室', bundleName: '建筑收集包', itemId: 390, itemName: '石头', requiredStack: 99, availableStack: 120 },
];

test('shows community center detail button only when deliverables exceed summary threshold', () => {
  assert.equal(shouldShowCommunityCenterDetailButton(deliverables.slice(0, COMMUNITY_CENTER_DETAIL_THRESHOLD)), false);
  assert.equal(shouldShowCommunityCenterDetailButton(deliverables), true);
  assert.equal(shouldShowCommunityCenterDetailButton(undefined), false);
});

test('groups community center deliverables by room and bundle', () => {
  assert.deepEqual(groupCommunityCenterDeliverables(deliverables), [
    {
      key: '茶水间:春季作物收集包',
      roomName: '茶水间',
      bundleName: '春季作物收集包',
      items: [deliverables[0]],
    },
    {
      key: '工艺室:建筑收集包',
      roomName: '工艺室',
      bundleName: '建筑收集包',
      items: [deliverables[1], deliverables[2]],
    },
  ]);
});

test('combines duplicate deliverable rows within the same bundle', () => {
  const grouped = groupCommunityCenterDeliverables([
    { roomName: '工艺室', bundleName: '建筑收集包', itemId: 388, itemName: '木材', requiredStack: 99, availableStack: 198 },
    { roomName: '工艺室', bundleName: '建筑收集包', itemId: 388, itemName: '木材', requiredStack: 99, availableStack: 198 },
    { roomName: '工艺室', bundleName: '建筑收集包', itemId: 390, itemName: '石头', requiredStack: 99, availableStack: 120 },
  ]);

  assert.deepEqual(grouped, [
    {
      key: '工艺室:建筑收集包',
      roomName: '工艺室',
      bundleName: '建筑收集包',
      items: [
        { roomName: '工艺室', bundleName: '建筑收集包', itemId: 388, itemName: '木材', requiredStack: 198, availableStack: 198 },
        { roomName: '工艺室', bundleName: '建筑收集包', itemId: 390, itemName: '石头', requiredStack: 99, availableStack: 120 },
      ],
    },
  ]);
});

test('prefers stable room and bundle ids when detail rows provide them', () => {
  const deliverableWithIds: CommunityCenterDeliverableDetail & { roomId: string; bundleId: string } = {
    roomId: 'crafts_room',
    roomName: '工艺室',
    bundleId: 'construction',
    bundleName: '建筑收集包',
    itemId: 388,
    itemName: '木材',
    requiredStack: 99,
    availableStack: 198,
  };

  const grouped = groupCommunityCenterDeliverables([deliverableWithIds]);

  assert.equal(grouped[0]?.key, 'crafts_room:construction');
});
