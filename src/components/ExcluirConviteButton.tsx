"use client";

import { useState } from "react";
import { excluirConvite } from "@/app/painel/convidados/actions";

export default function ExcluirConviteButton({
  conviteId,
  nomePrincipal,
}: {
  conviteId: string;
  nomePrincipal: string;
}) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onClick() {
    const confirmado = window.confirm(
      `Excluir definitivamente o convite de "${nomePrincipal}"? Isso remove o convite e todos os ingressos/QR codes associados (titular e acompanhantes). Não pode ser desfeito.`,
    );
    if (!confirmado) return;

    setErro(null);
    setExcluindo(true);
    const resultado = await excluirConvite(conviteId);
    if (!resultado.ok) {
      setErro(resultado.erro);
      setExcluindo(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={onClick}
        disabled={excluindo}
        className="rounded-sm border border-terracotta/30 px-3 py-1.5 font-sans text-xs uppercase tracking-wider text-terracotta transition-colors hover:bg-terracotta/10 disabled:opacity-50"
      >
        {excluindo ? "Excluindo..." : "Excluir"}
      </button>
      {erro && <p className="mt-1 font-sans text-xs text-terracotta">{erro}</p>}
    </div>
  );
}
