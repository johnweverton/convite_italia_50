"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, VolumeX } from "lucide-react";

/**
 * Player de música ambiente flutuante.
 * Usa Web Audio API para contornar o bloqueio de volume do iOS
 * (iOS Safari ignora audio.volume).
 */
export default function MusicaAmbiente() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [mutado, setMutado] = useState(false);
  const [tocando, setTocando] = useState(false);

  useEffect(() => {
    const audio = new Audio("/audio/musica-baixada.m4a");
    audio.loop = true;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    let gainNode: GainNode | null = null;
    let sourceNode: MediaElementAudioSourceNode | null = null;

    const setupWebAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        sourceNode = ctx.createMediaElementSource(audio);
        gainNode = ctx.createGain();
        gainNode.gain.value = 0.05; // 5% real de volume, funciona no iOS

        sourceNode.connect(gainNode);
        gainNode.connect(ctx.destination);
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };

    // Tenta autoplay imediato
    const tentarPlay = async () => {
      try {
        setupWebAudio();
        await audio.play();
        setTocando(true);
      } catch (err) {
        // Bloqueado pelo navegador — espera interação do usuário
        const eventos = ["click", "touchstart", "scroll", "keydown"];
        const handler = async () => {
          try {
            setupWebAudio();
            await audio.play();
            setTocando(true);
            eventos.forEach((e) => window.removeEventListener(e, handler));
          } catch (e) {}
        };
        eventos.forEach((e) => window.addEventListener(e, handler, { once: false, passive: true }));
      }
    };

    tentarPlay();

    return () => {
      audio.pause();
      audio.src = "";
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const alternarMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (mutado) {
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
      audio.play().then(() => {
        setMutado(false);
        setTocando(true);
      }).catch(() => {});
    } else {
      audio.pause();
      setMutado(true);
      setTocando(false);
    }
  }, [mutado]);

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
        {!mutado ? (
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
