-- UNIBEN LIFE: profile and game-save tables.
-- Run this in the Supabase SQL Editor for your project.
create table if not exists public.player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Campus Explorer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  game_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_profiles enable row level security;
alter table public.player_saves enable row level security;

drop policy if exists "Players can read their own profile" on public.player_profiles;
create policy "Players can read their own profile" on public.player_profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Players can create their own profile" on public.player_profiles;
create policy "Players can create their own profile" on public.player_profiles
  for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Players can update their own profile" on public.player_profiles;
create policy "Players can update their own profile" on public.player_profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Players can read their own save" on public.player_saves;
create policy "Players can read their own save" on public.player_saves
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Players can create their own save" on public.player_saves;
create policy "Players can create their own save" on public.player_saves
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Players can update their own save" on public.player_saves;
create policy "Players can update their own save" on public.player_saves
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.player_profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', 'Campus Explorer'))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_unibenlife on auth.users;
create trigger on_auth_user_created_unibenlife
after insert on auth.users
for each row execute procedure public.handle_new_user();
