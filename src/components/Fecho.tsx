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
  const zLeft = useTransform(scrollYProgress, [0.3, 0.7], [-500, 0]);
  const rotateYLeft = useTransform(scrollYProgress, [0.3, 0.7], [30, 0]);

  // Animações 3D de Deus (Direita) - Começa totalmente fora da tela
  const xRight = useTransform(scrollYProgress, [0.3, 0.7], ["100vw", "0vw"]);
  const zRight = useTransform(scrollYProgress, [0.3, 0.7], [-500, 0]);
  const rotateYRight = useTransform(scrollYProgress, [0.3, 0.7], [-30, 0]);
  
  // Assinatura
  const opacitySignature = useTransform(scrollYProgress, [0.75, 0.95], [0, 1]);
  const scaleSignature = useTransform(scrollYProgress, [0.75, 0.95], [0.9, 1]);

  return (
    <section ref={containerRef} className="relative h-[150vh] bg-creme">
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden perspective-[1200px]">
        
        {/* Contêiner principal 3D com mix-blend-mode para "apagar" o fundo bege da imagem */}
        <div 
          className="relative flex justify-between h-[30vh] md:h-[45vh] w-full max-w-5xl px-4 md:px-8 mix-blend-multiply"
          style={{ transformStyle: "preserve-3d" }}
        >
          
          {/* Metade Esquerda (Adão) */}
          <motion.div 
            style={{ 
              x: xLeft, 
              z: zLeft,
              rotateY: rotateYLeft,
            }}
            // w-[46%] garante que deixamos os 8% do meio (onde estaria o erro do corte) invisíveis
            className="relative h-full w-[46%]"
          >
            {/* bg-[length:217%] compensa o w-[46%] para que a imagem inteira tenha o tamanho do contêiner pai */}
            <div className="absolute inset-0 bg-[url('/cenas/maos-vetor.jpg')] bg-[length:217%_auto] bg-left bg-no-repeat" />
          </motion.div>

          {/* Metade Direita (Deus) */}
          <motion.div 
            style={{ 
              x: xRight, 
              z: zRight,
              rotateY: rotateYRight,
            }}
            className="relative h-full w-[46%]"
          >
            <div className="absolute inset-0 bg-[url('/cenas/maos-vetor.jpg')] bg-[length:217%_auto] bg-right bg-no-repeat" />
          </motion.div>
          
        </div>

        {/* Assinatura Menor e Autêntica */}
        <motion.div 
          style={{ opacity: opacitySignature, scale: scaleSignature }} 
          className="mt-8 md:mt-12 text-center px-4"
        >
          <h2 className="font-assinatura text-4xl md:text-6xl text-sepia/80 tracking-wide">
            Carmem Cavalcante
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
