import test from 'node:test';
import assert from 'node:assert/strict';
import { BIRTHDAYS } from './calendar.ts';
import { DISPLAY_FORMAT_LABELS } from './displayFormatLabels.ts';
import displayFormatLabels from './displayFormatLabels.json' with { type: 'json' };
import { NPC_GIFT_PREFERENCES, SOCIAL_NPCS } from './npcs.ts';

test('loads display format labels from external JSON data', () => {
  assert.deepEqual(DISPLAY_FORMAT_LABELS, displayFormatLabels);
  assert.equal(DISPLAY_FORMAT_LABELS.seasonLabels['zh-CN'].spring, '春季');
  assert.equal(DISPLAY_FORMAT_LABELS.npcNameLabels.Sebastian, '塞巴斯蒂安');
});

test('covers Chinese display names for all user-facing npcs', () => {
  const userFacingNpcs = [...new Set([
    ...SOCIAL_NPCS,
    ...NPC_GIFT_PREFERENCES.map((preference) => preference.npc),
    ...BIRTHDAYS.map((birthday) => birthday.npc),
  ])].sort();
  const missingLabels = userFacingNpcs.filter((npc) => !DISPLAY_FORMAT_LABELS.npcNameLabels[npc]);
  const unchangedLabels = userFacingNpcs.filter((npc) => DISPLAY_FORMAT_LABELS.npcNameLabels[npc] === npc);

  assert.deepEqual(missingLabels, []);
  assert.deepEqual(unchangedLabels, []);
});
