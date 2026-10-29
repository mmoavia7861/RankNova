import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('Firebase function bundles original real SEO audit logic', () => {
  const js = readFileSync(new URL('../lib/index.cjs', import.meta.url), 'utf8');
  assert.match(js, /runSeoAudit|SEO Audit|Audit/);
  assert.match(js, /ranknovaApi/);
  assert.doesNotMatch(js, /inventedScore|fakeScore/);
});
test('Firebase Hosting rewrites point /api to ranknovaApi function', () => {
  const config = JSON.parse(readFileSync(new URL('../../firebase.json', import.meta.url), 'utf8'));
  assert.equal(config.hosting.rewrites[0].source, '/api/**');
  assert.equal(config.hosting.rewrites[0].function.functionId, 'ranknovaApi');
  assert.ok(existsSync(new URL('../lib/index.cjs', import.meta.url)));
});
