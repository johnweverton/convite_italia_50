import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Valida a senha da portaria antes de liberar a tela de check-in no cliente. */
export async function GET(request: Request) {
  const senhaEsperada = process.env.CHECKIN_SENHA;
  const senhaEnviada = request.headers.get("x-checkin-senha");
  if (!senhaEsperada || senhaEnviada !== senhaEsperada) {
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
