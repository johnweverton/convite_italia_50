import { describe, it, expect } from "vitest";
import { gerarPdfRelatorio } from "./pdf-relatorio";

/** Extrai os offsets declarados na tabela xref e confere que cada um aponta para "N 0 obj". */
function validarXref(buffer: Buffer): { objetos: number } {
  const texto = buffer.toString("binary");
  const posXref = Number(texto.match(/startxref\s+(\d+)/)?.[1]);
  expect(Number.isFinite(posXref)).toBe(true);

  const blocoXref = texto.slice(posXref, posXref + 2000);
  const linhas = blocoXref.split("\n");
  const totalObjetos = Number(linhas[1].trim().split(" ")[1]);

  for (let i = 1; i < totalObjetos; i++) {
    const offset = Number(linhas[i + 2].trim().split(" ")[0]);
    const trecho = texto.slice(offset, offset + 12);
    expect(trecho.startsWith(`${i} 0 obj`)).toBe(true);
  }

  return { objetos: totalObjetos };
}

describe("gerarPdfRelatorio", () => {
  it("gera um PDF valido (cabecalho, rodape e tabela xref consistente) para uma lista vazia", async () => {
    const buffer = await gerarPdfRelatorio([], ["Gerado em teste"]);
    expect(buffer.subarray(0, 8).toString()).toBe("%PDF-1.4");
    expect(buffer.subarray(-6).toString().trim()).toBe("%%EOF");
    validarXref(buffer);
  });

  it("pagina corretamente quando ha muitas linhas (mais de uma pagina)", async () => {
    const linhas = Array.from({ length: 80 }, (_, i) => ({
      nome: `Convidado ${i}`,
      tipo: i % 2 === 0 ? "Titular" : "Acomp.",
      titular: `Titular ${i}`,
      restricao: "Nenhuma",
      status: "Aguard.",
    }));

    const buffer = await gerarPdfRelatorio(linhas, ["Gerado em teste", "Total: 80"]);
    const { objetos } = validarXref(buffer);

    const texto = buffer.toString("binary");
    const totalPaginas = Number(texto.match(/\/Kids \[[^\]]*\] \/Count (\d+)/)?.[1]);
    expect(totalPaginas).toBeGreaterThan(1);
    // 2 objetos por pagina (Page + Content) + Catalog + Pages + 2 fontes (objeto 0 e o "free" da xref nao conta aqui)
    expect(objetos).toBe(totalPaginas * 2 + 5);
  });
});
