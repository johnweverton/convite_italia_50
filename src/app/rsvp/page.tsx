"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { RsvpPublicoSchema, type RsvpPublicoInput } from "@/lib/schemas";

const RESTRICOES = [
  "Nenhuma",
  "Vegetariano",
  "Vegano",
  "Intolerante a glúten",
  "Intolerante a lactose",
];

type Passo = "presenca" | "dados" | "acompanhantes" | "restricao" | "mensagem";

const variantesPasso = {
  entra: (direcao: number) => ({ opacity: 0, x: direcao > 0 ? 36 : -36 }),
  centro: { opacity: 1, x: 0 },
  sai: (direcao: number) => ({ opacity: 0, x: direcao > 0 ? -36 : 36 }),
};

/** Eco da Capela Sistina ao fundo da página — as mãos de "A Criação de Adão", bem sutis. */
function FundoSistino() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <Image
        src="/cenas/maos-vetor.jpg"
        alt=""
        fill
        priority
        className="object-contain object-center opacity-[0.08] mix-blend-multiply sm:opacity-[0.1]"
      />
    </div>
  );
}

/** Uma face do bloco de assinatura (usada duas vezes para o efeito de moeda girando). */
function FaceAssinatura({ girada = false }: { girada?: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: girada ? "rotateY(180deg)" : "rotateY(0deg)",
      }}
    >
      <span className="font-assinatura text-4xl leading-none text-sepia/90 sm:text-5xl">
        Carmem Cavalcante
      </span>
      <span className="mt-3 font-sans text-[10px] font-light uppercase tracking-[0.35em] text-sepia/50 sm:text-xs">
        festa di 50 anni
      </span>
    </div>
  );
}

/** Assinatura da aniversariante girando como uma placa/moeda, ecoando o fecho do convite. */
function Medalhao() {
  return (
    <div className="mx-auto flex flex-col items-center">
      <div className="relative h-24 w-full sm:h-28" style={{ perspective: "1400px" }}>
        <div
          className="animate-girar-moeda relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          <FaceAssinatura />
          <FaceAssinatura girada />
        </div>
      </div>
      <div className="filete-ouro mt-2 w-16" />
    </div>
  );
}

