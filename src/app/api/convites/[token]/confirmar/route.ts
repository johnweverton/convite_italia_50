import { NextResponse } from "next/server";
import { ConfirmacaoSchema } from "@/lib/schemas";
import { getServiceClient } from "@/lib/supabase/server";
import { gerarToken } from "@/lib/tickets";
import { enviarEmailAcompanhantes } from "@/lib/email";
import { prazoEncerrado, mensagemPrazoEncerrado } from "@/lib/prazo";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  if (prazoEncerrado()) {
    return NextResponse.json({ erro: mensagemPrazoEncerrado }, { status: 403 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const parsed = ConfirmacaoSchema.safeParse(corpo);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { acompanhantes } = parsed.data;
  const supabase = getServiceClient();

  const { data: convite, error: erroConvite } = await supabase
    .from("convites")
    .select("id, nome_principal, email, vagas_extras, status")
    .eq("token", params.token)
    .maybeSingle();

  if (erroConvite) {
    console.error("Erro ao buscar convite:", erroConvite);
    return NextResponse.json({ erro: "Não foi possível carregar o convite." }, { status: 500 });
  }
  if (!convite) {
    return NextResponse.json({ erro: "Convite não encontrado." }, { status: 404 });
  }
  if (convite.status === "confirmado") {
    return NextResponse.json(
      { erro: "Este convite já teve os acompanhantes confirmados." },
      { status: 409 },
    );
  }
  if (acompanhantes.length > convite.vagas_extras) {
    return NextResponse.json(
      { erro: `Você tem direito a no máximo ${convite.vagas_extras} acompanhante(s).` },
      { status: 422 },
    );
  }

  const novosConvidados = acompanhantes.map((nome) => ({
    convite_id: convite.id,
    nome,
    tipo: "acompanhante" as const,
    token: gerarToken(),
  }));

  if (novosConvidados.length > 0) {
    const { error: erroInsert } = await supabase.from("convidados").insert(novosConvidados);
    if (erroInsert) {
      console.error("Erro ao inserir acompanhantes:", erroInsert);
      return NextResponse.json(
        { erro: "Não foi possível registrar os acompanhantes." },
        { status: 500 },
      );
    }
  }

  const { error: erroUpdate } = await supabase
    .from("convites")
    .update({ status: "confirmado" })
    .eq("id", convite.id);

  if (erroUpdate) {
    console.error("Erro ao marcar convite como confirmado:", erroUpdate);
  }

  if (novosConvidados.length > 0) {
    try {
      await enviarEmailAcompanhantes({
        para: convite.email,
        nomePrincipal: convite.nome_principal,
        ingressos: novosConvidados.map((c) => ({ nome: c.nome, token: c.token })),
      });
    } catch (e) {
      console.error("Acompanhantes registrados, mas falhou o envio do e-mail:", e);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
