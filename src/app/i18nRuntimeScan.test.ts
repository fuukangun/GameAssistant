import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const hanPattern = /[\u4e00-\u9fff]/;

test('keeps app shell UI copy behind i18n translations', () => {
  const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  const sourceFile = ts.createSourceFile('App.tsx', appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const matches: string[] = [];

  function visit(node: ts.Node) {
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && hanPattern.test(node.text)) {
      matches.push(node.text);
    }
    if (ts.isTemplateExpression(node) && hanPattern.test(node.head.text)) {
      matches.push(node.getText(sourceFile));
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  assert.deepEqual(matches, []);
});

test('does not surface raw caught error messages in app shell status copy', () => {
  const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');

  assert.equal(appSource.includes('setImportMessage(error instanceof Error ? error.message'), false);
});

test('English UI translations do not contain Chinese text', () => {
  const translations = JSON.parse(readFileSync(new URL('./i18nTranslations.json', import.meta.url), 'utf8')) as {
    'en-US': Record<string, string>;
  };
  const leaked = Object.entries(translations['en-US'])
    .filter(([key]) => key !== 'settings.language.zh')
    .filter(([, value]) => hanPattern.test(value))
    .map(([key, value]) => `${key}: ${value}`);

  assert.deepEqual(leaked, []);
});
