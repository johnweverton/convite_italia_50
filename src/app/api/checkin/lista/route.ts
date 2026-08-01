import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const senhaEsperada = process.env.CHECKIN_SENHA;
  const senhaEnviada = request.headers.get("x-checkin-senha");
  if (!senhaEsperada || senhaEnviada !== senhaEsperada) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("convidados")
    .select("id, nome, tipo, status, checked_in_at, token, convites(nome_principal)")
    .order("nome");

  if (error) {
    console.error("Erro ao listar convidados para check-in:", error);
    return NextResponse.json({ erro: "Não foi possível carregar a lista." }, { status: 500 });
  }

  type Linha = {
    id: string;
    nome: string;
    tipo: string;
    status: string;
    checked_in_at: string | null;
    token: string;
    convites: { nome_principal: string } | null;
  };

  const convidados = (data ?? []) as unknown as Linha[];

  return NextResponse.json({
    convidados: convidados.map((c) => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      status: c.status,
      checkedInAt: c.checked_in_at,
      token: c.token,
      nomePrincipal: c.convites?.nome_principal ?? null,
    })),
  });
}
