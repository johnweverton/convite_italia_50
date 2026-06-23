"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useInView } from "framer-motion";
import { EXPERIENCIAS_FIXAS } from "@/lib/experiencias";

/**
 * Mapa antigo da Itália (carta de 1706) que se desdobra em 3D.
 * Legenda interativa: ao clicar numa cidade, aparece um painel ao lado
 * do mapa com uma breve descrição daquela parada.
 */

const MAPA = "/cenas/mapa-italia.jpg";
const N = 4;

export default function MapaRota() {
  const reduzido = useReducedMotion() ?? false;
  const aberturaFim = 0.3 + N * 0.22;
  const [ativa, setAtiva] = useState<number | null>(null);
  const mapaRef = useRef<HTMLDivElement>(null);
  const emView = useInView(mapaRef, { once: true, amount: 0.3 });

  const rota = EXPERIENCIAS_FIXAS.map((e) => e.mapa);
  const rotaPath = rota
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const cidadeAtiva = ativa !== null ? EXPERIENCIAS_FIXAS[ativa] : null;

  return (
    <section
      className="relative bg-sepia px-6 py-24 sm:py-32"
      style={{ perspective: 1700 }}
    >
      <div className="mx-auto mb-12 max-w-3xl text-center text-creme">
        <p className="font-sans text-xs uppercase tracking-[0.35em] text-dourado">
          L&rsquo;itinerario
        </p>
        <h2 className="mt-4 font-serif text-4xl sm:text-5xl">
          Os caminhos que vou percorrer
        </h2>
      </div>

      {/* Mapa + painel lateral */}
      <div ref={mapaRef} className="mx-auto flex max-w-5xl flex-col items-start gap-8 lg:flex-row">
        {/* Pergaminho que se desdobra */}
        <motion.div
          initial={{ opacity: 0, rotateX: reduzido ? 0 : -18, y: 24 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)] lg:flex-1"
        >
          <div
            className="relative w-full"
            style={{ aspectRatio: "3104 / 2161", transformStyle: "preserve-3d" }}
          >
            {/* Painéis dobrados */}
            <div className="absolute inset-0 flex" style={{ transformStyle: "preserve-3d" }}>
              {Array.from({ length: N }).map((_, i) => (
                <motion.div
                  key={i}
                  className="h-full"
                  style={{
                    width: `${100 / N}%`,
                    backgroundImage: `url(${MAPA})`,
                    backgroundSize: `${N * 100}% 100%`,
                    backgroundPosition: `${(i / (N - 1)) * 100}% center`,
                    transformOrigin: i % 2 === 0 ? "left center" : "right center",
                  }}
                  initial={
                    reduzido
                      ? { opacity: 0 }
                      : { rotateY: i % 2 === 0 ? 78 : -78, opacity: 0 }
                  }
                  whileInView={{ rotateY: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 1.1,
                    delay: 0.3 + i * 0.22,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              ))}
            </div>

            {/* Vincos das dobras */}
            {Array.from({ length: N - 1 }).map((_, i) => (
              <div
                key={i}
                className="pointer-events-none absolute inset-y-0 w-6"
                style={{
                  left: `calc(${((i + 1) / N) * 100}% - 12px)`,
                  background:
                    "linear-gradient(90deg, transparent, rgba(46,34,24,0.18), transparent)",
                }}
                aria-hidden
              />
            ))}

            {/* Textura de papel envelhecido */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 120% at 50% 30%, transparent 60%, rgba(46,34,24,0.35) 100%)",
              }}
              aria-hidden
            />

            {/* Rota desenhada */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden
            >
              <motion.path
                d={rotaPath}
                fill="none"
                stroke="#B5532A"
                strokeWidth="0.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2 1.6"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.95 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.6, delay: aberturaFim, ease: "easeInOut" }}
              />
            </svg>

            {/* Paradas numeradas — clicáveis */}
            {EXPERIENCIAS_FIXAS.map((e, i) => {
              const c = e.mapa;
              const isAtiva = ativa === i;
              return (
                <motion.button
                  key={e.id}
                  type="button"
                  onClick={() => setAtiva(isAtiva ? null : i)}
                  className="absolute flex items-center gap-1.5"
                  style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: aberturaFim + 0.3 + i * 0.18 }}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold shadow-[0_2px_6px_rgba(0,0,0,0.5)] ring-2 transition-colors duration-300 ${
                      isAtiva
                        ? "bg-dourado text-sepia ring-dourado/70"
                        : "bg-terracotta text-creme ring-creme/70"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="whitespace-nowrap rounded-sm bg-creme/85 px-1.5 py-0.5 font-serif text-xs text-sepia shadow-sm">
                    {e.cidade}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Painel lateral — aparece ao clicar numa cidade */}
        <div className="w-full lg:w-72 lg:flex-shrink-0">
          <AnimatePresence mode="wait">
            {cidadeAtiva ? (
              <motion.div
                key={cidadeAtiva.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-sm border border-dourado/20 bg-sepia/80 p-6 backdrop-blur-sm"
              >
                <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-dourado">
                  Parada {EXPERIENCIAS_FIXAS.indexOf(cidadeAtiva) + 1}
                </span>
                <h3 className="mt-2 font-serif text-2xl text-creme">
                  {cidadeAtiva.cidade}
                </h3>
                <p className="mt-3 font-serif text-sm italic leading-relaxed text-creme/70">
                  {cidadeAtiva.microcopia}
                </p>
                <p className="mt-4 font-sans text-[10px] uppercase tracking-[0.15em] text-dourado/60">
                  {cidadeAtiva.referencia}
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 text-center font-serif text-sm italic text-creme/40 lg:text-left"
              >
                Toque em uma parada no mapa para conhecer mais.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legenda interativa */}
      <div className="mx-auto mt-10 max-w-3xl">
        <div className="flex flex-wrap items-center justify-center gap-y-3 text-creme/85">
          {EXPERIENCIAS_FIXAS.map((e, i) => (
            <span key={e.id} className="flex items-center">
              <button
                type="button"
                onClick={() => setAtiva(ativa === i ? null : i)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-300 ${
                  ativa === i
                    ? "bg-dourado/15 text-dourado"
                    : "text-creme/70 hover:text-creme"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full font-sans text-[10px] font-medium transition-colors duration-300 ${
                    ativa === i
                      ? "bg-dourado text-sepia"
                      : "border border-dourado/40 text-dourado/70"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="font-serif text-sm italic tracking-wide">
                  {e.cidade}
                </span>
              </button>
              {i < EXPERIENCIAS_FIXAS.length - 1 && (
                <span className="mx-2 text-dourado/30 sm:mx-3">&middot;</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
