import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_PARSING_RULES } from './saveParsingRules.ts';
import saveParsingRulesJson from './saveParsingRules.json' with { type: 'json' };

test('loads save parsing rules from external JSON data', () => {
  assert.deepEqual(SAVE_PARSING_RULES, saveParsingRulesJson);
});

test('save parsing rules cover farm, weather, joja, and equipment mappings', () => {
  assert.equal(SAVE_PARSING_RULES.farmTypes['0'], 'standard');
  assert.ok(SAVE_PARSING_RULES.weatherValues.includes('sunny'));
  assert.ok(SAVE_PARSING_RULES.jojaProjectMarkers.includes('jojaVault'));
  assert.equal(SAVE_PARSING_RULES.equipment.displayNames.IridiumPickaxe, 'Iridium Pickaxe');
  assert.ok(SAVE_PARSING_RULES.equipment.pan.itemIds.includes('IridiumPan'));
});
