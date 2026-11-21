-- Rollback for sql/004_preplay_consent_tombstone.sql
-- Restores delete_my_account() to the sql/003_anon_analytics.sql shape (no tombstone).
-- Does not restore health_consent_log rows or deleted_accounts rows.

begin;

drop trigger if exists user_state_guard on public.user_state;
drop function if exists public.user_state_guard();
drop function if exists public.account_is_deleted();
drop function if exists public.health_consent_is_active(uuid);
drop trigger if exists health_consent_log_set_uid on public.health_consent_log;
drop function if exists public.health_consent_log_set_uid();
drop table if exists public.health_consent_log;
drop table if exists public.deleted_accounts;

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
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

commit;
