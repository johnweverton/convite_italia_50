"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Fecho() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  // Assinatura e subtítulo aparecendo suavemente no final
  const opacityText = useTransform(scrollYProgress, [0.3, 0.7], [0, 1]);
  const scaleText = useTransform(scrollYProgress, [0.3, 0.7], [0.9, 1]);

  return (
    <section ref={containerRef} className="relative h-[100vh] bg-creme">
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        
        <motion.div 
          style={{ opacity: opacityText, scale: scaleText }} 
          className="text-center px-4"
        >
          <h2 className="font-assinatura text-5xl md:text-7xl text-sepia/90 tracking-wide mb-2">
            Carmem Cavalcante
          </h2>
          <p className="text-sm md:text-base tracking-[0.3em] uppercase text-sepia/60 font-light">
            festa di 50 anni
          </p>
        </motion.div>

      </div>
    </section>
  );
}
