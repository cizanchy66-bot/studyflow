-- Run this entire file in Supabase Dashboard > SQL Editor.
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 120),
  subject text not null default 'General',
  due_date date,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

-- Users can only view, create, edit, or delete their own rows.
drop policy if exists "Tasks are viewable by owner" on public.tasks;
create policy "Tasks are viewable by owner" on public.tasks for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Tasks are insertable by owner" on public.tasks;
create policy "Tasks are insertable by owner" on public.tasks for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Tasks are updatable by owner" on public.tasks;
create policy "Tasks are updatable by owner" on public.tasks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Tasks are deletable by owner" on public.tasks;
create policy "Tasks are deletable by owner" on public.tasks for delete to authenticated using (auth.uid() = user_id);

create index if not exists tasks_user_id_created_at_idx on public.tasks (user_id, created_at desc);
