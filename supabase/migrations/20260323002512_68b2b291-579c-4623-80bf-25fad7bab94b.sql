-- Routine favorites table
create table public.routine_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, routine_id)
);

-- Enable RLS
alter table public.routine_favorites enable row level security;

-- Users can see their own favorites
create policy "Users can view own favorites"
  on public.routine_favorites for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own favorites
create policy "Users can insert own favorites"
  on public.routine_favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can delete their own favorites
create policy "Users can delete own favorites"
  on public.routine_favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- Index for fast lookups
create index idx_routine_favorites_user on public.routine_favorites(user_id);