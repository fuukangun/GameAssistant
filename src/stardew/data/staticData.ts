export interface StaticDataFile {
  gameVersion: string;
  dataVersion: string;
  source: string;
  items: unknown[];
}

export type StaticDataValidationResult =
  | { ok: true; warning?: 'game_version_mismatch' }
  | { ok: false; reason: 'invalid_data' | 'missing_required_field' };

export function validateStaticDataFile(
  value: unknown,
  supportedGameVersion = '1.6.x',
): StaticDataValidationResult {
  if (!isObject(value)) {
    return { ok: false, reason: 'invalid_data' };
  }

  if (
    typeof value.gameVersion !== 'string'
    || typeof value.dataVersion !== 'string'
    || typeof value.source !== 'string'
    || !Array.isArray(value.items)
  ) {
    return { ok: false, reason: 'missing_required_field' };
  }

  if (value.gameVersion !== supportedGameVersion) {
    return { ok: true, warning: 'game_version_mismatch' };
  }

  return { ok: true };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
