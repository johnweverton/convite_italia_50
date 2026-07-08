import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta "Grand Tour" — afrescos, mármore e pôr do sol toscano
        terracotta: "#B5532A",
        travertino: "#F4ECE0",
        oliva: "#5A6B4A",
        dourado: "#C9A24B",
        sepia: "#2E2218",
        creme: "#FBF7EF",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        italiana: ["var(--font-italiana)", "Georgia", "serif"],
        roman: ["var(--font-roman)", "Georgia", "serif"],
        "roman-script": ["var(--font-roman-script)", "cursive"],
        assinatura: ["var(--font-assinatura)", "cursive"],
      },
      boxShadow: {
        ouro: "0 10px 40px -12px rgba(201, 162, 75, 0.45)",
        cena: "0 24px 60px -20px rgba(46, 34, 24, 0.35)",
      },
      backgroundImage: {
        "grao-papel":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scroll-hint": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.5" },
          "50%": { transform: "translateY(8px)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.9s ease-out both",
        "scroll-hint": "scroll-hint 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
