"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/supabase/server";
import { gerarPdfRelatorio } from "@/lib/pdf-relatorio";
import {
  escaparCsv,
  montarRestricaoPorEmail,
  ordenarPorConfirmacao,
  restricaoDoConvidado,
  type ConvidadoRelatorio,
} from "@/lib/relatorio";

/**
 * Autorização lida do cookie httpOnly (nunca da URL nem de props client).
 * Cada Server Action revalida por conta própria, direto no cookie da requisição.
 */
function senhaAutorizada(): boolean {
  const senhaEsperada = process.env.PAINEL_SENHA;
  const senhaCookie = cookies().get("painel_senha")?.value;
  return Boolean(senhaEsperada) && senhaCookie === senhaEsperada;
}

/**
 * Exclui definitivamente um convite (titular e acompanhantes, via cascade), usado para
 * corrigir duplicidades. Quando o convite veio de uma resposta de RSVP (rsvpId informado),
 * a resposta também é excluída — senão o card continuaria aparecendo na lista, já que
 * `respostas_rsvp` e `convites` são tabelas independentes, sem relação de exclusão em cascata.
 */
export async function excluirConvite(conviteId: string, rsvpId?: string) {
  if (!senhaAutorizada()) {
    return { ok: false as const, erro: "Não autorizado." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from("convites").delete().eq("id", conviteId);

  if (error) {
    console.error("Erro ao excluir convite:", error);
    return { ok: false as const, erro: "Não foi possível excluir o convite." };
  }

  if (rsvpId) {
    const { error: erroRsvp } = await supabase.from("respostas_rsvp").delete().eq("id", rsvpId);
    if (erroRsvp) {
      console.error("Convite excluído, mas falhou ao excluir a resposta de RSVP associada:", erroRsvp);
      return {
        ok: false as const,
        erro: "O ingresso foi excluído, mas não foi possível remover a resposta do formulário. Atualize a página.",
      };
    }
  }

  revalidatePath("/painel/convidados");
  return { ok: true as const };
}

/** Busca convidados (com convite/titular) e cruza a restrição alimentar por e-mail, usado pelo CSV e pelo PDF. */
async function buscarLinhasRelatorio(): Promise<
  { ok: true; linhas: ConvidadoRelatorio[]; restricaoPorEmail: Map<string, string> } | { ok: false; erro: string }
> {
  const supabase = getServiceClient();

  const { data: convidados, error } = await supabase
    .from("convidados")
    .select("convite_id, nome, tipo, status, checked_in_at, created_at, convites(nome_principal, email, created_at)");

  if (error) {
    console.error("Erro ao buscar convidados para relatório:", error);
    return { ok: false, erro: "Não foi possível gerar o relatório." };
  }

  const { data: rsvps } = await supabase
    .from("respostas_rsvp")
    .select("email, restricao_alimentar");

  const restricaoPorEmail = montarRestricaoPorEmail(rsvps ?? []);
  const linhas = ordenarPorConfirmacao((convidados ?? []) as unknown as ConvidadoRelatorio[]);

  return { ok: true, linhas, restricaoPorEmail };
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
    return [
      c.nome,
      c.tipo === "principal" ? "Titular" : "Acompanhante",
      c.convites?.nome_principal ?? "",
      c.convites?.email ?? "",
      restricaoDoConvidado(c, restricaoPorEmail, "Nenhuma informada", "Não se aplica (acompanhante)"),
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
  const totalComRestricao = linhas.filter(
    (c) => c.tipo === "principal" && restricaoPorEmail.has(c.convites?.email ?? ""),
  ).length;
  const totalChegaram = linhas.filter((c) => c.status === "check-in").length;

  const resumo = [
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    `Total de pessoas: ${totalPessoas}  |  Titulares: ${totalTitulares}  |  Acompanhantes: ${totalAcompanhantes}`,
    `Com restrição alimentar: ${totalComRestricao}  |  Já chegaram (check-in): ${totalChegaram}`,
  ];

  const linhasPdf = linhas.map((c) => ({
    nome: c.nome,
    tipo: c.tipo === "principal" ? "Titular" : "Acomp.",
    titular: c.convites?.nome_principal ?? "",
    restricao: restricaoDoConvidado(c, restricaoPorEmail, "Nenhuma", "N/A"),
    status: c.status === "check-in" ? "Chegou" : "Aguard.",
  }));

  try {
    const buffer = await gerarPdfRelatorio(linhasPdf, resumo);
    return { ok: true as const, base64: buffer.toString("base64") };
  } catch (e) {
    console.error("Erro ao gerar PDF do relatório:", e);
    return { ok: false as const, erro: "Não foi possível gerar o PDF." };
  }
}
