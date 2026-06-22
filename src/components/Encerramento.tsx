import Reveal from "./Reveal";

export default function Encerramento() {
  return (
    <footer className="relative overflow-hidden bg-sepia px-6 py-28 text-center text-creme">
      <div className="mx-auto max-w-xl">
        <Reveal>
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-dourado">
            Com gratidão
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 font-serif text-2xl italic leading-relaxed text-creme/90 sm:text-3xl">
            Obrigada de coração por celebrar comigo. Que Deus me permita viver
            cada um desses momentos, e que a gente possa brindar junto a tudo
            que ainda está por vir.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="mt-14 font-serif text-4xl text-dourado">Carmem</p>
          <p className="mt-2 font-sans text-xs uppercase tracking-[0.3em] text-creme/50">
            Itália 2026 · 50 Anos
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
