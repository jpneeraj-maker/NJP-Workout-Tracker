-- Optional cloud snapshot history (run once in Supabase SQL editor).
-- The app appends here on successful saves and ignores errors if missing.

create table if not exists public.workout_data_snapshots (
  id bigint generated always as identity primary key,
  user_id text not null default 'default-user',
  exercise_count integer not null default 0,
  history_length integer not null default 0,
  source text not null default 'autosave',
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists workout_data_snapshots_user_created_idx
  on public.workout_data_snapshots (user_id, created_at desc);

alter table public.workout_data_snapshots enable row level security;

-- Open policies matching the current single-user app pattern.
-- Tighten these if you later add real auth.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workout_data_snapshots'
      and policyname = 'workout_data_snapshots_select'
  ) then
    create policy workout_data_snapshots_select
      on public.workout_data_snapshots
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workout_data_snapshots'
      and policyname = 'workout_data_snapshots_insert'
  ) then
    create policy workout_data_snapshots_insert
      on public.workout_data_snapshots
      for insert
      with check (true);
  end if;
end $$;
