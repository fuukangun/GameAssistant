import { spawnSync } from 'node:child_process';

const requestedFiles = process.argv.slice(2);
const testFiles = requestedFiles.length > 0 ? requestedFiles : ['src/**/*.test.ts'];

const result = spawnSync(
  process.execPath,
  ['--experimental-strip-types', '--test', ...testFiles],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
