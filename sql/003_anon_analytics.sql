-- D-217: anonymous analytics + 13-month retention for events.
-- Target: project krrhwuldkwkkcegxhyqq (and nwbnrjiiqfyuakotacln if it is still used). Requires sql/001_stage2.sql.
-- NOT applied automatically. Run in Supabase Dashboard -> SQL Editor after Claude's review. Rollback: sql/003_anon_analytics_rollback.sql.
-- No keys or passwords in this file.
--
-- What it does:
--   1. public.events loses the user_id column (and its index / insert policy). Events keep only:
--      id, created_at, name, install_id (random id generated on the device), props.
--   2. New insert policy: anyone (anon or signed in) may insert an event that has an install_id; no link to auth.users.
--   3. install_id is removed from saved account snapshots (user_state.payload), so events cannot be joined to an account.
--      (App v48 no longer uploads it; this cleans copies uploaded by older versions.)
--   4. delete_my_account() no longer touches events (there is nothing per-user in them).
--   5. public.purge_old_events() deletes events older than 13 months; scheduled daily with pg_cron if the extension is available.

begin;

drop policy if exists events_insert_own on public.events;
drop index if exists public.events_user_id_created_at_idx;
alter table public.events drop column if exists user_id;

drop policy if exists events_insert_anon on public.events;
create policy events_insert_anon on public.events
  for insert to anon, authenticated
  with check (
    install_id is not null
    and char_length(install_id) between 16 and 64
    and pg_column_size(props) <= 2048
  );

comment on table public.events is 'Anonymous opt-in analytics: install_id (random per device) only, no user link. Kept 13 months (purge_old_events).';

update public.user_state
  set payload = payload - 'installId'
  where payload ? 'installId';

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
  delete from public.user_state where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;
revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;

create or replace function public.purge_old_events()
returns integer
language sql
security definer
set search_path = public
as $$
  with d as (
    delete from public.events where created_at < now() - interval '13 months' returning 1
  )
  select count(*)::integer from d;
$$;
revoke all on function public.purge_old_events() from public;
revoke all on function public.purge_old_events() from anon;
revoke all on function public.purge_old_events() from authenticated;

commit;

-- Retention schedule: daily at 03:17 UTC. If pg_cron is not available, the notice says so;
-- then enable it in Dashboard -> Database -> Extensions -> pg_cron and run this block again,
-- or run `select public.purge_old_events();` by hand at least once a month.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    execute $q$select cron.schedule('purge-old-events', '17 3 * * *', 'select public.purge_old_events()')$q$;
  else
    raise notice 'pg_cron is not available: run select public.purge_old_events(); manually (monthly).';
  end if;
end;
$$;

-- Check after running:
--   select column_name from information_schema.columns where table_schema='public' and table_name='events';  -- no user_id
--   select jobname, schedule, command from cron.job where jobname = 'purge-old-events';
--   select count(*) from public.user_state where payload ? 'installId';  -- 0
