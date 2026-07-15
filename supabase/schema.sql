-- Run this once in the Supabase SQL editor.
create table if not exists public.learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id integer not null,
  level integer not null default 0 check (level between 0 and 5),
  due bigint not null default 0,
  misses integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table public.learning_progress enable row level security;
create policy "users read own progress" on public.learning_progress for select using (auth.uid() = user_id);
create policy "users insert own progress" on public.learning_progress for insert with check (auth.uid() = user_id);
create policy "users update own progress" on public.learning_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own progress" on public.learning_progress for delete using (auth.uid() = user_id);

create table if not exists public.speaking_recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  prompt text not null,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.speaking_recordings enable row level security;
create policy "users read own recording rows" on public.speaking_recordings for select using (auth.uid() = user_id);
create policy "users insert own recording rows" on public.speaking_recordings for insert with check (auth.uid() = user_id);
create policy "users delete own recording rows" on public.speaking_recordings for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('speaking-recordings', 'speaking-recordings', false, 10485760, array['audio/webm','audio/mp4','audio/ogg'])
on conflict (id) do nothing;

create policy "users upload own recordings" on storage.objects for insert to authenticated
with check (bucket_id = 'speaking-recordings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users read own recordings" on storage.objects for select to authenticated
using (bucket_id = 'speaking-recordings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own recordings" on storage.objects for delete to authenticated
using (bucket_id = 'speaking-recordings' and (storage.foldername(name))[1] = auth.uid()::text);
