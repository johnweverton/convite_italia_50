import { describe, it, expect } from "vitest";
import {
  escaparCsv,
  ordenarPorConfirmacao,
  restricaoDoConvidado,
  montarRestricaoPorEmail,
  type ConvidadoRelatorio,
} from "./relatorio";

function linha(overrides: Partial<ConvidadoRelatorio>): ConvidadoRelatorio {
  return {
    convite_id: "c1",
    nome: "Fulano",
    tipo: "principal",
    status: "pendente",
    checked_in_at: null,
    created_at: "2026-07-01T10:00:00-03:00",
    convites: { nome_principal: "Fulano", email: "fulano@example.com", created_at: "2026-07-01T10:00:00-03:00" },
    ...overrides,
  };
}

describe("escaparCsv", () => {
  it("nao altera valores simples", () => {
    expect(escaparCsv("Fulano de Tal")).toBe("Fulano de Tal");
  });

  it("envolve em aspas quando contem ponto e virgula (separador do CSV)", () => {
    expect(escaparCsv("Vegano; sem lactose")).toBe('"Vegano; sem lactose"');
  });

  it("escapa aspas internas duplicando-as", () => {
    expect(escaparCsv('Ele disse "oi"')).toBe('"Ele disse ""oi"""');
  });

  it("envolve em aspas quando contem quebra de linha", () => {
    expect(escaparCsv("linha1\nlinha2")).toBe('"linha1\nlinha2"');
  });
});

describe("montarRestricaoPorEmail", () => {
  it("so inclui e-mails que de fato reportaram alguma restricao", () => {
    const mapa = montarRestricaoPorEmail([
      { email: "a@x.com", restricao_alimentar: ["Vegano"] },
      { email: "b@x.com", restricao_alimentar: [] },
      { email: "c@x.com", restricao_alimentar: null },
    ]);
    expect(mapa.get("a@x.com")).toBe("Vegano");
    expect(mapa.has("b@x.com")).toBe(false);
    expect(mapa.has("c@x.com")).toBe(false);
  });

  it("junta multiplas restricoes com separador", () => {
    const mapa = montarRestricaoPorEmail([{ email: "a@x.com", restricao_alimentar: ["Vegano", "Sem gluten"] }]);
    expect(mapa.get("a@x.com")).toBe("Vegano / Sem gluten");
  });
});

describe("restricaoDoConvidado", () => {
  const restricaoPorEmail = montarRestricaoPorEmail([{ email: "titular@x.com", restricao_alimentar: ["Vegano"] }]);

  it("atribui a restricao do RSVP ao titular", () => {
    const l = linha({ tipo: "principal", convites: { nome_principal: "T", email: "titular@x.com", created_at: "" } });
    expect(restricaoDoConvidado(l, restricaoPorEmail, "Nenhuma", "N/A")).toBe("Vegano");
  });

  it("NAO atribui a restricao do titular ao acompanhante, mesmo compartilhando o mesmo e-mail do convite", () => {
    const l = linha({
      tipo: "acompanhante",
      convites: { nome_principal: "T", email: "titular@x.com", created_at: "" },
    });
    expect(restricaoDoConvidado(l, restricaoPorEmail, "Nenhuma", "N/A")).toBe("N/A");
  });

  it("titular sem restricao reportada recebe o texto de 'sem restricao'", () => {
    const l = linha({ tipo: "principal", convites: { nome_principal: "T", email: "outro@x.com", created_at: "" } });
    expect(restricaoDoConvidado(l, restricaoPorEmail, "Nenhuma", "N/A")).toBe("Nenhuma");
  });
});

describe("ordenarPorConfirmacao", () => {
  it("ordena os convites por sequencia de confirmacao (mais antigo primeiro), nao por ordem alfabetica", () => {
    const linhas = [
      linha({
        convite_id: "recente",
        nome: "Zelia",
        convites: { nome_principal: "Zelia", email: "z@x.com", created_at: "2026-07-10T10:00:00-03:00" },
      }),
      linha({
        convite_id: "antigo",
        nome: "Ana",
        convites: { nome_principal: "Ana", email: "a@x.com", created_at: "2026-07-01T10:00:00-03:00" },
      }),
    ];

    const resultado = ordenarPorConfirmacao(linhas);
    expect(resultado.map((l) => l.nome)).toEqual(["Ana", "Zelia"]);
  });

  it("mantem o titular sempre antes do acompanhante dentro do mesmo convite", () => {
    const linhas = [
      linha({ convite_id: "c1", tipo: "acompanhante", nome: "Acompanhante", created_at: "2026-07-01T10:05:00-03:00" }),
      linha({ convite_id: "c1", tipo: "principal", nome: "Titular", created_at: "2026-07-01T10:00:00-03:00" }),
    ];

    const resultado = ordenarPorConfirmacao(linhas);
    expect(resultado.map((l) => l.nome)).toEqual(["Titular", "Acompanhante"]);
  });

  it("mesmo se o acompanhante estiver listado antes do titular na entrada, o titular sai primeiro", () => {
    const linhas = [
      linha({ convite_id: "c1", tipo: "acompanhante", nome: "Acompanhante" }),
      linha({ convite_id: "c1", tipo: "principal", nome: "Titular" }),
    ];
    const resultado = ordenarPorConfirmacao(linhas);
    expect(resultado[0].tipo).toBe("principal");
  });
});
