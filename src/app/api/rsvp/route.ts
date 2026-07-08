import { NextResponse } from "next/server";
import { RsvpPublicoSchema } from "@/lib/schemas";
import { getServiceClient } from "@/lib/supabase/server";
import { gerarToken } from "@/lib/tickets";
import { enviarEmailRsvpPublico } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const parsed = RsvpPublicoSchema.safeParse(corpo);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { nome, email, presenca, acompanhantes, restricao_alimentar, mensagem } = parsed.data;
  const supabase = getServiceClient();

  try {
    // 1. Salvar a resposta no banco de dados de RSVP (funciona como log geral)
    const { error: erroRsvp } = await supabase.from("respostas_rsvp").insert({
      nome,
      email,
      presenca,
      acompanhantes,
      restricao_alimentar,
      mensagem: mensagem || null,
    });

    if (erroRsvp) {
      console.error("Erro ao salvar resposta de RSVP:", erroRsvp);
      return NextResponse.json(
        { erro: "Não foi possível registrar sua resposta." },
        { status: 500 },
      );
    }

    // Se a pessoa não vai, o fluxo encerra aqui com sucesso
    if (!presenca) {
      return NextResponse.json({ ok: true, presenca: false }, { status: 201 });
    }

    // 2. Criar o convite oficial (status confirmado) para gerar ingressos
    const tokenConvite = gerarToken();
    const { data: convite, error: erroConvite } = await supabase
      .from("convites")
      .insert({
        nome_principal: nome,
        email,
        vagas_extras: acompanhantes.length,
        token: tokenConvite,
        status: "confirmado",
      })
      .select("id")
      .single();

    if (erroConvite || !convite) {
      console.error("Erro ao inserir convite a partir do RSVP:", erroConvite);
      return NextResponse.json(
        { erro: "Sua resposta foi salva, mas falhou ao gerar convite." },
        { status: 500 },
      );
    }

    // 3. Gerar os ingressos (convidados)
    const tokenPrincipal = gerarToken();
    const ingressosParaEmail = [{ nome, token: tokenPrincipal }];

    const convidadosInsert: Array<{
      convite_id: string;
      nome: string;
      tipo: "principal" | "acompanhante";
      token: string;
    }> = [
      {
        convite_id: convite.id,
        nome,
        tipo: "principal",
        token: tokenPrincipal,
      },
    ];

    for (const acomp of acompanhantes) {
      const tokenAcomp = gerarToken();
      ingressosParaEmail.push({ nome: acomp, token: tokenAcomp });
      convidadosInsert.push({
        convite_id: convite.id,
        nome: acomp,
        tipo: "acompanhante" as const,
        token: tokenAcomp,
      });
    }

    const { error: erroConvidados } = await supabase.from("convidados").insert(convidadosInsert);

    if (erroConvidados) {
      console.error("Erro ao inserir ingressos:", erroConvidados);
      return NextResponse.json(
        { erro: "Convite gerado, mas os ingressos falharam." },
        { status: 500 },
      );
    }

    // 4. Enviar e-mail com todos os ingressos
    try {
      await enviarEmailRsvpPublico({
        para: email,
        nomePrincipal: nome,
        ingressos: ingressosParaEmail,
      });
    } catch (e) {
      console.error("Falha no envio do e-mail do RSVP:", e);
    }

    return NextResponse.json({ ok: true, presenca: true }, { status: 201 });
  } catch (e) {
    console.error("Falha na rota de RSVP:", e);
    return NextResponse.json({ erro: "Serviço indisponível." }, { status: 503 });
  }
}
