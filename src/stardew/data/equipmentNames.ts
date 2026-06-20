import equipmentNames from './equipmentNames.json' with { type: 'json' };

export const EQUIPMENT_NAME_LABELS: Record<string, string> = equipmentNames;

export function getEquipmentNameLabel(name: string | undefined): string | undefined {
  if (!name) {
    return undefined;
  }

  return EQUIPMENT_NAME_LABELS[name];
}
