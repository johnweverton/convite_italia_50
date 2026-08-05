"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { alterarEmailEReenviar } from "@/app/painel/convidados/actions";

/**
 * Corrige o e-mail de um convidado e reenvia o(s) ingresso(s) já emitidos para o
 * novo endereço. Pensado para exceções (ex.: e-mail antigo comprometido/inacessível)
 * mesmo com a emissão pública de ingressos já encerrada.
 */
export default function AlterarEmailButton({
  conviteId,
  nomePrincipal,
  emailAtual,
}: {
  conviteId: string;
  nomePrincipal: string;
  emailAtual: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [novoEmail, setNovoEmail] = useState(emailAtual);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function confirmar() {
    const emailLimpo = novoEmail.trim();
    if (!emailLimpo || emailLimpo === emailAtual) {
      setMensagem({ tipo: "erro", texto: "Informe um e-mail diferente do atual." });
      return;
    }

    const confirmado = window.confirm(
      `Alterar o e-mail de "${nomePrincipal}" para "${emailLimpo}" e reenviar o(s) ingresso(s) já emitidos para esse novo endereço?`,
    );
    if (!confirmado) return;

    setMensagem(null);
    setEnviando(true);
    const resultado = await alterarEmailEReenviar(conviteId, emailLimpo);
    setEnviando(false);

    if (!resultado.ok) {
      setMensagem({ tipo: "erro", texto: resultado.erro });
      return;
    }
    if (!resultado.emailEnviado) {
      setMensagem({
        tipo: "erro",
        texto: "E-mail atualizado, mas o reenvio do ingresso falhou. Tente novamente em instantes.",
      });
      return;
    }

    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-sm border border-sepia/20 px-3 py-1.5 font-sans text-xs uppercase tracking-wider text-sepia/70 transition-colors hover:border-terracotta hover:text-terracotta"
      >
        Alterar e-mail
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input
          type="email"
          value={novoEmail}
          onChange={(e) => setNovoEmail(e.target.value)}
          placeholder="Novo e-mail"
          className="w-48 rounded-sm border border-sepia/20 px-2 py-1.5 font-sans text-xs focus:border-terracotta focus:outline-none"
        />
        <button
          type="button"
          onClick={confirmar}
          disabled={enviando}
          className="rounded-sm bg-terracotta px-3 py-1.5 font-sans text-xs uppercase tracking-wider text-creme transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAberto(false);
            setMensagem(null);
            setNovoEmail(emailAtual);
          }}
          className="font-sans text-xs uppercase tracking-wider text-sepia/50 hover:text-terracotta"
        >
          Cancelar
        </button>
      </div>
      {mensagem && (
        <p className={`font-sans text-xs ${mensagem.tipo === "ok" ? "text-oliva" : "text-terracotta"}`}>
          {mensagem.texto}
        </p>
      )}
    </div>
  );
}
