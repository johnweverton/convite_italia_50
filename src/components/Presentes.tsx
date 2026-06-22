"use client";

import { useState } from "react";
import Experiencias from "./Experiencias";
import Interludio from "./Interludio";
import Reveal from "./Reveal";
import Pagamento from "./Pagamento";
import { type Experiencia } from "@/lib/experiencias";

/**
 * Orquestra o fluxo de presente: seleção de experiência, modal de pagamento.
 * Mantém o estado num único lugar (client) para coordenar tudo.
 * 
 * Estrutura:
 *  - Experiências (6 cards com vídeo, incluindo contribuição livre)
 *  - Interlúdio da Capela Sistina + assinatura "Carmem" (encerramento)
 *  - Modal de pagamento (Pix/Cartão)
 */
export default function Presentes() {
  const [selecionada, setSelecionada] = useState<Experiencia | null>(null);
  const [valor, setValor] = useState<number | null>(null);
  const [aberto, setAberto] = useState(false);

  function abrir(exp: Experiencia, valorCustom?: number) {
    setSelecionada(exp);
    setValor(valorCustom ?? exp.valor);
    setAberto(true);
  }

  return (
    <>
      <Experiencias onPresentear={(e, v) => abrir(e, v)} />

      {/* Respiro católico — frase de agradecimento que encerra a página */}
      <Interludio
        legenda="Com fé e gratidão"
        frase="Agradeço a Deus por cada ciclo que me trouxe até aqui, e por poder sonhar com lugares tão cheios de história e de luz."
        obra="Capela Sistina, Vaticano"
        atmosfera="linear-gradient(165deg, #1f160f 0%, #5a4326 55%, #c9a24b 100%)"
        imagem="/cenas/catolico.jpg"
      />

      {/* Assinatura final */}
      <footer className="relative overflow-hidden bg-sepia px-6 py-16 text-center text-creme">
        <div className="mx-auto max-w-xl">
          <Reveal delay={0.1}>
            <p className="font-roman-script text-4xl text-dourado sm:text-5xl md:text-6xl">
              Carmem Glisse Cavalcante
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="mt-4 font-roman text-sm uppercase tracking-[0.25em] text-creme/60 sm:text-base">
              Festa di 50 anni
            </p>
          </Reveal>
        </div>
      </footer>

      <Pagamento
        aberto={aberto}
        experiencia={selecionada}
        valor={valor}
        onFechar={() => setAberto(false)}
      />
    </>
  );
}
