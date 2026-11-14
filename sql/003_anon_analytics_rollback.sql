-- Rollback for sql/003_anon_analytics.sql (D-217). Run only if the migration has to be undone.
-- Note: user_id values and installId copies removed by the migration cannot be restored; the column comes back empty (null).
-- No keys or passwords in this file.

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from cron.job where jobname = 'purge-old-events') then
    perform cron.unschedule('purge-old-events');
  end if;
end;
$$;

begin;

drop function if exists public.purge_old_events();

drop policy if exists events_insert_anon on public.events;
alter table public.events add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists events_user_id_created_at_idx on public.events (user_id, created_at desc);
drop policy if exists events_insert_own on public.events;
create policy events_insert_own on public.events
  for insert to anon, authenticated
  with check (
    (auth.uid() is null and user_id is null)
    or (auth.uid() is not null and user_id = auth.uid())
  );
comment on table public.events is null;

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
  delete from public.events where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;
revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;

commit;
-- pg_cron extension itself is left installed (harmless).
