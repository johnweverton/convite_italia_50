"use client";

import { useEffect, useMemo, useState } from "react";

type Convidado = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  checkedInAt: string | null;
  token: string;
  nomePrincipal: string | null;
};

export default function CheckinLista({ senha }: { senha: string }) {
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [marcandoId, setMarcandoId] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/checkin/lista", {
        headers: { "x-checkin-senha": senha },
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro ?? "Não foi possível carregar a lista.");
        return;
      }
      setConvidados(data.convidados);
    } catch {
      setErro("Erro de conexão ao carregar a lista.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function marcarChegada(convidado: Convidado) {
    setMarcandoId(convidado.id);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-checkin-senha": senha,
        },
        body: JSON.stringify({ token: convidado.token }),
      });
      if (res.ok || res.status === 409) {
        await carregar();
      }
    } finally {
      setMarcandoId(null);
    }
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return convidados;
    return convidados.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        (c.nomePrincipal ?? "").toLowerCase().includes(termo),
    );
  }, [convidados, busca]);

  const total = convidados.length;
  const chegaram = convidados.filter((c) => c.status === "check-in").length;
  const faltam = total - chegaram;

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-sm border border-dourado/30 bg-white p-4 text-center">
          <p className="font-sans text-[10px] uppercase tracking-wider text-sepia/50">Total</p>
          <p className="mt-1 font-serif text-2xl text-sepia">{total}</p>
        </div>
        <div className="rounded-sm border border-dourado/30 bg-white p-4 text-center">
          <p className="font-sans text-[10px] uppercase tracking-wider text-sepia/50">Chegaram</p>
          <p className="mt-1 font-serif text-2xl text-oliva">{chegaram}</p>
        </div>
        <div className="rounded-sm border border-dourado/30 bg-white p-4 text-center">
          <p className="font-sans text-[10px] uppercase tracking-wider text-sepia/50">Faltam</p>
          <p className="mt-1 font-serif text-2xl text-terracotta">{faltam}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full rounded-sm border border-sepia/20 px-4 py-2 font-sans text-sm text-sepia focus:border-terracotta focus:outline-none"
        />
        <button
          type="button"
          onClick={carregar}
          className="whitespace-nowrap rounded-sm border border-sepia/20 px-3 py-2 font-sans text-xs uppercase tracking-wider text-sepia/60 hover:text-terracotta"
        >
          Atualizar
        </button>
      </div>

      {erro && (
        <p className="mb-4 rounded-sm bg-terracotta/10 p-3 font-sans text-sm text-terracotta">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="text-center font-sans text-sm text-sepia/50">Carregando...</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto rounded-sm border border-sepia/10 bg-white">
          {filtrados.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 border-b border-sepia/5 px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="font-sans text-sm text-sepia">{c.nome}</p>
                <p className="font-sans text-[11px] text-sepia/50">
                  {c.tipo === "principal" ? "Titular" : `Acompanhante de ${c.nomePrincipal ?? "-"}`}
                </p>
              </div>
              {c.status === "check-in" ? (
                <span className="whitespace-nowrap rounded-full bg-oliva/10 px-3 py-1 font-sans text-xs text-oliva">
                  Chegou
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => marcarChegada(c)}
                  disabled={marcandoId === c.id}
                  className="whitespace-nowrap rounded-full border border-terracotta/30 px-3 py-1 font-sans text-xs text-terracotta hover:bg-terracotta/10 disabled:opacity-50"
                >
                  {marcandoId === c.id ? "Marcando..." : "Marcar chegada"}
                </button>
              )}
            </div>
          ))}
          {filtrados.length === 0 && (
            <p className="p-8 text-center font-sans text-sm text-sepia/50">
              Nenhum convidado encontrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
