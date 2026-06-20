import type { PlannerGoal } from '../../shared/types.ts';

export const CURRENT_CONFIG_VERSION = 1;
export type AppLanguage = 'zh-CN' | 'en-US';

export interface LocalAppConfig {
  configVersion: number;
  language: AppLanguage;
  selectedSavePath?: string;
  customSaveDirectories: string[];
  manualSaveDirectories: string[];
  saveNotes: Record<string, SaveNote>;
  plannerDefaults: {
    goal: PlannerGoal;
  };
}

export interface SaveNote {
  saveId: string;
  note: string;
  updatedAt: string;
}

export function createDefaultConfig(): LocalAppConfig {
  return {
    configVersion: CURRENT_CONFIG_VERSION,
    language: 'zh-CN',
    customSaveDirectories: [],
    manualSaveDirectories: [],
    saveNotes: {},
    plannerDefaults: {
      goal: 'free',
    },
  };
}

export function migrateConfig(value: unknown): LocalAppConfig {
  if (!isObject(value)) {
    return createDefaultConfig();
  }

  const legacy = value as Partial<LocalAppConfig>;

  return {
    configVersion: CURRENT_CONFIG_VERSION,
    language: normalizeLanguage(legacy.language),
    selectedSavePath: typeof legacy.selectedSavePath === 'string' ? legacy.selectedSavePath : undefined,
    customSaveDirectories: normalizeStringList(legacy.customSaveDirectories),
    manualSaveDirectories: normalizeStringList((legacy as Partial<LocalAppConfig>).manualSaveDirectories),
    saveNotes: isObject(legacy.saveNotes) ? normalizeSaveNotes(legacy.saveNotes) : {},
    plannerDefaults: {
      goal: legacy.plannerDefaults?.goal === 'money' ? 'money' : 'free',
    },
  };
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0))];
}

function normalizeLanguage(value: unknown): AppLanguage {
  return value === 'en-US' ? 'en-US' : 'zh-CN';
}

function normalizeSaveNotes(value: Record<string, unknown>): Record<string, SaveNote> {
  const notes: Record<string, SaveNote> = {};

  for (const [key, note] of Object.entries(value)) {
    if (!isObject(note)) {
      continue;
    }

    const saveId = typeof note.saveId === 'string' ? note.saveId : key;
    const text = typeof note.note === 'string' ? note.note : '';
    const updatedAt = typeof note.updatedAt === 'string' ? note.updatedAt : new Date(0).toISOString();
    notes[key] = { saveId, note: text, updatedAt };
  }

  return notes;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
