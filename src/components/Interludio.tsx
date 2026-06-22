"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

type Props = {
  /** Linha pequena em cima (ex: "A cidade eterna"). */
  legenda: string;
  /** A frase central, pessoal e contemplativa. */
  frase: string;
  /** Atribuição discreta da obra/lugar (ex: "Capela Sistina, Vaticano"). */
  obra?: string;
  /** Gradiente atmosférico de fundo. */
  atmosfera: string;
  /** Pintura opcional em public/cenas. */
  imagem?: string;
};

/**
 * Cena contemplativa entre os blocos: respiro visual com uma pintura clássica
 * ou referência católica e uma frase pessoal. Dá ritmo à narrativa.
 */
export default function Interludio({
  legenda,
  frase,
  obra,
  atmosfera,
  imagem,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const fundoY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[80svh] items-center justify-center overflow-hidden text-center"
    >
      <motion.div
        className="absolute inset-0 scale-110 bg-cover bg-center"
        style={{
          y: fundoY,
          backgroundImage: imagem ? `url(${imagem}), ${atmosfera}` : atmosfera,
        }}
        aria-hidden
      />
      <div className="vinheta absolute inset-0 bg-sepia/55" aria-hidden />

      <div className="relative z-10 max-w-2xl px-6 text-creme">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="font-sans text-xs uppercase tracking-[0.35em] text-dourado"
        >
          {legenda}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.15 }}
          className="mt-8 font-serif text-3xl italic leading-relaxed sm:text-4xl"
        >
          {frase}
        </motion.p>

        {obra && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-8 font-sans text-xs uppercase tracking-[0.25em] text-creme/60"
          >
            {obra}
          </motion.p>
        )}
      </div>
    </section>
  );
}
