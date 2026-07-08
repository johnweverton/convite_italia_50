"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Html5Qrcode } from "html5-qrcode";

type Resultado =
  | { tipo: "ok"; nome: string }
  | { tipo: "duplicado"; nome: string }
  | { tipo: "invalido" };

const SCANNER_ID = "checkin-qr-reader";

/** Eco da Capela Sistina ao fundo (mesmo estilo do RSVP) */
function FundoSistino() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
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

export default function CheckinPage() {
  const [senha, setSenha] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  
  // Estados da câmera
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [permissaoNegada, setPermissaoNegada] = useState(false);
  const [iniciandoCamera, setIniciandoCamera] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processandoRef = useRef(false);

  // Inicializa a instância do Html5Qrcode apenas uma vez
  useEffect(() => {
    if (autorizado && !scannerRef.current) {
      scannerRef.current = new Html5Qrcode(SCANNER_ID);
    }
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [autorizado]);

  const iniciarCamera = async () => {
    if (!scannerRef.current) return;
    setIniciandoCamera(true);
    setPermissaoNegada(false);

    try {
      await scannerRef.current.start(
        { facingMode: "environment" }, // câmera traseira
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (processandoRef.current) return;
          processandoRef.current = true;

          // Pausa temporariamente para não ler de novo
          if (scannerRef.current?.isScanning) {
            scannerRef.current.pause();
          }

          try {
            const res = await fetch("/api/checkin", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-checkin-senha": senha,
              },
              body: JSON.stringify({ token: decodedText }),
            });
            const data = await res.json();

            if (res.ok) {
              setResultado({ tipo: "ok", nome: data.nome });
            } else if (res.status === 409) {
              setResultado({ tipo: "duplicado", nome: data.nome });
            } else {
              setResultado({ tipo: "invalido" });
            }
          } catch {
            setResultado({ tipo: "invalido" });
          }

          // Fecha o modal de resultado após 2.5s e retoma a leitura
          setTimeout(() => {
            setResultado(null);
            processandoRef.current = false;
            if (scannerRef.current?.getState() === 2) { // 2 = PAUSED
              scannerRef.current.resume();
            }
          }, 3000);
        },
        () => {
          // callback de erro de leitura ignorado (ocorre a todo frame que não tem QR)
        }
      );
      setCameraAtiva(true);
    } catch (err) {
      console.error(err);
      setPermissaoNegada(true);
    } finally {
      setIniciandoCamera(false);
    }
  };

  const pararCamera = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        setCameraAtiva(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!autorizado) {
    return (
      <main className="relative flex min-h-[100svh] items-center justify-center bg-creme px-6">
        <FundoSistino />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAutorizado(true);
          }}
          className="relative z-10 w-full max-w-sm rounded-sm border border-dourado/30 bg-white p-10 text-center shadow-cena"
        >
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-sepia/5">
            <svg className="h-6 w-6 text-sepia" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-sepia">Acesso da Portaria</h1>
          <p className="mt-2 font-sans text-xs text-sepia/60 leading-relaxed">
            Área restrita para a equipe de recepção do evento. Insira a senha fornecida para validar os ingressos.
          </p>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha de acesso"
            className="mt-8 w-full border-b border-sepia/20 bg-transparent py-2 text-center font-sans text-sepia placeholder-sepia/30 focus:border-terracotta focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="mt-8 w-full rounded-sm bg-terracotta py-4 font-sans text-sm uppercase tracking-wider text-creme transition-colors hover:bg-terracotta/90"
          >
            Acessar Sistema
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100svh] bg-creme px-6 py-10">
      <FundoSistino />
      <div className="relative z-10 mx-auto max-w-md">
        
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl text-sepia">Validação de Ingressos</h1>
          <p className="mt-2 font-sans text-sm text-sepia/60">
            Aponte a câmera para o QR code no celular ou papel do convidado.
          </p>
        </div>

        {/* Câmera / Instruções */}
        <div className="overflow-hidden rounded-sm border border-dourado/30 bg-white shadow-cena">
          <div id={SCANNER_ID} className="w-full bg-black/5" />

          {!cameraAtiva && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sepia/5">
                <svg className="h-8 w-8 text-sepia" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="mb-2 font-serif text-lg text-sepia">Câmera desativada</h2>
              <p className="mb-6 font-sans text-xs text-sepia/60">
                Para escanear os QR Codes, precisamos da sua permissão para usar a câmera do dispositivo.
              </p>
              
              {permissaoNegada && (
                <p className="mb-4 font-sans text-xs text-terracotta">
                  Permissão negada. Por favor, libere o acesso à câmera nas configurações do seu navegador e recarregue a página.
                </p>
              )}

              <button
                onClick={iniciarCamera}
                disabled={iniciandoCamera}
                className="w-full rounded-sm bg-terracotta px-6 py-4 font-sans text-sm uppercase tracking-wider text-creme transition-colors hover:bg-terracotta/90 disabled:opacity-50"
              >
                {iniciandoCamera ? "Conectando câmera..." : "Habilitar Câmera"}
              </button>
            </div>
          )}

          {cameraAtiva && (
            <div className="border-t border-sepia/10 bg-white p-4">
              <button
                onClick={pararCamera}
                className="w-full py-2 font-sans text-xs uppercase tracking-wider text-sepia/60 transition-colors hover:text-terracotta"
              >
                Desligar Câmera
              </button>
            </div>
          )}
        </div>

        {/* Toast / Alerta de Resultado */}
        {resultado && (
          <div className="fixed inset-x-0 bottom-10 z-50 mx-auto w-full max-w-sm px-6 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div
              className={`flex items-center gap-4 rounded-sm p-4 shadow-cena ${
                resultado.tipo === "ok"
                  ? "bg-oliva text-creme"
                  : "bg-terracotta text-creme"
              }`}
            >
              <div className="flex-1">
                {resultado.tipo === "ok" && (
                  <>
                    <p className="font-sans text-[10px] uppercase tracking-wider opacity-80">Check-in Válido</p>
                    <p className="font-serif text-lg leading-tight mt-1">{resultado.nome}</p>
                  </>
                )}
                {resultado.tipo === "duplicado" && (
                  <>
                    <p className="font-sans text-[10px] uppercase tracking-wider opacity-80">Atenção: Já Registrado</p>
                    <p className="font-serif text-lg leading-tight mt-1">{resultado.nome}</p>
                  </>
                )}
                {resultado.tipo === "invalido" && (
                  <>
                    <p className="font-sans text-[10px] uppercase tracking-wider opacity-80">Erro</p>
                    <p className="font-serif text-lg leading-tight mt-1">Ingresso inválido ou não encontrado</p>
                  </>
                )}
              </div>
              <div className="text-3xl">
                {resultado.tipo === "ok" && "✨"}
                {resultado.tipo === "duplicado" && "⚠️"}
                {resultado.tipo === "invalido" && "❌"}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
