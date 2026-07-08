"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Fecho() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  // Animações 3D de Adão (Esquerda) - Começa totalmente fora da tela
  const xLeft = useTransform(scrollYProgress, [0.3, 0.7], ["-100vw", "0vw"]);
  const opacityArms = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);

  // Animações 3D de Deus (Direita) - Começa totalmente fora da tela
  const xRight = useTransform(scrollYProgress, [0.3, 0.7], ["100vw", "0vw"]);
  
  // Assinatura
  const opacitySignature = useTransform(scrollYProgress, [0.75, 0.95], [0, 1]);
  const scaleSignature = useTransform(scrollYProgress, [0.75, 0.95], [0.9, 1]);

  return (
    <section ref={containerRef} className="relative h-[150vh] bg-creme">
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        
        {/* Contêiner dos braços soltos - 3D e paralaxe */}
        <div className="relative flex justify-between items-center h-[30vh] md:h-[45vh] w-full max-w-6xl px-4 md:px-8">
          
          {/* Metade Esquerda (Adão) */}
          <motion.div 
            style={{ 
              x: xLeft, 
              opacity: opacityArms,
            }}
            className="absolute left-0 h-full w-[46%] flex items-center justify-start"
          >
            {/* O braço espelhado para atuar como o braço esquerdo vindo da borda */}
            <img 
              src="/cenas/braco.png" 
              alt="Mão esquerda" 
              className="w-full h-full object-contain object-left scale-x-[-1] drop-shadow-2xl"
            />
          </motion.div>

          {/* Metade Direita (Deus) */}
          <motion.div 
            style={{ 
              x: xRight, 
              opacity: opacityArms,
            }}
            className="absolute right-0 h-full w-[46%] flex items-center justify-end"
          >
            <img 
              src="/cenas/braco.png" 
              alt="Mão direita" 
              className="w-full h-full object-contain object-right drop-shadow-2xl"
            />
          </motion.div>
          
        </div>

        {/* Assinatura Menor e Autêntica */}
        <motion.div 
          style={{ opacity: opacitySignature, scale: scaleSignature }} 
          className="mt-8 md:mt-16 text-center px-4"
        >
          <h2 className="font-assinatura text-4xl md:text-6xl text-sepia/80 tracking-wide">
            Carmem Cavalcante
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
