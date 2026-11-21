-- G1: append-only health-consent log; body fields in user_state are stripped without an active grant.
-- G2: deleted-account tombstone so a stale JWT / offline phone cannot recreate user_state.
-- Project: krrhwuldkwkkcegxhyqq
-- Rollback: sql/004_preplay_consent_tombstone_rollback.sql

begin;

create table if not exists public.health_consent_log (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  action text not null check (action in ('grant', 'revoke')),
  text_version text not null,
  created_at timestamptz not null default now()
);

create index if not exists health_consent_log_user_created_idx
  on public.health_consent_log (user_id, created_at desc, id desc);

comment on table public.health_consent_log is
  'Append-only log of body-data consent (who, when, text version). Used to prove consent (DVI) and to gate body fields on the server.';

alter table public.health_consent_log enable row level security;

drop policy if exists health_consent_log_insert_own on public.health_consent_log;
create policy health_consent_log_insert_own on public.health_consent_log
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists health_consent_log_select_own on public.health_consent_log;
create policy health_consent_log_select_own on public.health_consent_log
  for select to authenticated
  using (user_id = auth.uid());

-- No update/delete policies: users cannot rewrite history.
grant select, insert on table public.health_consent_log to authenticated;

-- Backfill (Claude review 21.11): users who gave body consent before this log existed get one 'legacy-v1'
-- grant row, otherwise user_state_guard below would strip their body data from the cloud on the next sync.
-- Must run BEFORE the set_uid trigger (the SQL editor has no auth.uid()).
insert into public.health_consent_log (user_id, action, text_version, created_at)
select s.user_id, 'grant', 'legacy-v1',
       case when (s.payload->'consentHealth'->>'at') ~ '^\d{4}-\d{2}-\d{2}T'
            then least((s.payload->'consentHealth'->>'at')::timestamptz, now())
            else now() end
from public.user_state s
where jsonb_typeof(s.payload) = 'object'
  and jsonb_typeof(s.payload->'consentHealth') = 'object'
  and not exists (select 1 from public.health_consent_log l where l.user_id = s.user_id);

-- Force user_id from the session so a client cannot log under someone else.
-- created_at may come from the device (offline queue) but never from the future,
-- otherwise a future-dated grant would outrank a later revoke.
create or replace function public.health_consent_log_set_uid()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  NEW.user_id := auth.uid();
  NEW.created_at := least(coalesce(NEW.created_at, now()), now());
  return NEW;
end;
$$;

drop trigger if exists health_consent_log_set_uid on public.health_consent_log;
create trigger health_consent_log_set_uid
  before insert on public.health_consent_log
  for each row execute function public.health_consent_log_set_uid();

create or replace function public.health_consent_is_active(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select l.action = 'grant'
    from public.health_consent_log l
    where l.user_id = uid
    order by l.created_at desc, l.id desc
    limit 1
  ), false);
$$;

revoke all on function public.health_consent_is_active(uuid) from public, anon, authenticated;

create table if not exists public.deleted_accounts (
  user_id uuid primary key,
  deleted_at timestamptz not null default now()
);

comment on table public.deleted_accounts is
  'Tombstones for deleted accounts. No FK to auth.users: the row must survive user deletion so a leftover JWT cannot recreate user_state.';

alter table public.deleted_accounts enable row level security;

drop policy if exists deleted_accounts_select_own on public.deleted_accounts;
create policy deleted_accounts_select_own on public.deleted_accounts
  for select to authenticated
  using (user_id = auth.uid());

grant select on table public.deleted_accounts to authenticated;
-- Inserts only through delete_my_account().

create or replace function public.account_is_deleted()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.deleted_accounts d where d.user_id = auth.uid()
  );
$$;

revoke all on function public.account_is_deleted() from public, anon;
grant execute on function public.account_is_deleted() to authenticated;

create or replace function public.user_state_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.deleted_accounts d where d.user_id = NEW.user_id) then
    raise exception 'account_deleted' using errcode = 'P0001';
  end if;
  if NEW.payload is not null and jsonb_typeof(NEW.payload) = 'object'
     and not public.health_consent_is_active(NEW.user_id) then
    NEW.payload := NEW.payload - 'body' - 'height' - 'weightKg' - 'age' - 'deletedBody' - 'consentHealth';
    if NEW.payload ? 'prof' and jsonb_typeof(NEW.payload->'prof') = 'object' then
      NEW.payload := jsonb_set(NEW.payload, '{prof}', (NEW.payload->'prof') - 'lim', true);
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists user_state_guard on public.user_state;
create trigger user_state_guard
  before insert or update on public.user_state
  for each row execute function public.user_state_guard();

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  insert into public.deleted_accounts (user_id, deleted_at)
    values (uid, now())
    on conflict (user_id) do update set deleted_at = excluded.deleted_at;
  delete from public.health_consent_log where user_id = uid;
  delete from public.user_state where user_id = uid;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'events' and column_name = 'user_id'
  ) then
    execute 'delete from public.events where user_id = $1' using uid;
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

commit;
