import farmPlotMessages from './farmPlotMessages.json' with { type: 'json' };

export interface FarmPlotMessagesData {
  unknownFields: Record<string, string>;
  emptyCropEvidence: string;
}

export const FARM_PLOT_MESSAGES = farmPlotMessages as FarmPlotMessagesData;
