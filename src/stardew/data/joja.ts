import jojaProjects from './jojaProjects.json' with { type: 'json' };

export interface JojaProject {
  id: string;
  name: string;
  price: number;
  marker: string;
}

export interface JojaProgress {
  completedProjects: number;
  totalProjects: number;
  completedMarkers?: string[];
}

export const JOJA_PROJECTS: JojaProject[] = jojaProjects;

export function getNextJojaProject(progress: JojaProgress | undefined): JojaProject | undefined {
  if (!progress || progress.completedProjects >= progress.totalProjects) {
    return undefined;
  }

  if (progress.completedMarkers) {
    return JOJA_PROJECTS.find((project) => !progress.completedMarkers?.includes(project.marker));
  }

  return JOJA_PROJECTS[progress.completedProjects];
}
