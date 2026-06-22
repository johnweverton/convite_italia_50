"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import { Check, Copy, CreditCard, Heart, QrCode, X } from "lucide-react";
import type { Experiencia } from "@/lib/experiencias";
import { gerarPixPayload } from "@/lib/pix";
import { formatarBRL } from "@/lib/utils";

type Props = {
  aberto: boolean;
  experiencia: Experiencia | null;
  valor: number | null;
  onFechar: () => void;
};

type Metodo = "pix" | "cartao";
type Fase = "escolha" | "enviando" | "concluido";

const PIX_CHAVE = process.env.NEXT_PUBLIC_PIX_CHAVE ?? "";
const PIX_NOME = process.env.NEXT_PUBLIC_PIX_NOME ?? "Carmem Glisse Cavalcante";
const PIX_CIDADE = process.env.NEXT_PUBLIC_PIX_CIDADE ?? "FORTALEZA";
const LINK_CARTAO = process.env.NEXT_PUBLIC_LINK_CARTAO ?? "";

export default function Pagamento({ aberto, experiencia, valor, onFechar }: Props) {
  const [metodo, setMetodo] = useState<Metodo>("pix");
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [fase, setFase] = useState<Fase>("escolha");
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Payload Pix para o valor desta contribuição
  const pixPayload = useMemo(() => {
    if (!PIX_CHAVE) return "";
    return gerarPixPayload({
      chave: PIX_CHAVE,
      nome: PIX_NOME,
      cidade: PIX_CIDADE,
      valor: valor ?? undefined,
      txid: experiencia?.id?.toUpperCase().slice(0, 25),
    });
  }, [valor, experiencia]);

  // Gera o QR sempre que o payload mudar
  useEffect(() => {
    if (!pixPayload) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(pixPayload, { margin: 1, width: 320 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [pixPayload]);

  // Reseta o estado a cada abertura
  useEffect(() => {
    if (aberto) {
      setFase("escolha");
      setMetodo("pix");
      setErro(null);
      setCopiado(false);
    }
  }, [aberto]);

  if (!experiencia) return null;

  async function copiarChave(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      setErro("Não foi possível copiar. Selecione e copie manualmente.");
    }
  }

  async function registrar() {
    if (nome.trim().length < 2) {
      setErro("Diga seu nome, por favor.");
      return;
    }
    setErro(null);
    setFase("enviando");
    try {
      const res = await fetch("/api/contribuicoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          experiencia: experiencia!.titulo,
          valor,
          metodo,
          mensagem,
        }),
      });
      if (!res.ok) throw new Error();
      setFase("concluido");
    } catch {
      setErro("Algo deu errado ao registrar. Tente novamente.");
      setFase("escolha");
    }
  }

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-sepia/70 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Presentear: ${experiencia.titulo}`}
            className="relative max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-sm border border-dourado/40 bg-creme p-8 shadow-cena"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              className="absolute right-4 top-4 text-sepia/50 transition-colors hover:text-sepia"
            >
              <X className="h-5 w-5" />
            </button>

            {fase === "concluido" ? (
              <div className="py-10 text-center">
                <Heart className="mx-auto h-12 w-12 text-terracotta" />
                <h3 className="mt-6 font-serif text-3xl text-sepia">
                  Que presente lindo.
                </h3>
                <p className="mx-auto mt-4 max-w-sm font-sans text-sepia/70">
                  Obrigada de coração por caminhar comigo nessa viagem,{" "}
                  {nome.split(" ")[0]}. Vou levar você comigo em cada cantinho
                  da Itália.
                </p>
                <button
                  type="button"
                  onClick={onFechar}
                  className="mt-8 rounded-sm bg-terracotta px-8 py-3 font-sans text-sm uppercase tracking-wider text-creme"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-terracotta">
                  🇮🇹 {experiencia.cidade}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-sepia">
                  {experiencia.titulo}
                </h3>
                <p className="mt-1 font-serif text-3xl text-terracotta">
                  {valor !== null ? formatarBRL(valor) : "Valor livre"}
                </p>

                {/* Identificação */}
                <div className="mt-6 space-y-3">
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    aria-label="Seu nome"
                    className="w-full rounded-sm border border-sepia/20 bg-white px-4 py-3 font-sans text-sepia placeholder:text-sepia/40 focus:border-terracotta focus:outline-none"
                  />
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Um recado para a Carmem (opcional)"
                    rows={2}
                    aria-label="Mensagem opcional"
                    className="w-full resize-none rounded-sm border border-sepia/20 bg-white px-4 py-3 font-sans text-sepia placeholder:text-sepia/40 focus:border-terracotta focus:outline-none"
                  />
                </div>

                {/* Seletor de método */}
                <div className="mt-6 grid grid-cols-2 gap-2 rounded-sm bg-sepia/5 p-1">
                  <button
                    type="button"
                    onClick={() => setMetodo("pix")}
                    className={`flex items-center justify-center gap-2 rounded-sm py-2 font-sans text-sm transition-colors ${
                      metodo === "pix"
                        ? "bg-terracotta text-creme"
                        : "text-sepia/70"
                    }`}
                  >
                    <QrCode className="h-4 w-4" /> Pix
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodo("cartao")}
                    className={`flex items-center justify-center gap-2 rounded-sm py-2 font-sans text-sm transition-colors ${
                      metodo === "cartao"
                        ? "bg-terracotta text-creme"
                        : "text-sepia/70"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" /> Cartão
                  </button>
                </div>

                {/* Conteúdo do método */}
                {metodo === "pix" ? (
                  <div className="mt-6 text-center">
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrDataUrl}
                        alt="QR Code Pix"
                        className="mx-auto h-48 w-48 rounded-sm border border-sepia/10"
                      />
                    ) : (
                      <p className="rounded-sm bg-sepia/5 p-4 text-sm text-sepia/60">
                        Configure a chave Pix em NEXT_PUBLIC_PIX_CHAVE para gerar
                        o QR Code.
                      </p>
                    )}

                    {PIX_CHAVE && (
                      <button
                        type="button"
                        onClick={() => copiarChave(pixPayload)}
                        className="mx-auto mt-4 flex items-center gap-2 rounded-sm border border-sepia/30 px-4 py-2 font-sans text-sm text-sepia transition-colors hover:border-terracotta"
                      >
                        {copiado ? (
                          <>
                            <Check className="h-4 w-4 text-oliva" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" /> Copiar Pix copia e cola
                          </>
                        )}
                      </button>
                    )}
                    <p className="mt-3 font-sans text-xs text-sepia/50">
                      Chave: {PIX_CHAVE || "(não configurada)"}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 text-center">
                    {LINK_CARTAO ? (
                      <a
                        href={LINK_CARTAO}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-sm bg-sepia px-6 py-3 font-sans text-sm uppercase tracking-wider text-creme transition-opacity hover:opacity-90"
                      >
                        <CreditCard className="h-4 w-4" /> Pagar com cartão
                      </a>
                    ) : (
                      <p className="rounded-sm bg-sepia/5 p-4 text-sm text-sepia/60">
                        Configure o link de pagamento em NEXT_PUBLIC_LINK_CARTAO.
                      </p>
                    )}
                    <p className="mt-3 font-sans text-xs text-sepia/50">
                      Você será levado a uma página de pagamento segura em uma
                      nova aba.
                    </p>
                  </div>
                )}

                {erro && (
                  <p className="mt-4 text-center font-sans text-sm text-terracotta">
                    {erro}
                  </p>
                )}

                <button
                  type="button"
                  onClick={registrar}
                  disabled={fase === "enviando"}
                  className="mt-8 w-full rounded-sm bg-terracotta py-4 font-sans text-sm uppercase tracking-wider text-creme transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {fase === "enviando"
                    ? "Registrando..."
                    : "Já enviei meu presente"}
                </button>
                <p className="mt-3 text-center font-sans text-xs text-sepia/50">
                  Assim a Carmem fica sabendo do seu carinho. O pagamento
                  acontece direto para ela, sem intermediários.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
