# RankNova — Firebase to Supabase PostgreSQL Migration

**Status:** Prepared on a GitHub migration branch only. **NOT deployed**. Do not merge until data export, owner login, database tests, and cutover are complete. Nothing in this branch deletes Firebase data.

## 1. Create YOUR Supabase project

Open https://supabase.com/dashboard and create/select a project you control. Store the project URL and **publishable** key. Do not share your database password or secret key. The Supabase integration can be connected in ChatGPT to allow the next stage of work directly in your project.

## 2. Securely back up the existing named Firebase database first

Current source: Firebase project `gen-lang-client-0081440357`, named Firestore database `ai-studio-ranknovaseogrowt-34ea8465-b3cb-436b-83cc-1a616955cd16`.

**Do not paste a service-account key into chat or commit it to GitHub.** On your own trusted machine, use Google Application Default Credentials with read rights to that project/database. Choose a PRIVATE folder OUTSIDE the repo:

```bash
export FIREBASE_PROJECT_ID=gen-lang-client-0081440357
export FIRESTORE_DATABASE_ID=ai-studio-ranknovaseogrowt-34ea8465-b3cb-436b-83cc-1a616955cd16
export RANKNOVA_PRIVATE_EXPORT_DIR=$HOME/private-ranknova-backup-2026
npm install
npm run migration:export
```

This exports `articles`, `feedback`, `audits` and `settings` with original document IDs, timestamps, row counts and SHA256 hashes. Keep the backup encrypted and never upload it to a public repo. Verify collections and row counts manually. Old Google/Firebase credentials and sessions are not migrated by the data export.

## 3. Create PostgreSQL schema and policies

In your Supabase project's SQL Editor, review and apply the file:
`supabase/migrations/20261030_ranknova_initial.sql`.

It creates:
- `articles` (public SELECT for published only; owner writes)
- `feedback` (owner reads/deletes; anonymous writes only via validated RPC)
- `audit_history` (each new Supabase user reads/writes only their own)
- `site_settings` (owner only; advertising disabled by default)
- `admin_users` (private Supabase Auth user-ID allowlist)

RLS is enabled on all tables; default grants are revoked and the intended minimum privileges re-granted. **Database policies—not a frontend email check—protect admin data.**

## 4. Dry-run import, then explicit apply

Configure only in your private terminal (never in `VITE_*` or GitHub Actions):
```bash
export SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
export SUPABASE_SECRET_KEY=sb_secret_YOUR_PRIVATE_SECRET
export CONFIRM_SUPABASE_REF=YOUR_PROJECT_REF

npm run migration:import
# Review counts before enabling write:
npm run migration:import -- --apply
```

The importer checks backup hashes, upserts by source document ID, verifies destination counts, and NEVER deletes Firebase source. Existing audit history is imported with `legacy_firebase_uid` and `user_id = NULL`; these records are NOT automatically attached to arbitrary new accounts.

**Owner account and authentication must be verified separately**, especially before attaching legacy audit ownership by a proven user identity. Back up Supabase too and verify content lengths and unpublished drafts, not just counts. Do not write while cutting over until both source and destination are reconciled.

## 5. Configure Supabase Auth Google provider

Enable the Google provider in **Supabase Authentication → Providers → Google**. Set up a Google OAuth web client (Client ID and Client Secret) and add the Supabase callback URI supplied by the dashboard.

In **Authentication → URL Configuration**, allow:
- `https://mmoavia7861.github.io/RankNova/`
- your eventual production custom-domain URLs
- localhost URLs when testing

Sign in with YOUR intended owner Google account, find the resulting Supabase Auth UID on **Authentication → Users**, and in the SQL Editor (acting as database owner), run:

```sql
insert into public.admin_users(user_id)
values ('PASTE_VERIFIED_SUPABASE_AUTH_USER_UUID_HERE')
on conflict (user_id) do nothing;
```

**NEVER create a public RPC to assign admin roles.** Do not infer admin rights from email or user-provided metadata. Check a different Google account cannot view admin settings, contact messages, draft articles, or another user's audits.

## 6. Connect the React frontend (only after RLS and migration are tested)

For local development create `.env.local` using `.env.supabase.example`:
```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
```

In GitHub repository **Settings → Secrets and variables → Actions → Variables**, configure:
- `RANKNOVA_SUPABASE_URL` = the Supabase HTTPS project URL
- `RANKNOVA_SUPABASE_PUBLISHABLE_KEY` = the publishable key

These two values are public browser configuration. **Never** put `sb_secret_` or credentials in a Vite variable.

The static homepage and browser-only tools still render without Supabase configuration, but database-dependent functions will show an error/unavailable state. Full API-based SEO Audit still requires running `server.ts` on Node hosting; Supabase PostgreSQL itself is **not** an Express server.

## 7. Validation and safe cutover checklist

- [ ] Firebase export contents, counts and checksum manifest verified and backed up.
- [ ] Supabase tables created; anonymous and non-owner RLS deny tests passed.
- [ ] Supabase Auth Google login and owner UUID confirmed.
- [ ] Articles, feedback, audits and settings imported and independently reconciled.
- [ ] Verify unpublished articles remain private.
- [ ] Verify public CMS articles and static guides both load.
- [ ] Contact form stores data in Supabase, and non-owners cannot read messages.
- [ ] Add an anti-spam defense (CAPTCHA/Turnstile with server verification, IP-level rate limiting/WAF). Basic per-email RPC throttling alone is NOT sufficient for public launch.
- [ ] Verify signed-in users can only save/read their own *new* audit history.
- [ ] Verify security with a second non-owner Google account.
- [ ] Test mobile, Chrome, Edge, Safari and direct deep links.
- [ ] Deploy Node SEO audit API separately before claiming live audit works; no Firebase Functions dependency is required for that path.
- [ ] Before updating privacy/AdSense policy, confirm actual analytics, retention, and consent behavior.
- [ ] Make a rollback/backup plan, then merge the PR, set GitHub variables and redeploy.
- [ ] After a monitoring period, retire Firebase services only when you are satisfied no valuable records remain.

## What is deliberately NOT automatic

Firebase authentication sessions and Google provider tokens are not portable; users must sign in to Supabase. Legacy Firebase UIDs do not equal Supabase Auth UUIDs. Old audit records need verified identity mapping. We will not delete or disable Firebase while those checks remain unfinished.

Source references: https://supabase.com/kb/guides/migrate-from-firestore-data , https://supabase.com/kb/guides/migrate-from-firebase-auth , https://supabase.com/docs/guides/database/postgres/row-level-security
