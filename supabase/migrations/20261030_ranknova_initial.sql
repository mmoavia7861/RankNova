-- RankNova Supabase PostgreSQL schema
-- Apply in a NEW owner-controlled Supabase project only after a backup.
-- No Firebase deletions or automatic production cutover.
begin;

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- An immutable UUID allowlist, not client-provided email metadata.
-- This function is used by RLS; no public writes to admin_users.
create or replace function public.is_ranknova_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users as a
    where a.user_id = (select auth.uid())
  )
$$;

revoke all on function public.is_ranknova_owner() from public;
grant execute on function public.is_ranknova_owner() to authenticated;

create table if not exists public.articles (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title text not null check (char_length(btrim(title)) between 1 and 250),
  excerpt text not null default '' check (char_length(excerpt) <= 800),
  content text not null default '' check (char_length(content) <= 100000),
  category text not null default 'SEO Guide' check (char_length(category) <= 120),
  author text not null default 'RankNova' check (char_length(author) <= 140),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_public_idx on public.articles (created_at desc) where published = true;

create table if not exists public.feedback (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (char_length(email) <= 256 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  subject text not null check (char_length(subject) <= 160),
  message text not null check (char_length(btrim(message)) between 5 and 4096),
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

create table if not exists public.site_settings (
  id text primary key default 'config' check (id = 'config'),
  site_name text not null default 'RankNova',
  adsense_client_id text not null default '',
  ads_enabled boolean not null default false,
  cmp_enabled boolean not null default false,
  tools_enabled jsonb not null default '{"seoAudit":true,"metaGenerator":true,"schemaGenerator":true}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_history (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete set null,
  legacy_firebase_uid text,
  url text not null check (char_length(url) <= 2048),
  score numeric(5,2) not null check (score between 0 and 100),
  passed_count integer not null default 0,
  warnings_count integer not null default 0,
  errors_count integer not null default 0,
  title text not null default '',
  meta_description text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists audit_history_user_created_idx on public.audit_history (user_id, created_at desc);

alter table public.admin_users enable row level security;
alter table public.articles enable row level security;
alter table public.feedback enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_history enable row level security;

-- Access is denied by default. Explicit owner or published-only policies follow.
create policy "Owner can view own membership" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Anyone can read published articles" on public.articles
  for select to anon, authenticated using (published = true);
create policy "Owner can read all articles" on public.articles
  for select to authenticated using ((select public.is_ranknova_owner()));
create policy "Owner can insert articles" on public.articles
  for insert to authenticated with check ((select public.is_ranknova_owner()));
create policy "Owner can update articles" on public.articles
  for update to authenticated using ((select public.is_ranknova_owner()))
    with check ((select public.is_ranknova_owner()));
create policy "Owner can delete articles" on public.articles
  for delete to authenticated using ((select public.is_ranknova_owner()));

create policy "Owner can read feedback" on public.feedback
  for select to authenticated using ((select public.is_ranknova_owner()));
create policy "Owner can delete feedback" on public.feedback
  for delete to authenticated using ((select public.is_ranknova_owner()));
-- Anonymous users cannot select, edit, or insert feedback directly. Contact goes via RPC.

create policy "Owner can read settings" on public.site_settings
  for select to authenticated using ((select public.is_ranknova_owner()));
create policy "Owner can insert settings" on public.site_settings
  for insert to authenticated with check ((select public.is_ranknova_owner()));
create policy "Owner can update settings" on public.site_settings
  for update to authenticated using ((select public.is_ranknova_owner()))
    with check ((select public.is_ranknova_owner()));
create policy "Users can view own audits" on public.audit_history
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can save own audits" on public.audit_history
  for insert to authenticated with check (
    user_id = (select auth.uid()) and legacy_firebase_uid is null
  );
create policy "Users can delete own audits" on public.audit_history
  for delete to authenticated using (user_id = (select auth.uid()));
create policy "Owner can view audits" on public.audit_history
  for select to authenticated using ((select public.is_ranknova_owner()));

-- Basic per-email submit throttling. It is NOT IP-level bot protection.
-- Enable Turnstile / WAF / server-side rate limiting before public launch.
create or replace function public.submit_ranknova_feedback(
  p_name text, p_email text, p_subject text, p_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(btrim(p_email));
begin
  if char_length(btrim(coalesce(p_name,''))) not between 1 and 120
     or char_length(normalized_email) not between 3 and 256
     or normalized_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     or char_length(coalesce(p_subject,'')) > 160
     or char_length(btrim(coalesce(p_message,''))) not between 5 and 4096 then
     raise exception 'Invalid feedback fields';
  end if;
  -- Simple abuse control against repeat submissions using same email.
  if (select count(*) from public.feedback
      where email = normalized_email and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Too many submissions; try again later';
  end if;
  insert into public.feedback(name,email,subject,message)
  values (btrim(p_name),normalized_email,btrim(coalesce(p_subject,'')),btrim(p_message));
end;
$$;
revoke all on function public.submit_ranknova_feedback(text,text,text,text) from public;
grant execute on function public.submit_ranknova_feedback(text,text,text,text) to anon, authenticated;

-- Explicit table grants (RLS policies alone do not restrict table-level privileges).
revoke all on public.admin_users, public.articles, public.feedback,
  public.site_settings, public.audit_history from anon, authenticated;

grant select on public.admin_users to authenticated;
grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;
grant select, delete on public.feedback to authenticated;
grant select, insert, update on public.site_settings to authenticated;
grant select, insert, delete on public.audit_history to authenticated;

-- No direct public insert into feedback; anonymous contacts must use the
-- validated submit_ranknova_feedback RPC (still needs CAPTCHA/WAF prelaunch).
-- The service secret bypasses RLS only in offline migration jobs, never browser.

commit;
