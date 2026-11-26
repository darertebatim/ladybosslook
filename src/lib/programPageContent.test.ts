import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readProgramContent, writeProgramContent } from './programPageContent';

test('landing section choice persists without losing the original rich text', () => {
  const html = '<p dir="rtl">Original description</p>';
  assert.deepEqual(readProgramContent(writeProgramContent(html, 'acquisition'), 'example'), {
    source: 'acquisition', description: html,
  });
});

test('switching back to rich text overrides the Acquisition default', () => {
  const saved = writeProgramContent('<p>Saved text</p>', 'description');
  assert.equal(readProgramContent(saved, 'casigads').source, 'description');
});

test('only Acquisition defaults to shared sections for existing records', () => {
  assert.equal(readProgramContent(null, 'casigads').source, 'acquisition');
  assert.equal(readProgramContent(null, 'revenue').source, 'description');
});

test('repeated saves replace metadata instead of accumulating it', () => {
  const saved = writeProgramContent(writeProgramContent('<p>Text</p>', 'acquisition'), 'description');
  assert.equal(saved, '<!-- rilo-program-content:description -->\n<p>Text</p>');
});