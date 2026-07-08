"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Experiencia } from "@/lib/experiencias";
import { formatarBRL } from "@/lib/utils";

const VIDEO_MAP: Record<string, string> = {
  roma: "/videos/roma.mp4",
  florenca: "/videos/florenca.mp4",
  toscana: "/videos/toscana.mp4",
  barco_amalfi: "/videos/passeiodebarcocostaamalfitana.mp4",
  veneza: "/videos/veneza.mp4",
  roteiro_amalfi: "/videos/roteiro_pela_costa_amalfitana.mp4",
  capri: "/videos/capri.mp4",
  toscana_2dias: "/videos/paisagemtoscana.mp4",
  hotel_veneza: "/videos/hotelcharmosoveneza.mp4",
  capri_completa: "/videos/experienciacompletaemcapri.mp4",
  etapa_sonhos: "/videos/italia.mp4",
  livre: "/videos/italy.mp4",
};

type Props = {
  experiencia: Experiencia;
  indice: number;
  onPresentear: (e: Experiencia, valorCustom?: number) => void;
};

export default function ExperienciaCard({
  experiencia,
  indice,
  onPresentear,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);
  const [valorLivre, setValorLivre] = useState("");
  const [erroLivre, setErroLivre] = useState<string | null>(null);

  const isLivre = experiencia.valor === null;
  const videoSrc = VIDEO_MAP[experiencia.id] || "/videos/italy.mp4";

  function handleMouseEnter() {
    setHover(true);
    videoRef.current?.play().catch(() => {});
  }

  function handleMouseLeave() {
    setHover(false);
  }

  function handlePresentearLivre() {
    const num = Number(valorLivre.replace(",", "."));
    if (!num || num <= 0) {
      setErroLivre("Informe um valor maior que zero.");
      return;
    }
    setErroLivre(null);
    onPresentear(experiencia, num);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.8,
        delay: (indice % 3) * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col overflow-hidden rounded-sm shadow-cena transition-shadow duration-500 hover:shadow-ouro"
      style={{ aspectRatio: "3/4" }}
    >
      {/* Vídeo de fundo */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Gradiente sobre o vídeo — escurece no hover para legibilidade */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(to top, rgba(46,34,24,0.92) 0%, rgba(46,34,24,0.45) 40%, rgba(46,34,24,0.08) 70%, transparent 100%)",
          opacity: hover ? 1 : 0.85,
        }}
        aria-hidden
      />

      {/* Borda dourada sutil */}
      <div
        className="absolute inset-0 rounded-sm opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(201,162,75,0.4)",
        }}
        aria-hidden
      />

      {/* Conteúdo textual — ancorado embaixo */}
      <div className="relative z-10 mt-auto flex flex-col p-6 sm:p-8">
        {/* Cidade */}
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-dourado">
          {experiencia.cidade}
        </span>

        {/* Título */}
        <h3 className="mt-2 font-serif text-xl leading-snug text-creme sm:text-2xl">
          {experiencia.titulo}
        </h3>

        {/* Microcópia — aparece no hover (desktop) ou sempre visível (mobile) */}
        <p className="mt-2 font-serif text-sm italic leading-relaxed text-creme/70 opacity-100 transition-opacity duration-500 sm:max-h-0 sm:overflow-hidden sm:opacity-0 sm:group-hover:max-h-40 sm:group-hover:opacity-100">
          {experiencia.microcopia}
        </p>

        {/* Referência */}
        <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.15em] text-creme/50">
          {experiencia.referencia}
        </p>

        {/* Valor + botão — para contribuição fixa */}
        {!isLivre && (
          <div className="mt-5 flex items-center justify-between">
            <span className="font-serif text-2xl text-dourado sm:text-3xl">
              {formatarBRL(experiencia.valor!)}
            </span>
            <button
              type="button"
              onClick={() => onPresentear(experiencia)}
              className="rounded-sm border border-creme/30 px-4 py-2 font-sans text-xs uppercase tracking-wider text-creme transition-colors hover:border-dourado hover:bg-dourado/20 hover:text-dourado"
            >
              Presentear
            </button>
          </div>
        )}

        {/* Para contribuição livre — campo de valor embutido */}
        {isLivre && (
          <div className="mt-5">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-sm border border-dourado/40 bg-creme/10 px-3">
                <span className="font-serif text-lg text-dourado">R$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={valorLivre}
                  onChange={(e) => setValorLivre(e.target.value)}
                  placeholder="0,00"
                  aria-label="Valor da contribuição livre"
                  className="w-full bg-transparent px-2 py-2.5 font-serif text-lg text-creme placeholder:text-creme/40 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handlePresentearLivre}
                className="rounded-sm bg-terracotta px-5 py-2.5 font-sans text-xs uppercase tracking-wider text-creme transition-opacity hover:opacity-90"
              >
                Seguir
              </button>
            </div>
            {erroLivre && (
              <p className="mt-2 font-sans text-xs text-terracotta">
                {erroLivre}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
