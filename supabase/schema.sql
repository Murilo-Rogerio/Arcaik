-- ==============================================================================
-- ARCAIK — Esquema de Banco de Dados, Políticas RLS e Configuração de Storage
-- Supabase PostgreSQL 15+
-- ==============================================================================

-- 1. EXTENSÕES
create extension if not exists "pgcrypto";

-- 2. TABELA: profiles
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Usuários podem visualizar o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuários podem inserir o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger para provisionamento automático do perfil após confirmação de usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. TABELA: tags
create table if not exists public.tags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null,
  created_at timestamptz default now() not null,
  constraint tags_user_name_key unique (user_id, name)
);

alter table public.tags enable row level security;

create policy "Usuários gerenciam suas próprias tags"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. TABELA: notes
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  kind text not null check (kind in ('note', 'todo')),
  title text not null default '',
  content text,
  items jsonb default null,
  due_at timestamptz default null,
  tag_ids text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.notes enable row level security;

create policy "Usuários gerenciam suas próprias notas"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger para atualização automática de updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_notes_updated_at on public.notes;
create trigger on_notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

-- 5. TABELA: media_items
create table if not exists public.media_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  provider text not null,
  title text default null,
  description text default null,
  thumbnail_url text default null,
  tag_ids text[] default '{}',
  created_at timestamptz default now() not null
);

alter table public.media_items enable row level security;

create policy "Usuários gerenciam seus próprios links e mídias"
  on public.media_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. TABELA: note_attachments
create table if not exists public.note_attachments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  note_id uuid references public.notes(id) on delete cascade not null,
  storage_path text not null,
  name text not null,
  mime text not null,
  size bigint not null,
  created_at timestamptz default now() not null
);

alter table public.note_attachments enable row level security;

create policy "Usuários gerenciam seus próprios anexos"
  on public.note_attachments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 7. STORAGE: bucket 'attachments'
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "Upload autenticado de anexos"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and auth.uid() is not null
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Leitura autenticada de anexos próprios"
  on storage.objects for select
  using (
    bucket_id = 'attachments'
    and auth.uid() is not null
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Remoção autenticada de anexos próprios"
  on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and auth.uid() is not null
    and auth.uid()::text = (storage.foldername(name))[1]
  );
