import { describe, it, expect, beforeEach, vi } from "vitest";

const estadoCookie = vi.hoisted(() => ({ senha: undefined as string | undefined }));
const mockSupabase = vi.hoisted(() => ({
  deleteCalls: [] as Array<{ table: string; col: string; val: string }>,
  updateCalls: [] as Array<{ table: string; values: unknown; col: string; val: string }>,
  deleteResponses: {} as Record<string, { error: unknown }>,
  updateResponses: {} as Record<string, { error: unknown }>,
  selectResponses: {} as Record<string, { data: unknown; error: unknown }>,
  /** Resposta da consulta pontual `.from("convites").select("rsvp_id").eq(...).maybeSingle()`. */
  convitesRsvpIdLookup: { data: null as { rsvp_id: string | null } | null, error: null as unknown },
  /** Resposta de `.from("convites").select("id, nome_principal").eq(...).maybeSingle()`. */
  convitesLookup: {
    data: null as { id: string; nome_principal: string } | null,
    error: null as unknown,
  },
  /** Resposta de `.from("convidados").select("nome, tipo, token").eq("convite_id", ...)`. */
  convidadosLookup: {
    data: null as Array<{ nome: string; tipo: string; token: string }> | null,
    error: null as unknown,
  },
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) =>
      name === "painel_senha" && estadoCookie.senha !== undefined ? { value: estadoCookie.senha } : undefined,
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServiceClient: () => ({
    from: (table: string) => ({
      delete: () => ({
        eq: async (col: string, val: string) => {
          mockSupabase.deleteCalls.push({ table, col, val });
          return mockSupabase.deleteResponses[table] ?? { error: null };
        },
      }),
      update: (values: unknown) => ({
        eq: async (col: string, val: string) => {
          mockSupabase.updateCalls.push({ table, values, col, val });
          return mockSupabase.updateResponses[table] ?? { error: null };
        },
      }),
      select: (cols: string) => {
        // Consulta pontual de excluirConvite: convites.select("rsvp_id").eq(...).maybeSingle()
        if (table === "convites" && cols === "rsvp_id") {
          return {
            eq: () => ({
              maybeSingle: async () => mockSupabase.convitesRsvpIdLookup,
            }),
          };
        }
        // Consulta pontual de alterarEmailEReenviar: convites.select("id, nome_principal").eq(...).maybeSingle()
        if (table === "convites" && cols === "id, nome_principal") {
          return {
            eq: () => ({
              maybeSingle: async () => mockSupabase.convitesLookup,
            }),
          };
        }
        // Consulta de alterarEmailEReenviar: convidados.select("nome, tipo, token").eq("convite_id", ...)
        if (table === "convidados" && cols === "nome, tipo, token") {
          return {
            eq: async () => mockSupabase.convidadosLookup,
          };
        }
        // Consultas de buscarLinhasRelatorio: awaitable direto, sem encadeamento.
        return Promise.resolve(mockSupabase.selectResponses[table] ?? { data: [], error: null });
      },
    }),
  }),
}));

vi.mock("@/lib/pdf-relatorio", () => ({
  gerarPdfRelatorio: vi.fn(async () => Buffer.from("pdf-fake")),
}));

const emailMocks = vi.hoisted(() => ({
  enviarEmailReenvioIngressos: vi.fn(async () => undefined),
}));

vi.mock("@/lib/email", () => ({
  enviarEmailReenvioIngressos: emailMocks.enviarEmailReenvioIngressos,
}));

import { excluirConvite, gerarRelatorioCsv, alterarEmailEReenviar } from "./actions";

beforeEach(() => {
  process.env.PAINEL_SENHA = "segredo123";
  estadoCookie.senha = "segredo123";
  mockSupabase.deleteCalls.length = 0;
  mockSupabase.updateCalls.length = 0;
  mockSupabase.deleteResponses = {};
  mockSupabase.updateResponses = {};
  mockSupabase.selectResponses = {};
  mockSupabase.convitesRsvpIdLookup = { data: null, error: null };
  mockSupabase.convitesLookup = { data: null, error: null };
  mockSupabase.convidadosLookup = { data: null, error: null };
  emailMocks.enviarEmailReenvioIngressos.mockReset();
  emailMocks.enviarEmailReenvioIngressos.mockResolvedValue(undefined);
});

