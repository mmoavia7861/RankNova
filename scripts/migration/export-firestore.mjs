// PRIVATE ONE-TIME DATA EXPORT. Use only on owner's trusted machine / Cloud Shell.
// NEVER commit the generated data files or Firebase credentials to GitHub.
import { initializeApp, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { writeFile, mkdir, chmod } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const projectId = process.env.FIREBASE_PROJECT_ID;
const databaseId = process.env.FIRESTORE_DATABASE_ID;
const out = process.env.RANKNOVA_PRIVATE_EXPORT_DIR;
if (!projectId || !databaseId || !out)
  throw new Error('Set FIREBASE_PROJECT_ID, FIRESTORE_DATABASE_ID and RANKNOVA_PRIVATE_EXPORT_DIR first.');
const target = resolve(out);
if (target === process.cwd() || target.startsWith(process.cwd() + '/'))
  throw new Error('Choose a private export directory OUTSIDE your Git repository.');
await mkdir(target, { recursive: true, mode: 0o700 });
await chmod(target, 0o700);

const app = initializeApp({ credential: applicationDefault(), projectId }, 'ranknova-export');
const db = getFirestore(app, databaseId);
function normalize(value) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  }
  return value;
}
const manifest = { sourceProjectId: projectId, databaseId, exportedAt: new Date().toISOString(), collections: {} };
try {
  for (const name of ['articles','feedback','audits','settings']) {
    const snapshot = await db.collection(name).get();
    const rows = snapshot.docs.map(doc => ({ id: doc.id, ...normalize(doc.data()) }));
    const json = JSON.stringify(rows, null, 2) + '\n';
    await writeFile(join(target, name + '.json'), json, { mode: 0o600, flag: 'wx' });
    manifest.collections[name] = {
      count: rows.length, sha256: createHash('sha256').update(json).digest('hex')
    };
    console.log(name + ': ' + rows.length + ' records exported (contents not printed)');
  }
  await writeFile(join(target, 'manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600, flag: 'wx' });
  console.log('Private export completed; protect the directory and back it up securely.');
} finally {
  await deleteApp(app);
}
