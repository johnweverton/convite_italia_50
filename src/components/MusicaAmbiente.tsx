"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, VolumeX } from "lucide-react";

/**
 * Player de música ambiente flutuante.
 * Começa pausado (navegadores bloqueiam autoplay com áudio).
 * O visitante pode ligar/desligar a música com um botão elegante
 * fixo no canto inferior direito da tela.
 */
export default function MusicaAmbiente() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tocando, setTocando] = useState(false);
  const [primeiroClique, setPrimeiroClique] = useState(true);

  useEffect(() => {
    const audio = new Audio("/audio/musica-baixada.m4a");
    audio.loop = true;
    audio.volume = 0.2;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const alternar = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (tocando) {
      audio.pause();
      setTocando(false);
    } else {
      audio.play().then(() => {
        setTocando(true);
        setPrimeiroClique(false);
      }).catch(() => {
        // Navegador bloqueou autoplay — ignora silenciosamente
      });
    }
  }, [tocando]);

  return (
    <>
      {/* Botão flutuante */}
      <motion.button
        type="button"
        onClick={alternar}
        aria-label={tocando ? "Pausar música" : "Tocar música"}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 3 }}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-dourado/30 bg-sepia/80 text-creme shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-colors hover:bg-sepia"
      >
        <AnimatePresence mode="wait">
          {tocando ? (
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

      {/* Tooltip de convite na primeira vez */}
      <AnimatePresence>
        {primeiroClique && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.4, delay: 4 }}
            className="fixed bottom-[22px] right-20 z-50 rounded-sm bg-sepia/90 px-3 py-2 font-sans text-xs text-creme/80 shadow-lg backdrop-blur-sm"
          >
            🎵 Toque para ouvir
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
