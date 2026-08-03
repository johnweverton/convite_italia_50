import { describe, it, expect } from "vitest";
import { parearConvites, mapConvite, type RsvpResposta, type ConviteComConvidados } from "./convidados";

function rsvp(overrides: Partial<RsvpResposta>): RsvpResposta {
  return {
    id: "rsvp-1",
    created_at: "2026-07-01T10:00:00-03:00",
    nome: "Fulano",
    email: "fulano@example.com",
    presenca: true,
    acompanhantes: [],
    restricao_alimentar: [],
    mensagem: null,
    ...overrides,
  };
}

function convite(overrides: Partial<ConviteComConvidados>): ConviteComConvidados {
  return {
    id: "convite-1",
    nome_principal: "Fulano",
    email: "fulano@example.com",
    vagas_extras: 0,
    status: "confirmado",
    created_at: "2026-07-01T10:00:01-03:00",
    convidados: [],
    ...overrides,
  };
}

describe("parearConvites", () => {
  it("casa um RSVP com o unico convite de mesmo e-mail", () => {
    const r = rsvp({ id: "r1", email: "a@x.com" });
    const c = convite({ id: "c1", email: "a@x.com" });
    const { porRsvpId, restantes } = parearConvites([r], [c]);

    expect(porRsvpId.get("r1")?.id).toBe("c1");
    expect(restantes).toHaveLength(0);
  });

  it("nao casa RSVP de ausencia (presenca=false), pois nao gera convite", () => {
    const r = rsvp({ id: "r1", presenca: false, email: "a@x.com" });
    const c = convite({ id: "c1", email: "a@x.com" });
    const { porRsvpId, restantes } = parearConvites([r], [c]);

    expect(porRsvpId.has("r1")).toBe(false);
    // o convite fica sem par (nao deveria existir para ausencia, mas o pareamento nao o consome)
    expect(restantes).toHaveLength(1);
  });

  it("convite sem nenhuma resposta de RSVP correspondente vai para os restantes (convite manual)", () => {
    const c = convite({ id: "c1", email: "manual@x.com" });
    const { porRsvpId, restantes } = parearConvites([], [c]);

    expect(porRsvpId.size).toBe(0);
    expect(restantes.map((x) => x.id)).toEqual(["c1"]);
  });

  it("caso de duplicidade: duas respostas com o mesmo e-mail casam cada uma com o convite mais proximo no tempo, nao ambas com o primeiro", () => {
    // Cenario real do bug relatado: a pessoa enviou o RSVP duas vezes.
    const r1 = rsvp({ id: "r1", email: "dup@x.com", created_at: "2026-07-01T10:00:00-03:00" });
    const r2 = rsvp({ id: "r2", email: "dup@x.com", created_at: "2026-07-01T15:00:00-03:00" });

    const c1 = convite({ id: "c1", email: "dup@x.com", created_at: "2026-07-01T10:00:02-03:00" });
    const c2 = convite({ id: "c2", email: "dup@x.com", created_at: "2026-07-01T15:00:03-03:00" });

    const { porRsvpId, restantes } = parearConvites([r1, r2], [c1, c2]);

    expect(porRsvpId.get("r1")?.id).toBe("c1");
    expect(porRsvpId.get("r2")?.id).toBe("c2");
    expect(restantes).toHaveLength(0);
  });

  it("nao repete o mesmo convite para duas respostas (cada convite so pode ser usado uma vez)", () => {
    const r1 = rsvp({ id: "r1", email: "dup@x.com", created_at: "2026-07-01T10:00:00-03:00" });
    const r2 = rsvp({ id: "r2", email: "dup@x.com", created_at: "2026-07-01T10:00:05-03:00" });
    const c1 = convite({ id: "c1", email: "dup@x.com", created_at: "2026-07-01T10:00:01-03:00" });

    const { porRsvpId, restantes } = parearConvites([r1, r2], [c1]);

    const casados = [porRsvpId.get("r1")?.id, porRsvpId.get("r2")?.id].filter(Boolean);
    expect(casados).toHaveLength(1);
    expect(restantes).toHaveLength(0);
  });

  it("nao casa convites de e-mails diferentes", () => {
    const r = rsvp({ id: "r1", email: "a@x.com" });
    const c = convite({ id: "c1", email: "b@x.com" });
    const { porRsvpId, restantes } = parearConvites([r], [c]);

    expect(porRsvpId.has("r1")).toBe(false);
    expect(restantes).toHaveLength(1);
  });
});

describe("mapConvite", () => {
  it("converte snake_case do banco para camelCase da UI", () => {
    const c = convite({
      id: "c1",
      nome_principal: "Fulano",
      vagas_extras: 2,
      convidados: [{ id: "cv1", nome: "Fulano", tipo: "principal", status: "pendente" }],
    });
    const resumo = mapConvite(c);
    expect(resumo).toEqual({
      id: "c1",
      nomePrincipal: "Fulano",
      email: "fulano@example.com",
      vagasExtras: 2,
      status: "confirmado",
      convidados: [{ id: "cv1", nome: "Fulano", tipo: "principal", status: "pendente" }],
    });
  });
});
