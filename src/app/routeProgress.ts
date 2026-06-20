import type { StardewSaveSnapshot } from '../shared/types.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { t } from './i18n.ts';

export interface RouteProgressSummary {
  route: StardewSaveSnapshot['farm']['communityCenterRoute'];
  branchLabel: string;
  percent: number;
}

export function createRouteProgressSummary(
  snapshot: StardewSaveSnapshot,
  language: AppLanguage,
): RouteProgressSummary {
  const route = snapshot.farm.communityCenterRoute;

  if (route === 'joja') {
    const joja = snapshot.progression.joja;
    const percent = joja && joja.totalProjects > 0
      ? Math.round((joja.completedProjects / joja.totalProjects) * 100)
      : 0;
    return {
      route,
      branchLabel: t(language, 'mainRoute.joja'),
      percent: clampPercent(percent),
    };
  }

  if (route === 'community_center') {
    const communityCenter = snapshot.progression.communityCenter;
    return {
      route,
      branchLabel: t(language, 'mainRoute.communityCenter'),
      percent: clampPercent(communityCenter?.completed ? 100 : communityCenter?.percentage ?? 0),
    };
  }

  return {
    route,
    branchLabel: t(language, 'mainRoute.unknown'),
    percent: 0,
  };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}
