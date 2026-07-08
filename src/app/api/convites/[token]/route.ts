import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const supabase = getServiceClient();

  const { data: convite, error } = await supabase
    .from("convites")
    .select("id, nome_principal, vagas_extras, status")
    .eq("token", params.token)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar convite:", error);
    return NextResponse.json({ erro: "Não foi possível carregar o convite." }, { status: 500 });
  }

  if (!convite) {
    return NextResponse.json({ erro: "Convite não encontrado." }, { status: 404 });
  }

  let acompanhantes: string[] = [];
  if (convite.status === "confirmado") {
    const { data: convidados } = await supabase
      .from("convidados")
      .select("nome")
      .eq("convite_id", convite.id)
      .eq("tipo", "acompanhante");
    acompanhantes = (convidados ?? []).map((c) => c.nome);
  }

  return NextResponse.json({
    nomePrincipal: convite.nome_principal,
    vagasExtras: convite.vagas_extras,
    status: convite.status,
    acompanhantes,
  });
}
