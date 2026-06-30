import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Rota chamada via Vercel Cron (configurado no vercel.json) 
 * para manter o banco do Supabase ativo.
 */
export async function GET(request: Request) {
  // Verifica o cabeçalho Authorization se estiver usando Vercel Cron Auth (opcional/recomendado)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    // Faz uma consulta super leve só para marcar atividade na API/Banco
    const { data, error } = await supabase
      .from("contribuicoes")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Erro no Cron de Keep Alive:", error);
      return NextResponse.json(
        { erro: "Erro ao acessar o banco" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: "Supabase pinguado com sucesso!", count: data.length });
  } catch (e) {
    console.error("Falha geral no Cron:", e);
    return NextResponse.json({ erro: "Serviço indisponível" }, { status: 503 });
  }
}
