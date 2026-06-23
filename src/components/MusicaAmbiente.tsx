"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, VolumeX } from "lucide-react";

/**
 * Player de música ambiente flutuante.
 * Tenta tocar automaticamente ao carregar a página. Se o navegador
 * bloquear (política de autoplay), escuta a primeira interação do
 * usuário (scroll, toque, clique) e inicia nesse momento.
 */
export default function MusicaAmbiente() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mutado, setMutado] = useState(false);
  const [tocando, setTocando] = useState(false);

  useEffect(() => {
    const audio = new Audio("/audio/musica-ajustada.mp3");
    audio.loop = true;
    audio.volume = 1.0; // O arquivo já tem o volume reduzido
    audio.preload = "auto";
    audioRef.current = audio;

    // Tenta autoplay imediato
    audio.play().then(() => {
      setTocando(true);
    }).catch(() => {
      // Navegador bloqueou autoplay — escuta a primeira interação
      const eventos = ["scroll", "click", "touchstart", "keydown"];
      const handler = () => {
        audio.play().then(() => setTocando(true)).catch(() => {});
        eventos.forEach((e) => window.removeEventListener(e, handler));
      };
      eventos.forEach((e) => window.addEventListener(e, handler, { once: false, passive: true }));
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const alternarMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.muted || audio.paused) {
      audio.muted = false;
      audio.volume = 0.05;
      audio.play().then(() => {
        setMutado(false);
        setTocando(true);
      }).catch(() => {});
    } else {
      audio.pause(); // Pausamos em vez de mutar para garantir no iOS
      setMutado(true);
      setTocando(false);
    }
  }, []);

  return (
    <motion.button
      type="button"
      onClick={alternarMute}
      aria-label={mutado ? "Ativar música" : "Mutar música"}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 3 }}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-dourado/30 bg-sepia/80 text-creme shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-colors hover:bg-sepia"
    >
      <AnimatePresence mode="wait">
        {!mutado && tocando ? (
          <motion.span
            key="on"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.25 }}
          >
            <Music className="h-5 w-5 animate-pulse text-dourado" />
          </motion.span>
        ) : (
          <motion.span
            key="off"
            initial={{ scale: 0, rotate: 90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -90 }}
            transition={{ duration: 0.25 }}
          >
            <VolumeX className="h-5 w-5 text-creme/60" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
