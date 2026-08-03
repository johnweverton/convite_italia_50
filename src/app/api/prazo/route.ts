import { NextResponse } from "next/server";
import { prazoEncerrado } from "@/lib/prazo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Checagem de prazo baseada no relógio do servidor. As páginas de RSVP/confirmação
 * (Client Components) usam esta rota em vez de `prazoEncerrado()` direto no navegador,
 * porque o relógio do aparelho do convidado pode estar errado (fuso ou data incorretos)
 * e bloquear ou liberar a confirmação de forma equivocada. A validação de verdade,
 * que decide se a escrita é aceita, continua no servidor (rotas de POST).
 */
export async function GET() {
  return NextResponse.json({ encerrado: prazoEncerrado() });
}
