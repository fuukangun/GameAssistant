import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMUNITY_CENTER_BUNDLES } from './communityCenter.ts';
import { BASIC_PLANTING_OPTIONS } from './crops.ts';
import { FISH_CATALOG } from './fish.ts';
import { getItemIdByName, getItemNameById, ITEM_CATALOG } from './items.ts';
import itemCatalog from './itemCatalog.json' with { type: 'json' };
import { EQUIPMENT_NAME_LABELS, getEquipmentNameLabel } from './equipmentNames.ts';
import equipmentNames from './equipmentNames.json' with { type: 'json' };
import { validateStaticDataFile } from './staticData.ts';
import { createStaticDataCoverageReport } from './staticDataCoverage.ts';

test('accepts a valid static data file', () => {
  const result = validateStaticDataFile({
    gameVersion: '1.6.x',
    dataVersion: '2026-06-18',
    source: 'fixture',
    items: [],
  });

  assert.deepEqual(result, { ok: true });
});

test('loads item catalog from external JSON data', () => {
  assert.deepEqual(ITEM_CATALOG, itemCatalog);
});

test('resolves item catalog ids and localized aliases without scanning behavior regressions', () => {
  assert.equal(getItemNameById('(O)388'), '木材');
  assert.equal(getItemIdByName('木材'), '388');
});

test('loads equipment Chinese labels from external JSON data', () => {
  assert.deepEqual(EQUIPMENT_NAME_LABELS, equipmentNames);
  assert.equal(getEquipmentNameLabel('Galaxy Sword'), '银河剑');
  assert.equal(getEquipmentNameLabel('Iridium Band'), '铱环');
  assert.equal(getEquipmentNameLabel("Burglar's Ring"), '窃贼戒指');
});

test('rejects static data missing required metadata', () => {
  const result = validateStaticDataFile({
    gameVersion: '1.6.x',
    items: [],
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'missing_required_field');
});

test('warns when static data targets a different game version', () => {
  const result = validateStaticDataFile({
    gameVersion: '1.5.x',
    dataVersion: '2026-06-18',
    source: 'fixture',
    items: [],
  }, '1.6.x');

  assert.deepEqual(result, {
    ok: true,
    warning: 'game_version_mismatch',
  });
});

test('community center requirements have catalog names or explicit bundle names', () => {
  const missingNames = COMMUNITY_CENTER_BUNDLES.flatMap((room) => {
    return room.bundles.flatMap((bundle) => {
      return bundle.requirements.flatMap((requirement) => {
        const catalogName = getItemNameById(requirement.itemId);
        if (catalogName || requirement.itemName.trim().length > 0) {
          return [];
        }

        return [`${room.id}.${bundle.id}:${requirement.itemId}`];
      });
    });
  });

  assert.deepEqual(missingNames, []);
});

test('crop seed ids resolve through item catalog or have seed name fallback', () => {
  const unresolvedSeeds = BASIC_PLANTING_OPTIONS.flatMap((crop) => {
    return crop.seedIds.flatMap((seedId) => {
      const catalogName = getItemNameById(seedId);
      if (catalogName || crop.seedName.trim().length > 0) {
        return [];
      }

      return [`${crop.id}:${seedId}`];
    });
  });

  assert.deepEqual(unresolvedSeeds, []);
});

test('fish catalog entries include complete base fields', () => {
  const invalidFish = FISH_CATALOG.flatMap((fish) => {
    const problems: string[] = [];

    if (!fish.id.trim()) {
      problems.push('id');
    }
    if (!fish.name.trim()) {
      problems.push('name');
    }
    if (fish.seasons !== 'all' && fish.seasons.length === 0) {
      problems.push('seasons');
    }
    if (fish.weathers !== 'any' && fish.weathers.length === 0) {
      problems.push('weathers');
    }
    if (fish.locations.length === 0) {
      problems.push('locations');
    }
    if (!fish.timeWindow.trim()) {
      problems.push('timeWindow');
    }
    if (!Number.isFinite(fish.basePrice) || fish.basePrice <= 0) {
      problems.push('basePrice');
    }

    return problems.length > 0 ? [`${fish.id || '<missing>'}:${problems.join(',')}`] : [];
  });

  assert.deepEqual(invalidFish, []);
});

test('reports static data coverage counts for release review', () => {
  const report = createStaticDataCoverageReport();

  assert.equal(report.itemCatalogCount > 0, true);
  assert.equal(report.itemIconCount > 0, true);
  assert.equal(report.npcGiftPreferenceCount > 0, true);
  assert.equal(report.fishRuleCount > 0, true);
  assert.equal(report.processingRuleCount > 0, true);
  assert.equal(report.upgradeRuleCount > 0, true);
  assert.equal(report.recommendationLocalizationCount > 0, true);
});
