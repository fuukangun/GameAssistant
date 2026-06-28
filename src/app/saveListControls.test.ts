import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('renders save refresh and manual delete as icon buttons', () => {
  const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  const cssSource = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');

  assert.match(appSource, /from '\.\/saveListDisplay\.ts'/);
  assert.match(appSource, /<RefreshCw aria-hidden="true"/);
  assert.match(appSource, /<Trash2 aria-hidden="true"/);
  assert.match(appSource, /className="icon-button"/);
  assert.match(appSource, /t\(language, 'saves\.manualBadge'\)/);
  assert.match(appSource, /save\.source === 'manual'/);
  assert.equal(appSource.includes('>刷新存档<'), false);
  assert.equal(appSource.includes('>删除手动导入<'), false);
  assert.match(cssSource, /\.save-row\s*{[^}]*position: relative;/s);
  assert.match(cssSource, /\.save-source-badge\s*{[^}]*position: absolute;[^}]*top: 5px;[^}]*right: 8px;/s);
});