export default function RsvpPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [presenca, setPresenca] = useState<boolean | null>(null);
  const [acompanhantes, setAcompanhantes] = useState<string[]>([]);
  const [restricaoAlimentar, setRestricaoAlimentar] = useState<string[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [passo, setPasso] = useState<Passo>("presenca");
  const [direcao, setDirecao] = useState(1);

  const passos: Passo[] =
    presenca === true
      ? ["presenca", "dados", "acompanhantes", "restricao", "mensagem"]
      : ["presenca", "dados", "mensagem"];

  const indiceAtual = passos.indexOf(passo);
  const total = passos.length;

  const irPara = (destino: Passo, dir: number) => {
    setErro(null);
    setDirecao(dir);
    setPasso(destino);
  };

  const avancar = () => {
    const idx = passos.indexOf(passo);
    if (idx < passos.length - 1) irPara(passos[idx + 1], 1);
  };

  const voltar = () => {
    const idx = passos.indexOf(passo);
    if (idx > 0) irPara(passos[idx - 1], -1);
  };

  const escolherPresenca = (valor: boolean) => {
    setPresenca(valor);
    irPara("dados", 1);
  };

  const validarDados = () => {
    if (nome.trim().length < 2) {
      setErro("Diga seu nome completo.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro("Informe um e-mail válido.");
      return false;
    }
    return true;
  };

  const onAvancarDados = () => {
    if (validarDados()) avancar();
  };

  const toggleRestricao = (r: string) => {
    setRestricaoAlimentar((prev) => {
      if (r === "Nenhuma") {
        return prev.includes("Nenhuma") ? [] : ["Nenhuma"];
      }
      const novo = prev.filter((item) => item !== "Nenhuma");
      return novo.includes(r) ? novo.filter((item) => item !== r) : [...novo, r];
    });
  };

  const addAcompanhante = () => {
    if (acompanhantes.length < 5) {
      setAcompanhantes([...acompanhantes, ""]);
    }
  };

  const removeAcompanhante = (index: number) => {
    const novo = [...acompanhantes];
    novo.splice(index, 1);
    setAcompanhantes(novo);
  };

  const updateAcompanhante = (index: number, valor: string) => {
    const novo = [...acompanhantes];
    novo[index] = valor;
    setAcompanhantes(novo);
  };

  const onSubmit = async () => {
    setErro(null);

    const data = {
      nome,
      email,
      presenca: presenca ?? false,
      acompanhantes: acompanhantes.filter((a) => a.trim() !== ""),
      restricao_alimentar: restricaoAlimentar,
      mensagem,
    };

    const validacao = RsvpPublicoSchema.safeParse(data);
    if (!validacao.success) {
      const primeiroErro = validacao.error.errors[0];
      setErro(primeiroErro.message);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validacao.data),
      });

      const body = await res.json();
      if (!res.ok) {
        setErro(body.erro || "Ocorreu um erro ao enviar.");
      } else {
        setSucesso(true);
      }
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setEnviando(false);
    }
  };

  if (sucesso) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-creme px-6 py-12">
        <div className="relative w-full max-w-lg overflow-hidden rounded-sm border border-dourado/30 bg-white p-10 text-center shadow-cena">
          <FundoSistino />
          <div className="relative z-10">
            <Medalhao />
            <h1 className="mt-6 font-serif text-3xl text-sepia">Muito obrigado!</h1>
            <p className="mt-4 font-sans text-base leading-relaxed text-sepia/80">
              {presenca
                ? "Sua presença foi confirmada com sucesso! Você receberá os ingressos no seu e-mail em instantes."
                : "Agradecemos por nos avisar. Sentiremos muito a sua falta!"}
            </p>
            {presenca && (
              <p className="mt-2 font-sans text-sm text-terracotta">
                Não esqueça de verificar sua caixa de spam ou lixo eletrônico.
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-creme px-6 py-12">
      <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-sm border border-dourado/30 bg-white p-8 shadow-cena sm:p-10">
        <FundoSistino />
        <div className="relative z-10">
        <Medalhao />
        <h1 className="mt-6 text-center font-serif text-3xl text-sepia">Confirme sua presença</h1>

        <div className="mt-6">
          <div className="h-[2px] w-full overflow-hidden rounded-full bg-sepia/10">
            <motion.div
              className="h-full bg-dourado"
              animate={{ width: `${((indiceAtual + 1) / total) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-center font-sans text-[11px] uppercase tracking-[0.2em] text-sepia/40">
            Passo {indiceAtual + 1} de {total}
          </p>
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait" custom={direcao}>
            <motion.div
              key={passo}
              custom={direcao}
              variants={variantesPasso}
              initial="entra"
              animate="centro"
              exit="sai"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {passo === "presenca" && (
                <div>
                  <label className="block text-center font-serif text-2xl text-sepia">
                    Você confirma sua presença na festa?
                  </label>
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => escolherPresenca(true)}
                      className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-sm border border-sepia/15 bg-white/60 px-6 py-10 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-ouro"
                    >
                      <span className="absolute inset-x-0 top-0 h-px origin-center scale-x-0 bg-dourado transition-transform duration-500 group-hover:scale-x-100" />
                      <span className="font-serif text-xl text-sepia sm:text-2xl">Sim, eu vou</span>
                      <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-sepia/40">
                        Confirmar presença
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => escolherPresenca(false)}
                      className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-sm border border-sepia/15 bg-white/60 px-6 py-10 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-sepia/30 hover:shadow-cena"
                    >
                      <span className="absolute inset-x-0 top-0 h-px origin-center scale-x-0 bg-sepia/30 transition-transform duration-500 group-hover:scale-x-100" />
                      <span className="font-serif text-xl text-sepia sm:text-2xl">Não poderei ir</span>
                      <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-sepia/40">
                        Avisar ausência
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {passo === "dados" && (
                <div className="space-y-6">
                  <div>
                    <label className="block font-serif text-lg text-sepia">Nome Completo</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="mt-2 w-full border-b border-sepia/20 bg-transparent py-2 font-sans text-sepia placeholder-sepia/30 focus:border-terracotta focus:outline-none"
                      placeholder="Como está no seu convite"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block font-serif text-lg text-sepia">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 w-full border-b border-sepia/20 bg-transparent py-2 font-sans text-sepia placeholder-sepia/30 focus:border-terracotta focus:outline-none"
                      placeholder="Onde enviaremos os ingressos"
                    />
                  </div>
                </div>
              )}

              {passo === "acompanhantes" && (
                <div>
                  <label className="block font-serif text-lg text-sepia">Nomes dos Acompanhantes</label>
                  <p className="mb-2 font-sans text-xs text-sepia/60">
                    Adicione os nomes completos de quem irá com você.
                  </p>
                  {acompanhantes.map((acomp, index) => (
                    <div key={index} className="mb-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={acomp}
                        onChange={(e) => updateAcompanhante(index, e.target.value)}
                        className="w-full border-b border-sepia/20 bg-transparent py-2 font-sans text-sepia placeholder-sepia/30 focus:border-terracotta focus:outline-none"
                        placeholder={`Acompanhante ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeAcompanhante(index)}
                        className="p-2 text-sepia/40 hover:text-terracotta"
                        title="Remover"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {acompanhantes.length < 5 && (
                    <button
                      type="button"
                      onClick={addAcompanhante}
                      className="font-sans text-sm text-terracotta hover:underline"
                    >
                      + Adicionar acompanhante
                    </button>
                  )}
                </div>
              )}

              {passo === "restricao" && (
                <div>
                  <label className="block font-serif text-lg text-sepia">Possui alguma restrição alimentar?</label>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {RESTRICOES.map((r) => (
                      <label key={r} className="flex cursor-pointer items-center gap-2 font-sans text-sm text-sepia">
                        <input
                          type="checkbox"
                          checked={restricaoAlimentar.includes(r)}
                          onChange={() => toggleRestricao(r)}
                          className="h-4 w-4 rounded-sm border-sepia/20 accent-terracotta"
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {passo === "mensagem" && (
                <div>
                  <label className="block font-serif text-lg text-sepia">
                    Deixe uma mensagem para a aniversariante
                  </label>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    rows={3}
                    className="mt-2 w-full resize-none border-b border-sepia/20 bg-transparent py-2 font-sans text-sepia placeholder-sepia/30 focus:border-terracotta focus:outline-none"
                    placeholder="Opcional..."
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {erro && (
            <p className="mt-6 rounded-sm bg-terracotta/10 p-3 text-center font-sans text-sm text-terracotta">
              {erro}
            </p>
          )}

          {passo !== "presenca" && (
            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={voltar}
                className="font-sans text-xs uppercase tracking-[0.15em] text-sepia/50 transition-colors hover:text-terracotta"
              >
                ← Voltar
              </button>

              {passo === "mensagem" ? (
                <button
                  type="button"
                  disabled={enviando}
                  onClick={onSubmit}
                  className="rounded-sm bg-terracotta px-10 py-4 font-sans text-sm uppercase tracking-wider text-creme transition-colors hover:bg-terracotta/90 disabled:opacity-50"
                >
                  {enviando ? "Enviando..." : "Enviar Resposta"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={passo === "dados" ? onAvancarDados : avancar}
                  className="rounded-sm bg-terracotta px-10 py-3 font-sans text-sm uppercase tracking-wider text-creme transition-colors hover:bg-terracotta/90"
                >
                  Continuar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </main>
  );
}