describe("excluirConvite", () => {
  it("recusa quando o cookie da sessao nao bate com PAINEL_SENHA", async () => {
    estadoCookie.senha = "senha-errada";
    const resultado = await excluirConvite("convite-1");
    expect(resultado.ok).toBe(false);
    expect(mockSupabase.deleteCalls).toHaveLength(0);
  });

  it("quando convites.rsvp_id existe e aponta para uma resposta, exclui a resposta correspondente automaticamente (sem depender de valor vindo da tela)", async () => {
    mockSupabase.convitesRsvpIdLookup = { data: { rsvp_id: "rsvp-1" }, error: null };
    const resultado = await excluirConvite("convite-1");
    expect(resultado.ok).toBe(true);
    expect(mockSupabase.deleteCalls).toEqual([
      { table: "convites", col: "id", val: "convite-1" },
      { table: "respostas_rsvp", col: "id", val: "rsvp-1" },
    ]);
  });

  it("convite manual (rsvp_id nulo no banco) nao exclui nenhuma resposta de RSVP, mesmo se um valor de heuristica for passado por engano", async () => {
    mockSupabase.convitesRsvpIdLookup = { data: { rsvp_id: null }, error: null };
    const resultado = await excluirConvite("convite-manual-1", "rsvp-nao-deveria-ser-usado");
    expect(resultado.ok).toBe(true);
    expect(mockSupabase.deleteCalls).toEqual([{ table: "convites", col: "id", val: "convite-manual-1" }]);
  });

  it("quando a coluna rsvp_id ainda nao existe (migration nao aplicada), usa o valor calculado por heuristica na tela", async () => {
    mockSupabase.convitesRsvpIdLookup = { data: null, error: { message: 'column "rsvp_id" does not exist' } };
    const resultado = await excluirConvite("convite-1", "rsvp-heuristico-1");
    expect(resultado.ok).toBe(true);
    expect(mockSupabase.deleteCalls).toEqual([
      { table: "convites", col: "id", val: "convite-1" },
      { table: "respostas_rsvp", col: "id", val: "rsvp-heuristico-1" },
    ]);
  });

  it("retorna erro e nao tenta excluir nenhuma resposta de RSVP quando a exclusao do convite falha", async () => {
    mockSupabase.convitesRsvpIdLookup = { data: { rsvp_id: "rsvp-1" }, error: null };
    mockSupabase.deleteResponses.convites = { error: { message: "falhou" } };
    const resultado = await excluirConvite("convite-1");
    expect(resultado.ok).toBe(false);
    expect(mockSupabase.deleteCalls).toEqual([{ table: "convites", col: "id", val: "convite-1" }]);
  });

  it("sinaliza erro (sem quebrar) quando o convite some mas a resposta de RSVP falha ao ser excluida", async () => {
    mockSupabase.convitesRsvpIdLookup = { data: { rsvp_id: "rsvp-1" }, error: null };
    mockSupabase.deleteResponses.respostas_rsvp = { error: { message: "falhou" } };
    const resultado = await excluirConvite("convite-1");
    expect(resultado.ok).toBe(false);
  });
});

describe("gerarRelatorioCsv (integracao com dados simulados)", () => {
  it("nao infla a contagem de restricao alimentar por causa do acompanhante compartilhar o e-mail do titular", async () => {
    mockSupabase.selectResponses.convidados = {
      data: [
        {
          convite_id: "c1",
          nome: "Titular Um",
          tipo: "principal",
          status: "pendente",
          checked_in_at: null,
          created_at: "2026-07-01T10:00:00-03:00",
          convites: { nome_principal: "Titular Um", email: "titular@x.com", created_at: "2026-07-01T10:00:00-03:00" },
        },
        {
          convite_id: "c1",
          nome: "Acompanhante Um",
          tipo: "acompanhante",
          status: "pendente",
          checked_in_at: null,
          created_at: "2026-07-01T10:00:01-03:00",
          convites: { nome_principal: "Titular Um", email: "titular@x.com", created_at: "2026-07-01T10:00:00-03:00" },
        },
      ],
      error: null,
    };
    mockSupabase.selectResponses.respostas_rsvp = {
      data: [{ email: "titular@x.com", restricao_alimentar: ["Vegano"] }],
      error: null,
    };

    const resultado = await gerarRelatorioCsv();
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    const linhas = resultado.csv.split("\n");
    const linhaTitular = linhas.find((l) => l.startsWith("Titular Um"));
    const linhaAcompanhante = linhas.find((l) => l.startsWith("Acompanhante Um"));

    expect(linhaTitular).toContain("Vegano");
    // O acompanhante nao pode herdar a restricao do titular so por compartilhar o e-mail.
    expect(linhaAcompanhante).not.toContain("Vegano");
  });
});

