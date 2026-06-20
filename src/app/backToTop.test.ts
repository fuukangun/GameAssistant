import test from 'node:test';
import assert from 'node:assert/strict';
import { getBackToTopButtonA11yProps, shouldShowBackToTop } from './backToTop.ts';

test('shows back to top button after scrolling past a useful threshold', () => {
  assert.equal(shouldShowBackToTop(360), true);
});

test('hides back to top button near the top of the content', () => {
  assert.equal(shouldShowBackToTop(120), false);
});

test('uses localized tooltip text for the back to top button', () => {
  assert.deepEqual(getBackToTopButtonA11yProps('zh-CN'), {
    'aria-label': '返回顶部',
    title: '返回顶部',
  });
});
