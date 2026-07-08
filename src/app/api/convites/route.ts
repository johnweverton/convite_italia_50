import { NextResponse } from "next/server";
import { ConviteSchema } from "@/lib/schemas";
import { getServiceClient } from "@/lib/supabase/server";
import { gerarToken } from "@/lib/tickets";
import { enviarEmailConvite } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const parsed = ConviteSchema.safeParse(corpo);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { nome_principal, email, vagas_extras } = parsed.data;

  try {
    const supabase = getServiceClient();
    const tokenConvite = gerarToken();

    const { data: convite, error: erroConvite } = await supabase
      .from("convites")
      .insert({
        nome_principal,
        email,
        vagas_extras,
        token: tokenConvite,
      })
      .select("id")
      .single();

    if (erroConvite || !convite) {
      console.error("Erro ao inserir convite:", erroConvite);
      return NextResponse.json(
        { erro: "Não foi possível criar o convite." },
        { status: 500 },
      );
    }

    const tokenIngresso = gerarToken();
    const { error: erroConvidado } = await supabase.from("convidados").insert({
      convite_id: convite.id,
      nome: nome_principal,
      tipo: "principal",
      token: tokenIngresso,
    });

    if (erroConvidado) {
      console.error("Erro ao inserir convidado principal:", erroConvidado);
      return NextResponse.json(
        { erro: "Convite criado, mas o ingresso não pôde ser gerado." },
        { status: 500 },
      );
    }

    try {
      await enviarEmailConvite({
        para: email,
        ingressoPrincipal: { nome: nome_principal, token: tokenIngresso },
        vagasExtras: vagas_extras,
        tokenConvite,
      });
    } catch (e) {
      console.error("Convite criado, mas falhou o envio do e-mail:", e);
    }

    return NextResponse.json({ ok: true, tokenConvite }, { status: 201 });
  } catch (e) {
    console.error("Falha na rota de convites:", e);
    return NextResponse.json({ erro: "Serviço indisponível." }, { status: 503 });
  }
}
