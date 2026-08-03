-- Preenche rsvp_id nos convites que já existem (criados antes da coluna existir),
-- casando cada resposta de RSVP com o convite correspondente.
--
-- Como o /api/rsvp insere a resposta e o convite na mesma requisição, o enésimo
-- convite (em ordem de criação) de um e-mail corresponde ao enésimo RSVP daquele
-- mesmo e-mail — inclusive em casos de duplicidade (a mesma pessoa confirmou duas
-- vezes): a primeira resposta casa com o primeiro convite, a segunda com o segundo,
-- e assim por diante. Convites manuais "sobrando" (sem resposta correspondente
-- naquela posição) simplesmente não recebem match e continuam com rsvp_id nulo.
--
-- Idempotente: só atualiza quem ainda está com rsvp_id nulo, então pode ser rodado
-- mais de uma vez sem efeito colateral.

with rsvp_ordenado as (
  select
    id,
    email,
    row_number() over (partition by email order by created_at) as posicao
  from public.respostas_rsvp
  where presenca = true
),
convite_ordenado as (
  select
    id,
    email,
    row_number() over (partition by email order by created_at) as posicao
  from public.convites
  where rsvp_id is null
)
update public.convites c
set rsvp_id = r.id
from convite_ordenado co
join rsvp_ordenado r
  on r.email = co.email
  and r.posicao = co.posicao
where c.id = co.id;
