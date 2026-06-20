import type { SaveIdentity } from '../../shared/types.ts';

export function getSaveNoteKey(identity: SaveIdentity): string {
  return identity.uniqueId ?? identity.filePath;
}
