"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import type { Experiencia } from "@/lib/experiencias";

type Props = {
  experiencia: Experiencia;
  onPresentear: (e: Experiencia, valor: number) => void;
};

/** Bloco íntimo de valor aberto. */
export default function ContribuicaoLivre({ experiencia, onPresentear }: Props) {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function seguir() {
    const num = Number(valor.replace(",", "."));
    if (!num || num <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    setErro(null);
    onPresentear(experiencia, num);
  }

  return (
    <section className="bg-grao-papel bg-creme px-6 pb-28">
      <Reveal className="mx-auto max-w-xl rounded-sm border border-dourado/30 bg-sepia p-10 text-center text-creme shadow-cena">
        <h3 className="font-serif text-3xl">Contribuição livre</h3>
        <p className="mt-3 font-serif text-lg italic text-creme/70">
          “{experiencia.microcopia}”
        </p>

        <div className="mx-auto mt-8 flex max-w-sm items-center gap-3">
          <div className="flex flex-1 items-center rounded-sm border border-dourado/40 bg-creme/5 px-4">
            <span className="font-serif text-xl text-dourado">R$</span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              aria-label="Valor da contribuição livre"
              className="w-full bg-transparent px-3 py-3 font-serif text-xl text-creme placeholder:text-creme/40 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={seguir}
            className="rounded-sm bg-terracotta px-6 py-3 font-sans text-sm uppercase tracking-wider text-creme transition-opacity hover:opacity-90"
          >
            Seguir
          </button>
        </div>

        {erro && <p className="mt-3 font-sans text-sm text-terracotta">{erro}</p>}
      </Reveal>
    </section>
  );
}
