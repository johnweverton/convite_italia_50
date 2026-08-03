-- Liga cada convite criado a partir do RSVP público à resposta que o gerou.
-- Antes, `convites` e `respostas_rsvp` só se relacionavam por e-mail (coincidência
-- de fluxo, sem chave estrangeira), então identificar qual convite pertence a qual
-- resposta dependia de uma heurística por e-mail + horário mais próximo. Com esta
-- coluna, a relação passa a ser exata e garantida pelo banco.
--
-- ON DELETE CASCADE: excluir a resposta de RSVP também remove o convite (e, pela
-- cascade já existente em 002_convidados.sql, os convidados/QR codes junto).
-- Convites criados manualmente pelo painel (sem RSVP) ficam com rsvp_id nulo.

alter table public.convites
  add column if not exists rsvp_id uuid references public.respostas_rsvp(id) on delete cascade;

create index if not exists idx_convites_rsvp_id
  on public.convites (rsvp_id);
