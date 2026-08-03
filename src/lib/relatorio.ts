/** Lógica pura de geração do relatório de confirmados (sem I/O), para ser testável isoladamente. */

export type ConvidadoRelatorio = {
  convite_id: string;
  nome: string;
  tipo: string;
  status: string;
  checked_in_at: string | null;
  created_at: string;
  convites: {
    nome_principal: string;
    email: string;
    created_at: string;
  } | null;
};

export function escaparCsv(valor: string): string {
  if (/[",\n;]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/**
 * Ordena por sequência de confirmação (convite mais antigo primeiro) e, dentro
 * de cada convite, coloca o titular antes dos acompanhantes.
 */
export function ordenarPorConfirmacao(linhas: ConvidadoRelatorio[]): ConvidadoRelatorio[] {
  const grupos = new Map<string, { criadoEm: number; itens: ConvidadoRelatorio[] }>();

  for (const linha of linhas) {
    const criadoEm = new Date(linha.convites?.created_at ?? linha.created_at).getTime();
    const grupo = grupos.get(linha.convite_id);
    if (grupo) {
      grupo.itens.push(linha);
    } else {
      grupos.set(linha.convite_id, { criadoEm, itens: [linha] });
    }
  }

  return Array.from(grupos.values())
    .sort((a, b) => a.criadoEm - b.criadoEm)
    .flatMap((grupo) =>
      grupo.itens.sort((a, b) => {
        if (a.tipo === b.tipo) return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return a.tipo === "principal" ? -1 : 1;
      }),
    );
}

/**
 * A restrição alimentar é respondida uma vez por quem preencheu o RSVP (o titular), nunca
 * pelo acompanhante. Como titular e acompanhante compartilham o e-mail do convite, o
 * cruzamento só deve valer para a linha do titular, senão o acompanhante herda (errado) a
 * restrição do titular e cada convite com acompanhante conta em dobro no resumo.
 */
export function restricaoDoConvidado(
  linha: ConvidadoRelatorio,
  restricaoPorEmail: Map<string, string>,
  semRestricao: string,
  naoInformado: string,
): string {
  if (linha.tipo !== "principal") return naoInformado;
  const email = linha.convites?.email ?? "";
  return restricaoPorEmail.get(email) ?? semRestricao;
}

/** Monta o mapa e-mail -> restrições declaradas (só entra quem de fato reportou alguma). */
export function montarRestricaoPorEmail(
  respostas: Array<{ email: string; restricao_alimentar: string[] | null }>,
): Map<string, string> {
  const restricaoPorEmail = new Map<string, string>();
  for (const r of respostas) {
    const restricoes = r.restricao_alimentar ?? [];
    if (restricoes.length > 0) {
      restricaoPorEmail.set(r.email, restricoes.join(" / "));
    }
  }
  return restricaoPorEmail;
}
