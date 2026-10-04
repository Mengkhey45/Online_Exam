create table if not exists public.question_bank (
  id text primary key,
  organization_id text not null,
  created_by text not null,
  subject text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  block jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.question_bank enable row level security;