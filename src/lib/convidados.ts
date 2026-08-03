/** Lógica pura de casamento entre respostas de RSVP e convites (sem I/O), testável isoladamente. */

export type RsvpResposta = {
  id: string;
  created_at: string;
  nome: string;
  email: string;
  presenca: boolean;
  acompanhantes: string[];
  restricao_alimentar: string[];
  mensagem: string | null;
};

export type ConvidadoDoConvite = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
};

export type ConviteComConvidados = {
  id: string;
  nome_principal: string;
  email: string;
  vagas_extras: number;
  status: string;
  created_at: string;
  convidados: ConvidadoDoConvite[];
};

export type ConviteResumo = {
  id: string;
  nomePrincipal: string;
  email: string;
  vagasExtras: number;
  status: string;
  convidados: ConvidadoDoConvite[];
};

export function mapConvite(c: ConviteComConvidados): ConviteResumo {
  return {
    id: c.id,
    nomePrincipal: c.nome_principal,
    email: c.email,
    vagasExtras: c.vagas_extras,
    status: c.status,
    convidados: c.convidados.map((cv) => ({ id: cv.id, nome: cv.nome, tipo: cv.tipo, status: cv.status })),
  };
}

/**
 * Casa cada resposta de RSVP confirmada com o convite (ingresso/QR) que ela gerou.
 * Como as duas tabelas só se relacionam por e-mail (sem chave estrangeira), em
 * caso de duplicidade (mesmo e-mail com mais de um convite) o casamento usa o
 * convite criado mais próximo no tempo da resposta, já que ambos são inseridos
 * na mesma requisição em /api/rsvp. Convites que sobram (sem par) são os
 * criados manualmente pelo painel.
 */
export function parearConvites(rsvps: RsvpResposta[], convites: ConviteComConvidados[]) {
  const disponiveis = [...convites];
  const porRsvpId = new Map<string, ConviteComConvidados>();

  const emOrdemDeChegada = rsvps
    .filter((r) => r.presenca)
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (const rsvp of emOrdemDeChegada) {
    const candidatos = disponiveis.filter((c) => c.email === rsvp.email);
    if (candidatos.length === 0) continue;

    const rsvpTime = new Date(rsvp.created_at).getTime();
    candidatos.sort(
      (a, b) =>
        Math.abs(new Date(a.created_at).getTime() - rsvpTime) -
        Math.abs(new Date(b.created_at).getTime() - rsvpTime),
    );

    const escolhido = candidatos[0];
    porRsvpId.set(rsvp.id, escolhido);
    disponiveis.splice(
      disponiveis.findIndex((c) => c.id === escolhido.id),
      1,
    );
  }

  return { porRsvpId, restantes: disponiveis };
}
