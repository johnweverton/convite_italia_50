"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * Abertura com vídeo de fundo (italy vibes) e as letras surgindo do desfoque.
 * Título em Roman Pride (clássico romano), nome em Italiana.
 */
export default function Hero() {
  const reduzido = useReducedMotion() ?? false;
  const desfoque = (delay: number) =>
    reduzido
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6, delay } }
      : {
          initial: { opacity: 0, filter: "blur(22px)" },
          animate: { opacity: 1, filter: "blur(0px)" },
          transition: { duration: 1.8, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-sepia text-creme">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/cenas/coliseu.jpg"
      >
        <source src="/videos/italy.mp4" type="video/mp4" />
      </video>

      {/* Escurecimento para leitura das letras */}
      <div className="absolute inset-0 bg-sepia/40" aria-hidden />
      <div className="vinheta absolute inset-0" aria-hidden />

      <div className="relative z-10 px-6 text-center">
        <motion.h1
          {...desfoque(0.4)}
          className="font-roman text-5xl uppercase leading-[1.05] tracking-[0.04em] text-creme drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)] sm:text-7xl md:text-8xl"
        >
          Festa di 50 anni
        </motion.h1>

        <motion.p
          {...desfoque(1.3)}
          className="mt-8 font-italiana text-xl uppercase tracking-[0.45em] text-creme/90 drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] sm:text-3xl"
        >
          Carmem Glisse Cavalcante
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.6 }}
        className="absolute bottom-10 z-10 flex flex-col items-center gap-2 text-creme/70"
      >
        <span className="font-sans text-[11px] uppercase tracking-[0.3em]">
          Venha comigo
        </span>
        <ChevronDown className="h-5 w-5 animate-scroll-hint" aria-hidden />
      </motion.div>
    </section>
  );
}
