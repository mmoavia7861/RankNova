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

test('GitHub Pages audit requires a configured healthy API and has no fake scores', () => {
  const tool = source('src/components/tools/SeoAudit/SeoAuditTool.tsx');
  const api = source('src/lib/apiClient.ts');
  const workflow = source('.github/workflows/deploy-pages.yml');
  assert.match(tool, /disabled=\{loading \|\| apiUnavailable\}/);
  assert.match(tool, /checkApiHealth\(\)/);
  assert.match(api, /API_CONFIGURED/);
  assert.match(api, /VITE_API_BASE_URL/);
  assert.match(workflow, /vars\.RANKNOVA_API_BASE_URL/);
});

test('Supabase RLS and owner membership replace frontend email trust', () => {
  const sql = source('supabase/migrations/20261030_ranknova_initial.sql');
  const client = source('src/lib/supabase.ts');
  const dashboard = source('src/pages/AdminPage.tsx');
  assert.match(sql, /alter table public\.articles enable row level security/);
  assert.match(sql, /alter table public\.feedback enable row level security/);
  assert.match(sql, /alter table public\.admin_users enable row level security/);
  assert.match(sql, /revoke all on public\.admin_users/);
  assert.match(sql, /user_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /security definer/);
  assert.match(sql, /revoke all on function public\.submit_ranknova_feedback/);
  assert.match(client, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(dashboard, /ownerConfirmed/);
  assert.doesNotMatch(dashboard, /isUserAdmin|ADMIN_EMAIL/);
});

test('active public site features no longer import Firebase SDK', () => {
  for (const path of [
    'src/App.tsx', 'src/components/layout/Navbar.tsx',
    'src/pages/AdminPage.tsx', 'src/pages/ContactPage.tsx',
    'src/pages/GuidesPage.tsx', 'src/pages/GuideDetailPage.tsx',
    'src/components/tools/SeoAudit/SeoAuditTool.tsx', 'src/lib/workspace.ts'
  ]) assert.doesNotMatch(source(path), /from ['"]firebase(?:\/|['"])|from ['"][^'"]*\/firebase['"]/);
});

test('production build accepts Supabase public vars without revealing server secrets', () => {
  const workflow = source('.github/workflows/deploy-pages.yml');
  assert.match(workflow, /vars\.RANKNOVA_SUPABASE_URL/);
  assert.match(workflow, /vars\.RANKNOVA_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(workflow, /SUPABASE_SECRET_KEY|service_role/);
});
