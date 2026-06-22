import Reveal from "./Reveal";

/** Texto de agradecimento, na voz da Carmem. */
export default function Convite() {
  return (
    <section className="bg-grao-papel bg-creme px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-terracotta">
            L&rsquo;invito
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-10 font-serif text-3xl leading-snug text-sepia sm:text-4xl">
            A sua presença já é o meu maior presente.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-10 max-w-lg font-serif text-lg leading-[2] text-sepia/70 sm:text-xl">
            Para quem quiser fazer parte de um sonho
            <br />
            que eu carrego há tanto tempo,
            <br />
            separei algumas experiências
            <br />
            da minha próxima viagem à Itália.
          </p>
          <p className="mx-auto mt-6 max-w-lg font-serif text-lg leading-[2] text-sepia/70 sm:text-xl">
            Cada uma delas é um pedacinho dessa jornada,
            <br />
            e poder dividir isso com você
            <br />
            deixa tudo ainda mais bonito.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
