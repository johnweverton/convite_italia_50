"use client";

import { useEffect, useState } from "react";
import { prazoEncerrado, mensagemPrazoEncerrado, linkWhatsappCerimonialista } from "@/lib/prazo";

type Estado =
  | { fase: "carregando" }
  | { fase: "erro"; mensagem: string }
  | {
      fase: "form";
      nomePrincipal: string;
      vagasExtras: number;
    }
  | { fase: "confirmado"; nomePrincipal: string; acompanhantes: string[] }
  | { fase: "enviado" };

export default function ConfirmarPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  const [nomes, setNomes] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/convites/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setEstado({ fase: "erro", mensagem: data.erro ?? "Convite não encontrado." });
          return;
        }
        if (data.status === "confirmado") {
          setEstado({
            fase: "confirmado",
            nomePrincipal: data.nomePrincipal,
            acompanhantes: data.acompanhantes ?? [],
          });
          return;
        }
        setEstado({
          fase: "form",
          nomePrincipal: data.nomePrincipal,
          vagasExtras: data.vagasExtras,
        });
        setNomes(new Array(data.vagasExtras).fill(""));
      })
      .catch(() => setEstado({ fase: "erro", mensagem: "Não foi possível carregar o convite." }));
  }, [token]);

  async function enviar() {
    setErroEnvio(null);
    setEnviando(true);
    const acompanhantes = nomes.map((n) => n.trim()).filter((n) => n.length > 0);
    try {
      const res = await fetch(`/api/convites/${token}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acompanhantes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroEnvio(data.erro ?? "Algo deu errado. Tente novamente.");
        setEnviando(false);
        return;
      }
      setEstado({ fase: "enviado" });
    } catch {
      setErroEnvio("Algo deu errado. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-creme px-6 py-12">
      <div className="w-full max-w-md rounded-sm border border-dourado/30 bg-white p-8 shadow-cena">
        {estado.fase === "carregando" && (
          <p className="text-center font-sans text-sepia/60">Carregando convite...</p>
        )}

        {estado.fase === "erro" && (
          <p className="text-center font-sans text-terracotta">{estado.mensagem}</p>
        )}

        {estado.fase === "confirmado" && (
          <div className="text-center">
            <h1 className="font-serif text-2xl text-sepia">Já confirmado</h1>
            <p className="mt-2 font-sans text-sm text-sepia/60">
              {estado.nomePrincipal} já informou quem vai junto:
            </p>
            <ul className="mt-4 space-y-1 font-sans text-sepia">
              {estado.acompanhantes.length === 0 && <li>Nenhum acompanhante.</li>}
              {estado.acompanhantes.map((nome) => (
                <li key={nome}>{nome}</li>
              ))}
            </ul>
            <p className="mt-4 font-sans text-xs text-sepia/50">
              Os ingressos foram enviados por e-mail.
            </p>
          </div>
        )}

        {estado.fase === "enviado" && (
          <div className="text-center">
            <h1 className="font-serif text-2xl text-sepia">Prontinho!</h1>
            <p className="mt-2 font-sans text-sm text-sepia/60">
              Os ingressos foram enviados para o seu e-mail.
            </p>
          </div>
        )}

        {estado.fase === "form" && prazoEncerrado() && (() => {
          const linkWhatsapp = linkWhatsappCerimonialista(
            `Olá! Sou ${estado.nomePrincipal} e preciso confirmar acompanhante, mas o prazo no site já encerrou. Pode me ajudar?`,
          );
          return (
            <div className="text-center">
              <h1 className="font-serif text-2xl text-sepia">Prazo encerrado</h1>
              <p className="mt-4 font-sans text-sm leading-relaxed text-sepia/80">
                {mensagemPrazoEncerrado}
              </p>
              {linkWhatsapp && (
                <a
                  href={linkWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-block rounded-sm bg-oliva px-8 py-4 font-sans text-sm uppercase tracking-wider text-creme transition-opacity hover:opacity-90"
                >
                  Falar com a cerimonialista no WhatsApp
                </a>
              )}
            </div>
          );
        })()}

        {estado.fase === "form" && !prazoEncerrado() && (
          <>
            <h1 className="font-serif text-2xl text-sepia">Olá, {estado.nomePrincipal.split(" ")[0]}</h1>
            <p className="mt-2 font-sans text-sm text-sepia/60">
              {estado.vagasExtras > 0
                ? `Você pode levar até ${estado.vagasExtras} pessoa${estado.vagasExtras > 1 ? "s" : ""}. Informe os nomes (deixe em branco o que não for usar):`
                : "Este convite não tem vagas extras."}
            </p>

            <div className="mt-6 space-y-3">
              {nomes.map((nome, i) => (
                <input
                  key={i}
                  type="text"
                  value={nome}
                  onChange={(e) => {
                    const proximo = [...nomes];
                    proximo[i] = e.target.value;
                    setNomes(proximo);
                  }}
                  placeholder={`Nome do acompanhante ${i + 1}`}
                  className="w-full rounded-sm border border-sepia/20 px-4 py-3 font-sans text-sepia placeholder:text-sepia/40 focus:border-terracotta focus:outline-none"
                />
              ))}
            </div>

            {erroEnvio && (
              <p className="mt-4 text-center font-sans text-sm text-terracotta">{erroEnvio}</p>
            )}

            <button
              type="button"
              onClick={enviar}
              disabled={enviando}
              className="mt-8 w-full rounded-sm bg-terracotta py-4 font-sans text-sm uppercase tracking-wider text-creme transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Confirmar"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
