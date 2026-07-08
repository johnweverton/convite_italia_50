import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Italiana, Great_Vibes } from "next/font/google";
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

// Fonte de assinatura manuscrita realista
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-assinatura",
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
  title: "Festa di 50 Anni",
  description:
    "A vida é feita de ciclos. E alguns merecem ser celebrados com grandeza. Participe do próximo capítulo: a Itália.",
  openGraph: {
    title: "Festa di 50 Anni",
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
      className={`${cormorant.variable} ${inter.variable} ${italiana.variable} ${romanPride.variable} ${romanPrideScript.variable} ${greatVibes.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
