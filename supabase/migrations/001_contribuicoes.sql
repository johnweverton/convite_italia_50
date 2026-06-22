-- Convite "Carmem na Itália 2026" — tabela de contribuições (intenção de presente).
-- O pagamento ocorre fora do site (Pix no app do banco / link de cartão externo).
-- Esta tabela registra quem quis presentear; `confirmado` é validado manualmente.

create table if not exists public.contribuicoes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nome        text not null,
  experiencia text not null,
  valor       numeric(12, 2) not null check (valor > 0),
  metodo      text check (metodo in ('pix', 'cartao')),
  mensagem    text,
  confirmado  boolean not null default false
);

create index if not exists idx_contribuicoes_created_at
  on public.contribuicoes (created_at desc);

-- RLS: o INSERT público é feito via service role na rota de API (que ignora RLS).
-- Mantemos RLS ativo e SEM policies de SELECT/anon para que nenhum visitante
-- consiga ler ou escrever diretamente com a anon key. Apenas a service role
-- (server-side) acessa os dados — no INSERT da API e no painel privado.
alter table public.contribuicoes enable row level security;

-- (Nenhuma policy para anon/authenticated = acesso negado por padrão para esses papéis.)
