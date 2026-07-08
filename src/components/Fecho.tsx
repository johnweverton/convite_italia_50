"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Fecho() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Animação atrelada ao scroll deste contêiner
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  // As mãos começam afastadas (X) e se juntam no centro (0)
  const xLeft = useTransform(scrollYProgress, [0.3, 0.7], ["-15%", "0%"]);
  const xRight = useTransform(scrollYProgress, [0.3, 0.7], ["15%", "0%"]);
  
  // A assinatura aparece no final, quando as mãos se tocam
  const opacitySignature = useTransform(scrollYProgress, [0.7, 0.9], [0, 1]);
  const ySignature = useTransform(scrollYProgress, [0.7, 0.9], [20, 0]);

  return (
    <section ref={containerRef} className="relative h-[150vh] bg-[#fdfaf6]">
      {/* Container sticky para manter a cena na tela enquanto o usuário scrolla a seção */}
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        
        {/* Contêiner principal da pintura dividido ao meio */}
        <div className="relative flex h-[30vh] md:h-[40vh] w-full max-w-5xl overflow-hidden px-4 md:px-8">
          
          {/* Metade Esquerda (Adão) */}
          <motion.div 
            style={{ x: xLeft }}
            className="relative h-full w-1/2 overflow-hidden"
          >
            <div className="absolute inset-y-0 left-0 w-[200%] bg-[url('/cenas/criacao-adao.png')] bg-contain bg-center bg-no-repeat" />
          </motion.div>

          {/* Metade Direita (Deus) */}
          <motion.div 
            style={{ x: xRight }}
            className="relative h-full w-1/2 overflow-hidden"
          >
            <div className="absolute inset-y-0 right-0 w-[200%] bg-[url('/cenas/criacao-adao.png')] bg-contain bg-center bg-no-repeat" />
          </motion.div>
          
        </div>

        {/* Assinatura */}
        <motion.div 
          style={{ opacity: opacitySignature, y: ySignature }} 
          className="mt-8 md:mt-12 text-center px-4"
        >
          <p className="font-roman text-xs md:text-sm text-sepia/50 tracking-[0.3em] uppercase mb-4">
            Com carinho,
          </p>
          <h2 className="font-roman-script text-5xl md:text-7xl text-terracotta leading-none">
            Carmem Cavalcante
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
