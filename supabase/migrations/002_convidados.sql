-- Convite "Carmem na Itália 2026" — ingressos nominais com QR code de check-in.
-- `convites`: um por convidado principal, define quantas vagas extras ele pode levar.
-- `convidados`: uma linha por pessoa (principal + acompanhantes), cada uma com
-- seu próprio token — o valor codificado no QR do ingresso individual.

create table if not exists public.convites (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  nome_principal text not null,
  email          text not null,
  vagas_extras   int not null default 0 check (vagas_extras between 0 and 5),
  token          text not null unique,
  status         text not null default 'pendente' check (status in ('pendente', 'confirmado'))
);

create table if not exists public.convidados (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  convite_id    uuid not null references public.convites(id) on delete cascade,
  nome          text not null,
  tipo          text not null check (tipo in ('principal', 'acompanhante')),
  token         text not null unique,
  status        text not null default 'pendente' check (status in ('pendente', 'check-in')),
  checked_in_at timestamptz
);

create index if not exists idx_convidados_convite_id
  on public.convidados (convite_id);

-- RLS: toda escrita/leitura passa pelas rotas de API via service role.
-- Mantemos RLS ativo e SEM policies para anon/authenticated — mesmo padrão
-- de supabase/migrations/001_contribuicoes.sql.
alter table public.convites enable row level security;
alter table public.convidados enable row level security;
