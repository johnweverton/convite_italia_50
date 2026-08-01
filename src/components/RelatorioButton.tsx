"use client";

import { useState } from "react";
import { gerarRelatorioCsv, gerarRelatorioPdf } from "@/app/painel/convidados/actions";

function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function base64ParaBlob(base64: string, tipo: string): Blob {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return new Blob([bytes], { type: tipo });
}

export default function RelatorioButton({ senha }: { senha: string }) {
  const [gerando, setGerando] = useState<"csv" | "pdf" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function baixarCsv() {
    setErro(null);
    setGerando("csv");
    const resultado = await gerarRelatorioCsv(senha);
    setGerando(null);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    baixarBlob(new Blob([resultado.csv], { type: "text/csv;charset=utf-8" }), "confirmados-carmem.csv");
  }

  async function baixarPdf() {
    setErro(null);
    setGerando("pdf");
    const resultado = await gerarRelatorioPdf(senha);
    setGerando(null);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    baixarBlob(base64ParaBlob(resultado.base64, "application/pdf"), "confirmados-carmem.pdf");
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={baixarCsv}
          disabled={gerando !== null}
          className="rounded-sm bg-sepia px-6 py-3 font-sans text-sm uppercase tracking-wider text-creme transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {gerando === "csv" ? "Gerando..." : "Baixar relatório (CSV)"}
        </button>
        <button
          type="button"
          onClick={baixarPdf}
          disabled={gerando !== null}
          className="rounded-sm border border-sepia px-6 py-3 font-sans text-sm uppercase tracking-wider text-sepia transition-colors hover:bg-sepia/5 disabled:opacity-60"
        >
          {gerando === "pdf" ? "Gerando..." : "Baixar relatório (PDF)"}
        </button>
      </div>
      {erro && <p className="mt-2 font-sans text-xs text-terracotta">{erro}</p>}
    </div>
  );
}
