import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('keeps recommendation tabs sticky after the overview sections', () => {
  const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  const cssSource = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');

  assert.match(appSource, /<section className="content" id="plan" ref=\{contentRef\} onScroll=\{handleContentScroll\}>/);
  assert.match(appSource, /className="content-overview"[\s\S]*className="route-panel"[\s\S]*<\/div>\s*<RecommendationTabs/);
  assert.match(appSource, /function handleRecommendationTabChange\(tabId: RecommendationTabId\)/);
  assert.match(appSource, /setActiveRecommendationTab\(tabId\);[\s\S]*scheduleRecommendationPanelScrollReset\(\);/);
  assert.match(appSource, /function scrollRecommendationPanelToStartIfSticky\(\)[\s\S]*\.recommendation-tabs[\s\S]*\.recommendation-tab-panel[\s\S]*tabsRect\.top > contentRect\.top \+ 1[\s\S]*content\.scrollTo\(\{ top: targetScrollTop, behavior: 'auto' \}\);/);
  assert.match(appSource, /onTabChange=\{handleRecommendationTabChange\}/);
  assert.equal(appSource.includes('overviewContent={overviewContent}'), false);
  assert.equal(appSource.includes('onContentScroll={handleContentScroll}'), false);
  assert.equal(appSource.includes('className="recommendation-tab-panel"\n        ref={contentRef}'), false);
  assert.match(cssSource, /\.content\s*\{[\s\S]*align-content:\s*start;[\s\S]*overflow-y:\s*auto;/);
  assert.match(cssSource, /\.content-overview\s*\{[\s\S]*display:\s*grid;[\s\S]*gap:\s*20px;/);
  assert.match(cssSource, /\.recommendation-tabs\s*\{[\s\S]*position:\s*sticky;[\s\S]*top:\s*-32px;/);
  assert.match(cssSource, /\.recommendation-tabs\s*\{[\s\S]*width:\s*calc\(100% \+ 64px\);[\s\S]*margin-inline:\s*-32px;/);
  assert.match(cssSource, /\.recommendation-tabs\s*\{[\s\S]*background:\s*#f7f6f1;[\s\S]*border-bottom:\s*1px solid #d7dfd4;/);
  assert.match(cssSource, /@media \(max-width: 760px\)[\s\S]*\.recommendation-tabs\s*\{[\s\S]*top:\s*0;/);
  assert.equal(/\.recommendation-tabs\s*\{[\s\S]*width:\s*fit-content;/.test(cssSource), false);
  assert.equal(/\.recommendation-tab-panel\s*\{[\s\S]*overflow-y:\s*auto;/.test(cssSource), false);
});

test('opens grouped planting details in a recommendation-card modal', () => {
  const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  const cssSource = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');

  assert.match(appSource, /function PlantingActionsModal\(/);
  assert.match(appSource, /detailItem\?\.detail\?\.plantingActions[\s\S]*<PlantingActionsModal/);
  assert.match(appSource, /Boolean\(item\.detail\?\.plantingActions\?\.length\)/);
  assert.match(appSource, /className="gift-modal planting-actions-modal"/);
  assert.match(appSource, /className="planting-actions-grid"[\s\S]*\(items \?\? \[\]\)\.map[\s\S]*className="recommendation-card"[\s\S]*<RecommendationCardBody item=\{item\} language=\{language\} \/>/);
  assert.match(cssSource, /\.planting-actions-modal,[\s\S]*\.greenhouse-planting-modal\s*\{[\s\S]*width:\s*min\(1040px,\s*100%\);/);
  assert.match(cssSource, /\.planting-actions-grid,[\s\S]*\.greenhouse-planting-grid\s*\{[\s\S]*display:\s*grid;[\s\S]*overflow:\s*auto;[\s\S]*overscroll-behavior:\s*contain;/);
});

test('opens grouped recommendation action details in a recommendation-card modal', () => {
  const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  const cssSource = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');

  assert.match(appSource, /function RecommendationActionsModal\(/);
  assert.match(appSource, /detailItem\?\.detail\?\.recommendationActions[\s\S]*<RecommendationActionsModal/);
  assert.match(appSource, /Boolean\(item\.detail\?\.recommendationActions\?\.length\)/);
  assert.match(appSource, /className="gift-modal recommendation-actions-modal"/);
  assert.match(appSource, /className="recommendation-actions-grid"[\s\S]*\(items \?\? \[\]\)\.map[\s\S]*className="recommendation-card"[\s\S]*<RecommendationCardBody item=\{item\} language=\{language\} \/>/);
  assert.match(cssSource, /\.recommendation-actions-modal,[\s\S]*\.greenhouse-planting-modal\s*\{[\s\S]*width:\s*min\(1040px,\s*100%\);/);
  assert.match(cssSource, /\.recommendation-actions-grid,[\s\S]*\.greenhouse-planting-grid\s*\{[\s\S]*display:\s*grid;[\s\S]*overflow:\s*auto;[\s\S]*overscroll-behavior:\s*contain;/);
});

test('resets calendar selected day when the plan date model changes', () => {
  const calendarSource = readFileSync(new URL('./calendar/CalendarPanel.tsx', import.meta.url), 'utf8');

  assert.match(calendarSource, /import \{ useEffect, useMemo, useState \} from 'react';/);
  assert.match(calendarSource, /useEffect\(\(\) => \{\s*setSelectedDay\(model\.selectedDay\);\s*\}, \[model\]\);/);
});

test('uses a cake emoji instead of a letter for birthday calendar badges', () => {
  const badgeSource = readFileSync(new URL('./calendar/CalendarEventBadge.tsx', import.meta.url), 'utf8');

  assert.match(badgeSource, /event\.type === 'birthday' \? '🎂'/);
  assert.doesNotMatch(badgeSource, /event\.type === 'birthday' \? 'B'/);
});

test('uses emoji icons instead of letters for festival and special calendar badges', () => {
  const badgeSource = readFileSync(new URL('./calendar/CalendarEventBadge.tsx', import.meta.url), 'utf8');

  assert.match(badgeSource, /event\.type === 'special' \? '⭐' : '🎉'/);
  assert.doesNotMatch(badgeSource, /event\.type === 'special' \? 'S' : 'F'/);
});
