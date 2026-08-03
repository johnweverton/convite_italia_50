"use client";

import { useMemo, useState } from "react";
import ExcluirConviteButton from "@/components/ExcluirConviteButton";

type ConvidadoDoConvite = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
};

type ConviteResumo = {
  id: string;
  nomePrincipal: string;
  email: string;
  vagasExtras: number;
  status: string;
  convidados: ConvidadoDoConvite[];
};

export type RsvpCard = {
  id: string;
  createdAt: string;
  nome: string;
  email: string;
  presenca: boolean;
  acompanhantes: string[];
  restricaoAlimentar: string[];
  mensagem: string | null;
  convite: ConviteResumo | null;
};

export default function ListaConvidados({
  rsvps,
  convitesManuais,
}: {
  rsvps: RsvpCard[];
  convitesManuais: ConviteResumo[];
}) {
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();

  const rsvpsFiltrados = useMemo(() => {
    if (!termo) return rsvps;
    return rsvps.filter(
      (r) =>
        r.nome.toLowerCase().includes(termo) ||
        r.email.toLowerCase().includes(termo) ||
        r.acompanhantes.some((a) => a.toLowerCase().includes(termo)),
    );
  }, [rsvps, termo]);

  const manuaisFiltrados = useMemo(() => {
    if (!termo) return convitesManuais;
    return convitesManuais.filter(
      (c) => c.nomePrincipal.toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo),
    );
  }, [convitesManuais, termo]);

  return (
    <div>
      <div className="mb-8">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full max-w-md rounded-sm border border-sepia/20 px-4 py-3 font-sans text-sm text-sepia placeholder:text-sepia/40 focus:border-terracotta focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {rsvpsFiltrados.map((rsvp) => (
          <div
            key={rsvp.id}
            className={`flex flex-col rounded-sm border ${
              rsvp.presenca ? "border-oliva/30 bg-white" : "border-terracotta/20 bg-white/50 opacity-80"
            } p-6 shadow-sm`}
          >
            <div className="flex items-start justify-between border-b border-sepia/10 pb-4">
              <div>
                <h3 className="font-serif text-xl text-sepia">{rsvp.nome}</h3>
                <p className="font-sans text-xs text-sepia/60">{rsvp.email}</p>
              </div>
              <div
                className={`rounded-full px-3 py-1 font-sans text-xs font-medium uppercase tracking-wider ${
                  rsvp.presenca ? "bg-oliva/10 text-oliva" : "bg-terracotta/10 text-terracotta"
                }`}
              >
                {rsvp.presenca ? "Confirmado" : "Não irá"}
              </div>
            </div>

            {rsvp.presenca && (
              <div className="mt-4 flex-1 space-y-4">
                <div>
                  <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">Acompanhante</p>
                  {rsvp.acompanhantes && rsvp.acompanhantes.length > 0 ? (
                    <p className="mt-1 font-sans text-sm text-sepia">{rsvp.acompanhantes[0]}</p>
                  ) : (
                    <p className="mt-1 font-sans text-sm italic text-sepia/60">Nenhum acompanhante</p>
                  )}
                </div>

                {rsvp.restricaoAlimentar && rsvp.restricaoAlimentar.length > 0 && (
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">Restrições Alimentares</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {rsvp.restricaoAlimentar.map((restricao, idx) => (
                        <span key={idx} className="rounded-sm bg-terracotta/10 px-2 py-1 font-sans text-xs text-terracotta">
                          {restricao}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {rsvp.mensagem && (
                  <div className="rounded-sm bg-sepia/5 p-4">
                    <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">Mensagem para Carmem</p>
                    <p className="mt-2 font-serif text-sm italic leading-relaxed text-sepia">"{rsvp.mensagem}"</p>
                  </div>
                )}
              </div>
            )}

            {!rsvp.presenca && rsvp.mensagem && (
              <div className="mt-4 rounded-sm bg-sepia/5 p-4">
                <p className="font-sans text-xs uppercase tracking-wider text-sepia/50">Mensagem deixada</p>
                <p className="mt-2 font-serif text-sm italic leading-relaxed text-sepia">"{rsvp.mensagem}"</p>
              </div>
            )}

            <div className="mt-auto flex items-center justify-between pt-4">
              <p className="font-sans text-[10px] text-sepia/40">
                Respondido em{" "}
                {new Date(rsvp.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {rsvp.convite && (
                <ExcluirConviteButton conviteId={rsvp.convite.id} nomePrincipal={rsvp.nome} rsvpId={rsvp.id} />
              )}
            </div>
          </div>
        ))}

        {rsvpsFiltrados.length === 0 && (
          <div className="col-span-full rounded-sm border border-sepia/10 bg-white p-12 text-center">
            <p className="font-sans text-sepia/50">
              {termo ? "Nenhum convidado encontrado para essa busca." : "Nenhuma resposta recebida ainda."}
            </p>
          </div>
        )}
      </div>

      {manuaisFiltrados.length > 0 && (
        <div className="mt-12 border-t border-sepia/10 pt-8">
          <h3 className="mb-4 font-serif text-lg text-sepia">Convites manuais (sem resposta do formulário)</h3>
          <div className="space-y-3">
            {manuaisFiltrados.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-sm border border-dourado/30 bg-white p-4"
              >
                <div>
                  <p className="font-sans text-sm text-sepia">{c.nomePrincipal}</p>
                  <p className="font-sans text-xs text-sepia/60">
                    {c.email}, {c.vagasExtras} vaga(s) extra(s), {c.status === "confirmado" ? "confirmado" : "pendente"}
                  </p>
                </div>
                <ExcluirConviteButton conviteId={c.id} nomePrincipal={c.nomePrincipal} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
