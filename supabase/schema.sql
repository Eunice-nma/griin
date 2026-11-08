-- Griin database. Paste this into Supabase → SQL Editor → New query, then Run.

-- Your whole journal, encrypted on your phone before it gets here (Supabase only ever sees scrambled text).
create table if not exists public.griin_state (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- The phones that should receive reminders.
create table if not exists public.push_subscriptions (
  endpoint     text primary key,
  user_id      uuid not null references auth.users on delete cascade,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);

-- Upcoming reminders. Daily ones move forward a day each time they're sent.
create table if not exists public.reminders (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references auth.users on delete cascade,
  kind     text not null,
  title    text not null,
  body     text,
  fire_at  timestamptz not null,
  repeat   text check (repeat in ('daily')),
  sent_at  timestamptz
);
create index if not exists reminders_due on public.reminders (fire_at) where sent_at is null;

-- Each person can only ever see and change their own rows.
alter table public.griin_state        enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminders          enable row level security;

drop policy if exists "own state" on public.griin_state;
create policy "own state" on public.griin_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own subscriptions" on public.push_subscriptions;
create policy "own subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own reminders" on public.reminders;
create policy "own reminders" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
