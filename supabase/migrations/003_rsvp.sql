-- Convite "Carmem na Itália 2026" — tabela de respostas do formulário público de RSVP.
-- Armazena todos que preencheram o formulário, independente de comparecerem ou não.

create table if not exists public.respostas_rsvp (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  nome                text not null,
  email               text not null,
  presenca            boolean not null,
  acompanhantes       jsonb not null default '[]'::jsonb,
  restricao_alimentar text[] not null default '{}'::text[],
  mensagem            text
);

create index if not exists idx_respostas_rsvp_created_at
  on public.respostas_rsvp (created_at desc);

-- RLS: escrita pela service_role na rota de API
alter table public.respostas_rsvp enable row level security;
