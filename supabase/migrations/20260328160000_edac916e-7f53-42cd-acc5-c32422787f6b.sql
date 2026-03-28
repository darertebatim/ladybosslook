create table public.free_form_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null default '',
  created_at timestamptz default now() not null
);

alter table public.free_form_reflections enable row level security;

create policy "Users can read own free form reflections"
  on public.free_form_reflections for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own free form reflections"
  on public.free_form_reflections for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own free form reflections"
  on public.free_form_reflections for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own free form reflections"
  on public.free_form_reflections for delete
  to authenticated
  using (auth.uid() = user_id);