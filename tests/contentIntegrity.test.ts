import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('homepage does not pretend live 200 OK or 240ms network results', () => {
  const home = source('src/pages/HomePage.tsx');
  assert.doesNotMatch(home, /Safe outbound fetch completed in 240ms|STATUS: ACTIVE/);
});

test('schema generator starts without fictional businesses and reviews', () => {
  const schema = source('src/components/tools/SchemaGenerator/SchemaGeneratorTool.tsx');
  for (const fake of ['Sarah Jenkins', '100 Innovation Way', 'San Francisco', "'4.9'", "'128'", 'ranknova.app']) {
    assert.ok(!schema.includes(fake), `Unexpected seeded data: ${fake}`);
  }
  assert.match(schema, /disabled=\{hasSchemaErrors\}/);
});

test('the 4 educational guides have topic-specific bodies', () => {
  const detail = source('src/pages/GuideDetailPage.tsx');
  for (const slug of [
    'title-tag-optimization-guide',
    'schema-json-ld-mastery',
    'technical-seo-audit-checklist',
    'meta-description-best-practices'
  ]) assert.ok(detail.includes(`"${slug}"`), `Missing guide: ${slug}`);
  assert.doesNotMatch(detail, /\|\| ARTICLES_DATA\[0\]/);
});

test('frontend-only GitHub Pages preview does not pretend API audit works', () => {
  const tool = source('src/components/tools/SeoAudit/SeoAuditTool.tsx');
  assert.match(tool, /GitHub Pages/);
  assert.match(tool, /disabled=\{loading \|\| isStaticPreview\}/);
});

test('private Firestore admin access cannot be granted by an admins document', () => {
  const rules = source('firestore.rules');
  assert.doesNotMatch(rules, /exists\(\/databases\/\$\(database\)\/documents\/admins/);
  assert.match(rules, /request\.auth\.token\.email_verified == true/);
});
