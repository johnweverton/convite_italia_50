import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Italiana } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Fonte elegante para o nome da Carmem
const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italiana",
  display: "swap",
});

// Roman Pride (demo, auto-hospedada) — título clássico do Hero
const romanPride = localFont({
  src: [
    { path: "../fonts/roman-pride-serif.otf", weight: "400", style: "normal" },
  ],
  variable: "--font-roman",
  display: "swap",
});

const romanPrideScript = localFont({
  src: [
    { path: "../fonts/roman-pride-script.otf", weight: "400", style: "normal" },
  ],
  variable: "--font-roman-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carmem na Itália 2026 · 50 Anos",
  description:
    "A vida é feita de ciclos. E alguns merecem ser celebrados com grandeza. Participe do próximo capítulo: a Itália.",
  openGraph: {
    title: "Carmem na Itália 2026 · 50 Anos",
    description:
      "Algumas experiências que farão parte dessa jornada. Sua presença é o maior presente.",
    type: "website",
    locale: "pt_BR",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${inter.variable} ${italiana.variable} ${romanPride.variable} ${romanPrideScript.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
