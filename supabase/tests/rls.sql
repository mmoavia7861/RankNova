-- Run as Postgres superuser after bootstrap + migration, then SET ROLE to emulate
-- non-owner, owner, and anonymous requests. Any failed assertion exits nonzero.
insert into public.admin_users(user_id) values ('00000000-0000-4000-8000-000000000001');
insert into public.site_settings(id,site_name) values('config','RankNova');
insert into public.articles(id,slug,title,published,content) values
 ('draft','private-guide','Private Guide',false,'unpublished content'),
 ('published','public-guide','Public Guide',true,'public content');

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
do $$
declare n integer;
begin
  select count(*) into n from public.articles;
  if n <> 1 then raise exception 'Non-owner can read draft article'; end if;
  select count(*) into n from public.site_settings;
  if n <> 0 then raise exception 'Non-owner can read site settings'; end if;
  select count(*) into n from public.admin_users;
  if n <> 0 then raise exception 'Non-owner can view owner list'; end if;
  begin
    insert into public.articles(slug,title,published) values('hack','Hacked',true);
    raise exception 'Non-owner unexpectedly inserted article';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.feedback(name,email,subject,message)
    values('Eve','eve@example.com','Pwn','A private email');
    raise exception 'Non-owner unexpectedly inserted feedback directly';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
do $$
declare n integer;
begin
  select count(*) into n from public.articles;
  if n <> 2 then raise exception 'Owner cannot read drafts'; end if;
  select count(*) into n from public.site_settings;
  if n <> 1 then raise exception 'Owner cannot read site settings'; end if;
  select count(*) into n from public.admin_users;
  if n <> 1 then raise exception 'Owner cannot read own membership'; end if;
end;
$$;
insert into public.articles(slug,title,content,published)
  values('owner-new-post','Owner New Post','Owner data',true);
reset role;

set role anon;
do $$
declare n integer;
begin
  select count(*) into n from public.articles;
  if n <> 2 then raise exception 'Anonymous view count mismatch'; end if;
  begin
    select count(*) into n from public.site_settings;
    raise exception 'Anonymous user read site settings';
  exception when insufficient_privilege then null; end;
end;
$$;
-- Public contact should not expose its mailbox; only validated RPC can submit.
select public.submit_ranknova_feedback('Test Sender','test.sender@example.com','Question','Five or more chars');
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
do $$
declare n integer;
begin
  select count(*) into n from public.feedback;
  if n <> 0 then raise exception 'Non-owner read feedback'; end if;
end;
$$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
do $$
declare n integer;
begin
  select count(*) into n from public.feedback;
  if n <> 1 then raise exception 'Owner cannot read feedback'; end if;
end;
$$;
reset role;
