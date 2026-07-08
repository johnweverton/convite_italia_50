"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Fecho() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  // Animações 3D de Adão (Esquerda)
  const xLeft = useTransform(scrollYProgress, [0.3, 0.7], ["-35%", "-3%"]);
  const zLeft = useTransform(scrollYProgress, [0.3, 0.7], [-300, 0]);
  const rotateYLeft = useTransform(scrollYProgress, [0.3, 0.7], [20, 0]);

  // Animações 3D de Deus (Direita)
  const xRight = useTransform(scrollYProgress, [0.3, 0.7], ["35%", "3%"]);
  const zRight = useTransform(scrollYProgress, [0.3, 0.7], [-300, 0]);
  const rotateYRight = useTransform(scrollYProgress, [0.3, 0.7], [-20, 0]);
  
  // A assinatura aparece no final, sutil
  const opacitySignature = useTransform(scrollYProgress, [0.75, 0.95], [0, 1]);
  const scaleSignature = useTransform(scrollYProgress, [0.75, 0.95], [0.9, 1]);

  return (
    <section ref={containerRef} className="relative h-[150vh] bg-creme">
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden perspective-[1000px]">
        
        {/* Contêiner principal 3D */}
        <div 
          className="relative flex h-[35vh] md:h-[45vh] w-full max-w-5xl px-4 md:px-8"
          style={{ transformStyle: "preserve-3d" }}
        >
          
          {/* Metade Esquerda (Adão) */}
          <motion.div 
            style={{ 
              x: xLeft, 
              z: zLeft,
              rotateY: rotateYLeft,
            }}
            className="relative h-full w-1/2"
          >
            {/* Máscara radial que foca nos dedos (100% à direita) e desaparece para a esquerda */}
            <div 
              className="absolute inset-0"
              style={{
                WebkitMaskImage: "radial-gradient(circle at 100% 50%, rgba(0,0,0,1) 5%, rgba(0,0,0,0) 80%)",
                maskImage: "radial-gradient(circle at 100% 50%, rgba(0,0,0,1) 5%, rgba(0,0,0,0) 80%)"
              }}
            >
              <div className="absolute inset-y-0 left-0 w-[200%] bg-[url('/cenas/criacao-adao.png')] bg-contain bg-center bg-no-repeat opacity-90" />
            </div>
          </motion.div>

          {/* Metade Direita (Deus) */}
          <motion.div 
            style={{ 
              x: xRight, 
              z: zRight,
              rotateY: rotateYRight,
            }}
            className="relative h-full w-1/2"
          >
            {/* Máscara radial que foca nos dedos (0% à esquerda) e desaparece para a direita */}
            <div 
              className="absolute inset-0"
              style={{
                WebkitMaskImage: "radial-gradient(circle at 0% 50%, rgba(0,0,0,1) 5%, rgba(0,0,0,0) 80%)",
                maskImage: "radial-gradient(circle at 0% 50%, rgba(0,0,0,1) 5%, rgba(0,0,0,0) 80%)"
              }}
            >
              <div className="absolute inset-y-0 right-0 w-[200%] bg-[url('/cenas/criacao-adao.png')] bg-contain bg-center bg-no-repeat opacity-90" />
            </div>
          </motion.div>
          
        </div>

        {/* Assinatura Menor e Autêntica */}
        <motion.div 
          style={{ opacity: opacitySignature, scale: scaleSignature }} 
          className="mt-8 md:mt-12 text-center px-4"
        >
          <h2 className="font-assinatura text-5xl md:text-6xl text-sepia/80 tracking-wide">
            Carmem Cavalcante
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
