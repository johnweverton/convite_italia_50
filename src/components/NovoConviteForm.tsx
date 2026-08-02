"use client";

import { useState } from "react";

export default function NovoConviteForm() {
  const [aberto, setAberto] = useState(false);
  const [nomePrincipal, setNomePrincipal] = useState("");
  const [email, setEmail] = useState("");
  const [vagasExtras, setVagasExtras] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function criar() {
    setMensagem(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/convites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_principal: nomePrincipal,
          email,
          vagas_extras: vagasExtras,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: data.erro ?? "Não foi possível criar o convite." });
        return;
      }
      setMensagem({ tipo: "ok", texto: "Convite criado e e-mail enviado." });
      setNomePrincipal("");
      setEmail("");
      setVagasExtras(0);
      window.location.reload();
    } catch {
      setMensagem({ tipo: "erro", texto: "Algo deu errado. Tente novamente." });
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-sm border border-sepia/20 px-6 py-3 font-sans text-sm uppercase tracking-wider text-sepia transition-colors hover:border-terracotta hover:text-terracotta"
      >
        Novo convite manual
      </button>
    );
  }

  return (
    <div className="w-full max-w-xl rounded-sm border border-dourado/30 bg-white p-6 shadow-cena">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-sepia">Novo convite manual</h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="font-sans text-xs uppercase tracking-wider text-sepia/50 hover:text-terracotta"
        >
          Cancelar
        </button>
      </div>
      <p className="mt-1 font-sans text-xs text-sepia/60">
        Use esta opção apenas se precisar emitir ingressos para alguém que não preencheu o formulário online.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          type="text"
          value={nomePrincipal}
          onChange={(e) => setNomePrincipal(e.target.value)}
          placeholder="Nome do convidado"
          className="rounded-sm border border-sepia/20 px-3 py-2 font-sans text-sm focus:border-terracotta focus:outline-none"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="rounded-sm border border-sepia/20 px-3 py-2 font-sans text-sm focus:border-terracotta focus:outline-none"
        />
        <input
          type="number"
          min={0}
          max={5}
          value={vagasExtras}
          onChange={(e) => setVagasExtras(Number(e.target.value))}
          placeholder="Vagas extras (0-5)"
          className="rounded-sm border border-sepia/20 px-3 py-2 font-sans text-sm focus:border-terracotta focus:outline-none"
        />
      </div>

      {mensagem && (
        <p
          className={`mt-3 font-sans text-sm ${
            mensagem.tipo === "ok" ? "text-oliva" : "text-terracotta"
          }`}
        >
          {mensagem.texto}
        </p>
      )}

      <button
        type="button"
        onClick={criar}
        disabled={enviando || nomePrincipal.trim().length < 2 || !email}
        className="mt-4 rounded-sm bg-terracotta px-6 py-2 font-sans text-sm uppercase tracking-wider text-creme transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {enviando ? "Criando..." : "Criar convite"}
      </button>
    </div>
  );
}