describe("alterarEmailEReenviar", () => {
  it("recusa quando o cookie da sessao nao bate com PAINEL_SENHA", async () => {
    estadoCookie.senha = "senha-errada";
    const resultado = await alterarEmailEReenviar("convite-1", "novo@x.com");
    expect(resultado.ok).toBe(false);
    expect(mockSupabase.updateCalls).toHaveLength(0);
    expect(emailMocks.enviarEmailReenvioIngressos).not.toHaveBeenCalled();
  });

  it("recusa e-mail em formato invalido", async () => {
    const resultado = await alterarEmailEReenviar("convite-1", "nao-e-email");
    expect(resultado.ok).toBe(false);
    expect(mockSupabase.updateCalls).toHaveLength(0);
  });

  it("retorna erro quando o convite nao existe", async () => {
    mockSupabase.convitesLookup = { data: null, error: null };
    const resultado = await alterarEmailEReenviar("convite-inexistente", "novo@x.com");
    expect(resultado.ok).toBe(false);
    expect(mockSupabase.updateCalls).toHaveLength(0);
  });

  it("retorna erro e nao atualiza nada quando o convite nao tem ingressos vinculados", async () => {
    mockSupabase.convitesLookup = { data: { id: "convite-1", nome_principal: "Fulano" }, error: null };
    mockSupabase.convidadosLookup = { data: [], error: null };
    const resultado = await alterarEmailEReenviar("convite-1", "novo@x.com");
    expect(resultado.ok).toBe(false);
    expect(mockSupabase.updateCalls).toHaveLength(0);
    expect(emailMocks.enviarEmailReenvioIngressos).not.toHaveBeenCalled();
  });

  it("atualiza o e-mail do convite e reenvia os ingressos ja emitidos, titular primeiro", async () => {
    mockSupabase.convitesLookup = { data: { id: "convite-1", nome_principal: "Fulano de Tal" }, error: null };
    mockSupabase.convidadosLookup = {
      data: [
        { nome: "Acompanhante", tipo: "acompanhante", token: "tok-2" },
        { nome: "Fulano de Tal", tipo: "principal", token: "tok-1" },
      ],
      error: null,
    };

    const resultado = await alterarEmailEReenviar("convite-1", "novo@x.com");

    expect(resultado).toEqual({ ok: true, emailEnviado: true });
    expect(mockSupabase.updateCalls).toEqual([
      { table: "convites", values: { email: "novo@x.com" }, col: "id", val: "convite-1" },
    ]);
    expect(emailMocks.enviarEmailReenvioIngressos).toHaveBeenCalledWith({
      para: "novo@x.com",
      nomePrincipal: "Fulano de Tal",
      ingressos: [
        { nome: "Fulano de Tal", token: "tok-1", tipo: "principal" },
        { nome: "Acompanhante", token: "tok-2", tipo: "acompanhante" },
      ],
    });
  });

  it("mantem o e-mail atualizado mas sinaliza emailEnviado:false quando o reenvio falha", async () => {
    mockSupabase.convitesLookup = { data: { id: "convite-1", nome_principal: "Fulano" }, error: null };
    mockSupabase.convidadosLookup = { data: [{ nome: "Fulano", tipo: "principal", token: "tok-1" }], error: null };
    emailMocks.enviarEmailReenvioIngressos.mockRejectedValueOnce(new Error("falhou"));

    const resultado = await alterarEmailEReenviar("convite-1", "novo@x.com");

    expect(resultado).toEqual({ ok: true, emailEnviado: false });
    expect(mockSupabase.updateCalls).toHaveLength(1);
  });
});
