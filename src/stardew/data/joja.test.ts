import test from 'node:test';
import assert from 'node:assert/strict';
import { JOJA_PROJECTS, getNextJojaProject } from './joja.ts';
import jojaProjects from './jojaProjects.json' with { type: 'json' };

test('lists joja projects with marker and price data', () => {
  assert.deepEqual([...JOJA_PROJECTS].sort((left, right) => left.marker.localeCompare(right.marker)).map((project) => project.marker), [
    'jojaBoilerRoom',
    'jojaCraftsRoom',
    'jojaFishTank',
    'jojaPantry',
    'jojaVault',
  ].sort());
  assert.deepEqual(JOJA_PROJECTS.map((project) => project.price), [
    15000,
    20000,
    25000,
    35000,
    40000,
  ]);
});

test('loads joja projects from external JSON data', () => {
  assert.deepEqual(JOJA_PROJECTS, jojaProjects);
});

test('returns the lowest-price unfinished joja project from completed count', () => {
  const nextProject = getNextJojaProject({ completedProjects: 1, totalProjects: 5 });

  assert.equal(nextProject?.name, '淘金盘');
  assert.equal(nextProject?.price, 20000);
  assert.equal(nextProject?.marker, 'jojaFishTank');
});

test('returns the lowest-price unfinished joja project from completed markers', () => {
  const nextProject = getNextJojaProject({
    completedProjects: 1,
    totalProjects: 5,
    completedMarkers: ['jojaBoilerRoom', 'jojaFishTank'],
  });

  assert.equal(nextProject?.name, '桥梁维修');
  assert.equal(nextProject?.price, 25000);
  assert.equal(nextProject?.marker, 'jojaCraftsRoom');
});

test('returns undefined when all known joja projects are completed', () => {
  assert.equal(getNextJojaProject({ completedProjects: 5, totalProjects: 5 }), undefined);
});
