import { NextResponse } from "next/server";
import { ContribuicaoSchema } from "@/lib/schemas";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const parsed = ContribuicaoSchema.safeParse(corpo);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { nome, experiencia, valor, metodo, mensagem } = parsed.data;

  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("contribuicoes").insert({
      nome,
      experiencia,
      valor,
      metodo,
      mensagem: mensagem || null,
    });

    if (error) {
      console.error("Erro ao inserir contribuição:", error);
      return NextResponse.json(
        { erro: "Não foi possível registrar agora." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("Falha na rota de contribuições:", e);
    return NextResponse.json(
      { erro: "Serviço indisponível." },
      { status: 503 },
    );
  }
}
