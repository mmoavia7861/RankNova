// PRIVATE ONE-TIME IMPORT with dry-run default. Requires Supabase secret key
// only on an owner's trusted machine; NEVER use VITE_ or GitHub public actions.
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const inputDir = process.env.RANKNOVA_PRIVATE_EXPORT_DIR;
const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const apply = process.argv.includes('--apply');
if (!inputDir) throw new Error('RANKNOVA_PRIVATE_EXPORT_DIR is required.');
if (apply && (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url || '') || !secret))
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY required for --apply.');
if (apply && !secret.startsWith('sb_secret_'))
  throw new Error('Use a private Supabase sb_secret_ key; legacy service_role keys are not supported by this script.');
const manifest = JSON.parse(await readFile(join(resolve(inputDir), 'manifest.json'), 'utf8'));
const file = async name => {
  const json = await readFile(join(resolve(inputDir), name + '.json'), 'utf8');
  const digest = createHash('sha256').update(json).digest('hex');
  if (digest !== manifest.collections[name]?.sha256) throw new Error(name + ': backup checksum mismatch.');
  return JSON.parse(json);
};
const created = val => {
  const x = val?.createdAt || val?.created_at || val;
  if (typeof x === 'string' && !Number.isNaN(Date.parse(x))) return x;
  if (x && typeof x.seconds === 'number') return new Date(x.seconds * 1000).toISOString();
  return new Date().toISOString();
};
const original = {
  articles: await file('articles'), feedback: await file('feedback'),
  audits: await file('audits'), settings: await file('settings')
};
const payload = {
  articles: original.articles.map(a => ({
    id: String(a.id), slug: String(a.slug || ''), title: String(a.title || ''),
    excerpt: String(a.excerpt || ''), content: String(a.content || ''),
    category: String(a.category || 'SEO Guide'), author: String(a.author || 'RankNova'),
    published: a.published === true, created_at: created(a)
  })),
  feedback: original.feedback.map(a => ({
    id: String(a.id), name: String(a.name || 'Anonymous User'), email: String(a.email || ''),
    subject: String(a.subject || ''), message: String(a.message || ''),
    created_at: created(a)
  })),
  audit_history: original.audits.map(a => ({
    id: String(a.id), user_id: null,
    legacy_firebase_uid: a.userId ? String(a.userId) : null,
    url: String(a.url || ''), score: Number(a.score),
    passed_count: Number(a.passedCount || 0), warnings_count: Number(a.warningsCount || 0),
    errors_count: Number(a.errorsCount || 0), title: String(a.title || ''),
    meta_description: String(a.metaDescription || ''), created_at: created(a)
  })),
  site_settings: original.settings.filter(a => a.id === 'config').map(a => ({
    id: 'config', site_name: String(a.siteName || 'RankNova'),
    adsense_client_id: String(a.adSenseClientId || ''),
    ads_enabled: false, cmp_enabled: false,
    tools_enabled: a.toolsEnabled || { seoAudit:true, metaGenerator:true, schemaGenerator:true },
    updated_at: new Date().toISOString()
  }))
};
for (const [table, rows] of Object.entries(payload))
  console.log(table + ': ' + rows.length + ' rows ' + (apply ? 'to import' : 'validated for dry run'));
if (!apply) {
  console.log('DRY RUN ONLY. Nothing was written. Re-run with --apply after reviewing backup and SQL schema.');
  process.exit(0);
}
const projectRef = new URL(url).hostname.split('.')[0];
if (process.env.CONFIRM_SUPABASE_REF !== projectRef)
  throw new Error('Set CONFIRM_SUPABASE_REF to the exact destination project ref before --apply.');
const client = createClient(url, secret, { auth: { persistSession:false,autoRefreshToken:false } });
for (const [table, rows] of Object.entries(payload)) {
  for (let offset=0;offset<rows.length;offset+=100) {
    const chunk = rows.slice(offset, offset+100);
    const { error } = await client.from(table).upsert(chunk, { onConflict:'id' });
    if (error) throw new Error(table + ' import failed: ' + error.message);
  }
  const { count, error } = await client.from(table).select('id', { head:true,count:'exact' });
  if (error) throw new Error('Count verification failed: '+table+': '+error.message);
  // Extra rows may predate the import. Never delete them automatically.
  if ((count || 0) < rows.length) throw new Error('Row count is smaller than source in '+table);
  console.log(table + ': imported; destination table count >= source (' + count + ')');
}
console.log('Import completed. Firebase source has NOT been deleted. Owner auth and private legacy audit ownership mapping remain manual.');
