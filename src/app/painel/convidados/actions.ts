"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";
import { gerarPdfRelatorio } from "@/lib/pdf-relatorio";
import { enviarEmailReenvioIngressos } from "@/lib/email";
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
 * corrigir duplicidades. Quando o convite veio de uma resposta de RSVP, a resposta
 * também é excluída, senão o card continuaria aparecendo na lista (respostas_rsvp e
 * convites não têm relação de exclusão em cascata por conta própria).
 *
 * A relação com a resposta de RSVP é lida de `convites.rsvp_id` (coluna adicionada na
 * migration 004 + backfill 005). Se essa coluna ainda não existir no banco (migration
 * não aplicada), cai de volta no valor calculado por heurística na tela (e-mail +
 * horário mais próximo) — passado em `rsvpIdHeuristico` — para não quebrar a exclusão
 * enquanto a migration não é aplicada.
 */
export async function excluirConvite(conviteId: string, rsvpIdHeuristico?: string) {
  if (!senhaAutorizada()) {
    return { ok: false as const, erro: "Não autorizado." };
  }

  const supabase = getServiceClient();

  const { data: convite, error: erroBusca } = await supabase
    .from("convites")
    .select("rsvp_id")
    .eq("id", conviteId)
    .maybeSingle();

  const rsvpId: string | undefined = erroBusca
    ? rsvpIdHeuristico
    : ((convite?.rsvp_id as string | null | undefined) ?? undefined);

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

/**
 * Corrige o e-mail cadastrado de um convite e reenvia o(s) ingresso(s) já emitidos
 * (mesmos tokens/QR) para o novo endereço. Exceção operacional aberta mesmo com a
 * emissão pública de ingressos encerrada — ex.: convidado com a caixa de entrada
 * antiga comprometida e sem mais acesso a ela.
 */
export async function alterarEmailEReenviar(conviteId: string, novoEmail: string) {
  if (!senhaAutorizada()) {
    return { ok: false as const, erro: "Não autorizado." };
  }

  const emailValidado = z.string().trim().email().safeParse(novoEmail);
  if (!emailValidado.success) {
    return { ok: false as const, erro: "E-mail inválido." };
  }

  const supabase = getServiceClient();

  const { data: convite, error: erroConvite } = await supabase
    .from("convites")
    .select("id, nome_principal")
    .eq("id", conviteId)
    .maybeSingle();

  if (erroConvite || !convite) {
    console.error("Erro ao buscar convite para alterar e-mail:", erroConvite);
    return { ok: false as const, erro: "Convite não encontrado." };
  }

  const { data: convidadosData, error: erroConvidados } = await supabase
    .from("convidados")
    .select("nome, tipo, token")
    .eq("convite_id", conviteId);

  const convidados = (convidadosData ?? []) as Array<{ nome: string; tipo: string; token: string }>;

  if (erroConvidados || convidados.length === 0) {
    console.error("Erro ao buscar ingressos do convite:", erroConvidados);
    return { ok: false as const, erro: "Não foi possível localizar os ingressos deste convite." };
  }

  const { error: erroUpdate } = await supabase
    .from("convites")
    .update({ email: emailValidado.data })
    .eq("id", conviteId);

  if (erroUpdate) {
    console.error("Erro ao atualizar e-mail do convite:", erroUpdate);
    return { ok: false as const, erro: "Não foi possível atualizar o e-mail." };
  }

  // Titular sempre primeiro no e-mail, independente da ordem em que vieram do banco.
  const ingressosOrdenados = [...convidados].sort((a, b) =>
    a.tipo === b.tipo ? 0 : a.tipo === "principal" ? -1 : 1,
  );

  let emailEnviado = true;
  try {
    await enviarEmailReenvioIngressos({
      para: emailValidado.data,
      nomePrincipal: convite.nome_principal,
      ingressos: ingressosOrdenados.map((c) => ({
        nome: c.nome,
        token: c.token,
        tipo: c.tipo === "principal" ? "principal" : "acompanhante",
      })),
    });
  } catch (e) {
    console.error("E-mail do convite atualizado, mas falhou o reenvio dos ingressos:", e);
    emailEnviado = false;
  }

  revalidatePath("/painel/convidados");
  return { ok: true as const, emailEnviado };
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
