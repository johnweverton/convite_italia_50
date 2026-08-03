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
  /** Preenchido pela migration 004 + backfill 005. Nulo em convites manuais ou legados sem backfill. */
  rsvp_id?: string | null;
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
 *
 * Fonte da verdade: `convite.rsvp_id` (migration 004 + backfill 005). Só cai na
 * heurística por e-mail + horário mais próximo para convites legados que, por
 * algum motivo, tenham ficado sem rsvp_id (ex.: backfill rodado antes de algum
 * convite existir). Convites que sobram sem par nenhum são os criados
 * manualmente pelo painel.
 */
export function parearConvites(rsvps: RsvpResposta[], convites: ConviteComConvidados[]) {
  const disponiveis = [...convites];
  const porRsvpId = new Map<string, ConviteComConvidados>();

  const confirmados = rsvps.filter((r) => r.presenca);

  // 1. Casamento exato via rsvp_id, quando presente.
  for (const rsvp of confirmados) {
    const idx = disponiveis.findIndex((c) => c.rsvp_id === rsvp.id);
    if (idx !== -1) {
      porRsvpId.set(rsvp.id, disponiveis[idx]);
      disponiveis.splice(idx, 1);
    }
  }

  // 2. Heurística por e-mail + horário mais próximo, só para quem sobrou sem par
  // exato — e só considerando convites sem rsvp_id (os com rsvp_id já pertencem
  // a outra resposta, ainda que compartilhem o mesmo e-mail).
  const semParExato = confirmados
    .filter((r) => !porRsvpId.has(r.id))
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (const rsvp of semParExato) {
    const candidatos = disponiveis.filter((c) => c.email === rsvp.email && !c.rsvp_id);
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
