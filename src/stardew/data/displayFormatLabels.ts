import displayFormatLabels from './displayFormatLabels.json' with { type: 'json' };

export interface DisplayFormatLabelsData {
  seasonLabels: Record<string, Record<string, string>>;
  farmTypeLabels: Record<string, Record<string, string>>;
  routeLabels: Record<string, Record<string, string>>;
  priorityLabels: Record<string, Record<string, string>>;
  confidenceLabels: Record<string, Record<string, string>>;
  npcNameLabels: Record<string, string>;
  luckLabels: Record<string, Record<string, string>>;
}

export const DISPLAY_FORMAT_LABELS = displayFormatLabels as DisplayFormatLabelsData;
