import {
  communityCenterCompletedSnapshot,
  communityCenterMidgameSnapshot,
  jojaCompletedSnapshot,
  unknownRouteSpringOneSnapshot,
} from './communityCenterSnapshots.ts';
import { demoSnapshot } from './demoSnapshot.ts';
import type { StardewSaveSnapshot } from '../../shared/types.ts';

export type RepresentativeFixtureId = 'fun' | 'mushroom' | 'vanilla' | 'fazenda-a' | 'moja-joja';

export interface RepresentativeFixture {
  id: RepresentativeFixtureId;
  label: string;
  snapshot: StardewSaveSnapshot;
}

export const REPRESENTATIVE_FIXTURES: RepresentativeFixture[] = [
  {
    id: 'fun',
    label: 'fun',
    snapshot: unknownRouteSpringOneSnapshot,
  },
  {
    id: 'mushroom',
    label: 'mushroom',
    snapshot: communityCenterMidgameSnapshot,
  },
  {
    id: 'vanilla',
    label: 'Vanilla',
    snapshot: communityCenterCompletedSnapshot,
  },
  {
    id: 'fazenda-a',
    label: 'Fazenda A',
    snapshot: demoSnapshot,
  },
  {
    id: 'moja-joja',
    label: 'Moja Joja',
    snapshot: jojaCompletedSnapshot,
  },
];
