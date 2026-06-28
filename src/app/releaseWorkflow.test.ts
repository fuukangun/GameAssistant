import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('release workflow runs verification and uses versioned artifact names', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/release.yml', import.meta.url), 'utf8');

  assert.match(workflow, /npm run typecheck/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /cargo test --manifest-path src-tauri\/Cargo\.toml/);
  assert.match(workflow, /GameAssistant-\$\{\{ github\.ref_name \}\}-macos-aarch64-dmg/);
  assert.match(workflow, /GameAssistant-\$\{\{ github\.ref_name \}\}-windows-x64-setup/);
});
