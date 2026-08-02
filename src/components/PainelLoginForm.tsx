"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { entrarPainel } from "@/app/painel/actions";

export default function PainelLoginForm({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const resultado = await entrarPainel(senha);
    if (!resultado.ok) {
      setErro(resultado.erro);
      setEnviando(false);
      return;
    }
    router.refresh();
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-creme px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-sm border border-dourado/30 bg-white p-10 text-center shadow-cena"
      >
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-sepia/5">
          <svg className="h-6 w-6 text-sepia" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="font-serif text-2xl text-sepia">{titulo}</h1>
        <p className="mt-2 font-sans text-xs leading-relaxed text-sepia/60">{descricao}</p>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha de acesso"
          autoFocus
          className="mt-8 w-full border-b border-sepia/20 bg-transparent py-2 text-center font-sans text-sepia placeholder-sepia/30 focus:border-terracotta focus:outline-none"
        />
        {erro && <p className="mt-3 font-sans text-xs text-terracotta">{erro}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="mt-8 w-full rounded-sm bg-terracotta py-4 font-sans text-sm uppercase tracking-wider text-creme transition-colors hover:bg-terracotta/90 disabled:opacity-60"
        >
          {enviando ? "Entrando..." : "Entrar no Painel"}
        </button>
      </form>
    </main>
  );
}
