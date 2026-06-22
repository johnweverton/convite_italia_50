"use client";

import Reveal from "./Reveal";
import ExperienciaCard from "./ExperienciaCard";
import { EXPERIENCIAS, type Experiencia } from "@/lib/experiencias";

type Props = {
  onPresentear: (e: Experiencia, valorCustom?: number) => void;
};

/**
 * Grade de experiências: 5 experiências fixas + 1 contribuição livre = 6 cards (3×2).
 * Cada card é um retrato com vídeo da cidade.
 */
export default function Experiencias({ onPresentear }: Props) {
  return (
    <section id="experiencias" className="bg-grao-papel bg-creme px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-terracotta">
            Le esperienze
          </p>
          <h2 className="mt-4 font-serif text-4xl text-sepia sm:text-5xl">
            Momentos que compõem essa jornada
          </h2>
          <p className="mx-auto mt-6 max-w-lg font-serif text-lg italic leading-relaxed text-sepia/65">
            Cada parada guarda um pedaço do meu sonho.
            <br className="hidden sm:block" />
            Escolha a que tocar o seu coração.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIENCIAS.map((exp, i) => (
            <ExperienciaCard
              key={exp.id}
              experiencia={exp}
              indice={i}
              onPresentear={onPresentear}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
