-- Stage 2: per-user app snapshot + privacy-light analytics
-- Applied to project nwbnrjiiqfyuakotacln (eu-west-1) as migration stage2_user_state_and_events

create table public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.user_state is 'Offline-first snapshot of the gym app (programs, workouts, settings). Client merges by entity id.';

alter table public.user_state enable row level security;

create policy user_state_select on public.user_state
  for select to authenticated
  using (user_id = auth.uid());

create policy user_state_insert on public.user_state
  for insert to authenticated
  with check (user_id = auth.uid());

create policy user_state_update on public.user_state
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_state_delete on public.user_state
  for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on table public.user_state to authenticated;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  install_id text,
  user_id uuid references auth.users (id) on delete set null,
  props jsonb not null default '{}'::jsonb,
  constraint events_name_ok check (name in (
    'install','app_open','onboarding_done','paywall_shown','trial_start','purchase','cancel'
  ))
);

create index events_name_created_at_idx on public.events (name, created_at desc);
create index events_install_id_created_at_idx on public.events (install_id, created_at desc);
create index events_user_id_created_at_idx on public.events (user_id, created_at desc);

alter table public.events enable row level security;

create policy events_insert_own on public.events
  for insert to anon, authenticated
  with check (
    (auth.uid() is null and user_id is null)
    or (auth.uid() is not null and user_id = auth.uid())
  );

grant insert on table public.events to anon, authenticated;

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
