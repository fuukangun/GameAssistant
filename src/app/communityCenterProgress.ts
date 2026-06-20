import type { StardewSaveSnapshot } from '../shared/types.ts';
import { createCommunityCenterSummary } from '../stardew/data/communityCenter.ts';

export interface CommunityCenterProgressRequirement {
  itemId: number | string;
  itemName: string;
  requiredStack: number;
  availableStack: number;
  deliverable: boolean;
  completed: boolean;
}

export interface CommunityCenterProgressBundle {
  roomId: string;
  roomName: string;
  bundleId: string;
  bundleName: string;
  completed: boolean;
  requirements: CommunityCenterProgressRequirement[];
}

export interface CommunityCenterProgressRoom {
  roomId: string;
  roomName: string;
  bundles: CommunityCenterProgressBundle[];
}

export function createCommunityCenterProgress(snapshot: StardewSaveSnapshot): CommunityCenterProgressRoom[] {
  const summary = createCommunityCenterSummary(snapshot);

  return summary.rooms.map((room) => ({
    roomId: room.id,
    roomName: room.name,
    bundles: room.bundles.map((bundle) => {
      const completed = bundle.completed === true;

      return {
        roomId: room.id,
        roomName: room.name,
        bundleId: bundle.id,
        bundleName: bundle.name,
        completed,
        requirements: bundle.requirements.map((requirement) => ({
          itemId: requirement.itemId,
          itemName: requirement.itemName,
          requiredStack: requirement.requiredStack,
          availableStack: requirement.availableStack,
          deliverable: !completed && requirement.deliverable,
          completed,
        })),
      };
    }),
  }));
}
