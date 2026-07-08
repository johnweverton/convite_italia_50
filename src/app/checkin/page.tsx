"use client";

import { useEffect, useRef, useState } from "react";

type Resultado =
  | { tipo: "ok"; nome: string }
  | { tipo: "duplicado"; nome: string }
  | { tipo: "invalido" };

const SCANNER_ID = "checkin-qr-reader";

export default function CheckinPage() {
  const [senha, setSenha] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5QrcodeScanner | null>(null);
  const processandoRef = useRef(false);

  useEffect(() => {
    if (!autorizado) return;

    let cancelado = false;

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (cancelado) return;
      const scanner = new Html5QrcodeScanner(
        SCANNER_ID,
        { fps: 10, qrbox: 250 },
        false,
      );
      scannerRef.current = scanner;

      scanner.render(async (decodedText) => {
        if (processandoRef.current) return;
        processandoRef.current = true;
        await scanner.pause(true);

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

        setTimeout(() => {
          setResultado(null);
          processandoRef.current = false;
          scanner.resume();
        }, 2500);
      }, undefined);
    });

    return () => {
      cancelado = true;
      scannerRef.current?.clear().catch(() => {});
    };
  }, [autorizado, senha]);

  if (!autorizado) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-creme px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAutorizado(true);
          }}
          className="w-full max-w-sm rounded-sm border border-dourado/30 bg-white p-8 text-center shadow-cena"
        >
          <h1 className="font-serif text-2xl text-sepia">Check-in</h1>
          <p className="mt-2 font-sans text-sm text-sepia/60">
            Digite a senha da portaria para escanear os ingressos.
          </p>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            className="mt-6 w-full rounded-sm border border-sepia/20 px-4 py-3 font-sans focus:border-terracotta focus:outline-none"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-sm bg-terracotta py-3 font-sans text-sm uppercase tracking-wider text-creme"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-creme px-6 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-serif text-2xl text-sepia">Check-in dos convidados</h1>
        <p className="mt-1 text-center font-sans text-sm text-sepia/60">
          Aponte a câmera para o QR code do ingresso.
        </p>

        <div id={SCANNER_ID} className="mt-6" />

        {resultado && (
          <div
            className={`mt-6 rounded-sm p-6 text-center font-sans ${
              resultado.tipo === "ok"
                ? "bg-oliva/10 text-oliva"
                : "bg-terracotta/10 text-terracotta"
            }`}
          >
            {resultado.tipo === "ok" && (
              <p className="text-lg font-medium">✅ Bem-vindo(a), {resultado.nome}!</p>
            )}
            {resultado.tipo === "duplicado" && (
              <p className="text-lg font-medium">⚠️ {resultado.nome} já fez check-in.</p>
            )}
            {resultado.tipo === "invalido" && (
              <p className="text-lg font-medium">❌ Ingresso não reconhecido.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
