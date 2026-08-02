"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/supabase/server";
import { gerarPdfRelatorio } from "@/lib/pdf-relatorio";

/**
 * Autorização lida do cookie httpOnly (nunca da URL nem de props client) —
 * cada Server Action revalida por conta própria, direto no cookie da requisição.
 */
function senhaAutorizada(): boolean {
  const senhaEsperada = process.env.PAINEL_SENHA;
  const senhaCookie = cookies().get("painel_senha")?.value;
  return Boolean(senhaEsperada) && senhaCookie === senhaEsperada;
}

/** Exclui definitivamente um convite (titular + acompanhantes, via cascade) — usado para corrigir duplicidades. */
export async function excluirConvite(conviteId: string) {
  if (!senhaAutorizada()) {
    return { ok: false as const, erro: "Não autorizado." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from("convites").delete().eq("id", conviteId);

  if (error) {
    console.error("Erro ao excluir convite:", error);
    return { ok: false as const, erro: "Não foi possível excluir o convite." };
  }

  revalidatePath("/painel/convidados");
  return { ok: true as const };
}

type ConvidadoRelatorio = {
  nome: string;
  tipo: string;
  status: string;
  checked_in_at: string | null;
  convites: {
    nome_principal: string;
    email: string;
  } | null;
};

function escaparCsv(valor: string): string {
  if (/[",\n;]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/** Busca convidados (com convite/titular) e cruza a restrição alimentar por e-mail — usado pelo CSV e pelo PDF. */
async function buscarLinhasRelatorio(): Promise<
  { ok: true; linhas: ConvidadoRelatorio[]; restricaoPorEmail: Map<string, string> } | { ok: false; erro: string }
> {
  const supabase = getServiceClient();

  const { data: convidados, error } = await supabase
    .from("convidados")
    .select("nome, tipo, status, checked_in_at, convites(nome_principal, email)")
    .order("nome");

  if (error) {
    console.error("Erro ao buscar convidados para relatório:", error);
    return { ok: false, erro: "Não foi possível gerar o relatório." };
  }

  const { data: rsvps } = await supabase
    .from("respostas_rsvp")
    .select("email, restricao_alimentar");

  const restricaoPorEmail = new Map<string, string>();
  for (const r of rsvps ?? []) {
    const restricoes = (r.restricao_alimentar ?? []) as string[];
    if (restricoes.length > 0) {
      restricaoPorEmail.set(r.email, restricoes.join(" / "));
    }
  }

  return {
    ok: true,
    linhas: (convidados ?? []) as unknown as ConvidadoRelatorio[],
    restricaoPorEmail,
  };
}

/** Gera o CSV de todos os ingressos (titulares + acompanhantes) para a gerência da cerimonialista. */
export async function gerarRelatorioCsv() {
  if (!senhaAutorizada()) {
    return { ok: false as const, erro: "Não autorizado." };
  }

  const resultado = await buscarLinhasRelatorio();
  if (!resultado.ok) {
    return { ok: false as const, erro: resultado.erro };
  }
  const { linhas, restricaoPorEmail } = resultado;

  const cabecalho = [
    "Nome",
    "Tipo",
    "Titular responsável",
    "E-mail do titular",
    "Restrição alimentar",
    "Status",
    "Check-in",
    "Horário do check-in",
  ];

  const linhasCsv = linhas.map((c) => {
    const email = c.convites?.email ?? "";
    return [
      c.nome,
      c.tipo === "principal" ? "Titular" : "Acompanhante",
      c.convites?.nome_principal ?? "",
      email,
      restricaoPorEmail.get(email) ?? "Nenhuma informada",
      c.status === "check-in" ? "Chegou" : "Aguardando",
      c.checked_in_at ? "Sim" : "Não",
      c.checked_in_at ? new Date(c.checked_in_at).toLocaleString("pt-BR") : "",
    ]
      .map(escaparCsv)
      .join(";");
  });

  // Sem BOM aqui: caracteres invisíveis no início da string não sobrevivem à
  // serialização da Server Action (o TextDecoder do cliente descarta um BOM
  // inicial). O BOM é adicionado no navegador, ao montar o Blob do download.
  const csv = [cabecalho.join(";"), ...linhasCsv].join("\n");

  return { ok: true as const, csv };
}

/** Gera o mesmo relatório em PDF (tabela paginada), para impressão/entrega à cerimonialista. */
export async function gerarRelatorioPdf() {
  if (!senhaAutorizada()) {
    return { ok: false as const, erro: "Não autorizado." };
  }

  const resultado = await buscarLinhasRelatorio();
  if (!resultado.ok) {
    return { ok: false as const, erro: resultado.erro };
  }
  const { linhas, restricaoPorEmail } = resultado;

  const totalPessoas = linhas.length;
  const totalTitulares = linhas.filter((c) => c.tipo === "principal").length;
  const totalAcompanhantes = totalPessoas - totalTitulares;
  const totalComRestricao = linhas.filter((c) => restricaoPorEmail.has(c.convites?.email ?? "")).length;
  const totalChegaram = linhas.filter((c) => c.status === "check-in").length;

  const resumo = [
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    `Total de pessoas: ${totalPessoas}  |  Titulares: ${totalTitulares}  |  Acompanhantes: ${totalAcompanhantes}`,
    `Com restrição alimentar: ${totalComRestricao}  |  Já chegaram (check-in): ${totalChegaram}`,
  ];

  const linhasPdf = linhas.map((c) => {
    const email = c.convites?.email ?? "";
    return {
      nome: c.nome,
      tipo: c.tipo === "principal" ? "Titular" : "Acomp.",
      titular: c.convites?.nome_principal ?? "",
      restricao: restricaoPorEmail.get(email) ?? "Nenhuma",
      status: c.status === "check-in" ? "Chegou" : "Aguard.",
    };
  });

  try {
    const buffer = await gerarPdfRelatorio(linhasPdf, resumo);
    return { ok: true as const, base64: buffer.toString("base64") };
  } catch (e) {
    console.error("Erro ao gerar PDF do relatório:", e);
    return { ok: false as const, erro: "Não foi possível gerar o PDF." };
  }
}
