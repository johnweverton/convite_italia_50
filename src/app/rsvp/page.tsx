"use client";

import { useState } from "react";
import { RsvpPublicoSchema, type RsvpPublicoInput } from "@/lib/schemas";

const RESTRICOES = [
  "Nenhuma",
  "Vegetariano",
  "Vegano",
  "Intolerante a glúten",
  "Intolerante a lactose",
];

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (presenca === null) {
      setErro("Informe se você irá comparecer.");
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
        <div className="w-full max-w-lg rounded-sm border border-dourado/30 bg-white p-10 text-center shadow-cena">
          <h1 className="font-serif text-3xl text-sepia">Muito obrigado!</h1>
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
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-creme px-6 py-12">
      <div className="mx-auto w-full max-w-lg rounded-sm border border-dourado/30 bg-white p-8 shadow-cena sm:p-10">
        <h1 className="text-center font-serif text-3xl text-sepia">Confirme sua presença</h1>
        <p className="mt-2 text-center font-sans text-sm text-sepia/60">
          Por favor, preencha o formulário abaixo até o dia 10 de Setembro.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block font-serif text-lg text-sepia">Nome Completo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-2 w-full border-b border-sepia/20 bg-transparent py-2 font-sans text-sepia placeholder-sepia/30 focus:border-terracotta focus:outline-none"
              placeholder="Como está no seu convite"
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

          <div>
            <label className="block font-serif text-lg text-sepia">Você confirma sua presença no evento?</label>
            <div className="mt-3 flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 font-sans text-sepia">
                <input
                  type="radio"
                  name="presenca"
                  checked={presenca === true}
                  onChange={() => setPresenca(true)}
                  className="h-4 w-4 accent-terracotta"
                />
                Sim, eu vou!
              </label>
              <label className="flex cursor-pointer items-center gap-2 font-sans text-sepia">
                <input
                  type="radio"
                  name="presenca"
                  checked={presenca === false}
                  onChange={() => setPresenca(false)}
                  className="h-4 w-4 accent-terracotta"
                />
                Infelizmente não poderei ir
              </label>
            </div>
          </div>

          {presenca === true && (
            <>
              <div>
                <label className="block font-serif text-lg text-sepia">Nomes dos Acompanhantes</label>
                <p className="mb-2 font-sans text-xs text-sepia/60">
                  Adicione os nomes completos de quem irá com você (máximo 5).
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
            </>
          )}

          <div>
            <label className="block font-serif text-lg text-sepia">Deixe uma mensagem para a aniversariante</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-none border-b border-sepia/20 bg-transparent py-2 font-sans text-sepia placeholder-sepia/30 focus:border-terracotta focus:outline-none"
              placeholder="Opcional..."
            />
          </div>

          {erro && (
            <p className="rounded-sm bg-terracotta/10 p-3 text-center font-sans text-sm text-terracotta">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-sm bg-terracotta py-4 font-sans text-sm uppercase tracking-wider text-creme transition-colors hover:bg-terracotta/90 disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar Resposta"}
          </button>
        </form>
      </div>
    </main>
  );
}
