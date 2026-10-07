alter table public.question_bank
  add column if not exists bank_name text not null default 'General';