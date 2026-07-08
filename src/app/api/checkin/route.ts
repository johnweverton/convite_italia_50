import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const senhaEsperada = process.env.CHECKIN_SENHA;
  const senhaEnviada = request.headers.get("x-checkin-senha");
  if (!senhaEsperada || senhaEnviada !== senhaEsperada) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const token = typeof (corpo as { token?: unknown })?.token === "string"
    ? (corpo as { token: string }).token
    : null;
  if (!token) {
    return NextResponse.json({ erro: "QR code inválido." }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: convidado, error } = await supabase
    .from("convidados")
    .select("id, nome, tipo, status, checked_in_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar convidado:", error);
    return NextResponse.json({ erro: "Não foi possível validar agora." }, { status: 500 });
  }

  if (!convidado) {
    return NextResponse.json({ erro: "Ingresso não encontrado." }, { status: 404 });
  }

  if (convidado.status === "check-in") {
    return NextResponse.json(
      {
        erro: "Este ingresso já foi utilizado.",
        nome: convidado.nome,
        checkedInAt: convidado.checked_in_at,
      },
      { status: 409 },
    );
  }

  const agora = new Date().toISOString();
  const { error: erroUpdate } = await supabase
    .from("convidados")
    .update({ status: "check-in", checked_in_at: agora })
    .eq("id", convidado.id);

  if (erroUpdate) {
    console.error("Erro ao marcar check-in:", erroUpdate);
    return NextResponse.json({ erro: "Não foi possível confirmar o check-in." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    nome: convidado.nome,
    tipo: convidado.tipo,
    checkedInAt: agora,
  });
}
