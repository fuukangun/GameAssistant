import test from 'node:test';
import assert from 'node:assert/strict';
import { REPRESENTATIVE_FIXTURES, type RepresentativeFixtureId } from './representativeFixtures.ts';

test('covers the required representative save scenarios without local filesystem paths', () => {
  const expected: RepresentativeFixtureId[] = ['fun', 'mushroom', 'vanilla', 'fazenda-a', 'moja-joja'];

  assert.deepEqual(REPRESENTATIVE_FIXTURES.map((fixture) => fixture.id).sort(), expected.sort());
  assert.equal(REPRESENTATIVE_FIXTURES.some((fixture) => fixture.snapshot.saveIdentity.filePath.startsWith('/Users/')), false);
});
