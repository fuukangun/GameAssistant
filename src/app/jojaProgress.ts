import type { StardewSaveSnapshot } from '../shared/types.ts';
import { JOJA_PROJECTS } from '../stardew/data/joja.ts';

export interface JojaProjectProgress {
  id: string;
  name: string;
  price: number;
  marker: string;
  completed: boolean;
}

export function createJojaProgress(snapshot: StardewSaveSnapshot): JojaProjectProgress[] {
  const progress = snapshot.progression.joja;
  if (snapshot.farm.communityCenterRoute !== 'joja' || !progress) {
    return [];
  }

  const completedMarkers = new Set(progress.completedMarkers ?? []);
  return JOJA_PROJECTS.map((project, index) => ({
    ...project,
    completed: progress.completedMarkers
      ? completedMarkers.has(project.marker)
      : index < progress.completedProjects,
  }));
}
