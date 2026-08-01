/**
 * Gera o PDF do relatório de confirmados (tabela paginada), no mesmo estilo
 * "PDF puro sem dependências externas" usado em pdf-ingresso.ts.
 */

type LinhaRelatorio = {
  nome: string;
  tipo: string;
  titular: string;
  restricao: string;
  status: string;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 36;
const ROW_HEIGHT = 16;

const COR_FUNDO = "0.992 0.969 0.937";
const COR_OURO = "0.541 0.298 0.078";
const COR_TEXTO = "0.239 0.184 0.122";
const COR_DETALHE = "0.541 0.478 0.388";
const COR_CLARO = "0.992 0.969 0.937";

const COLUNAS = [
  { titulo: "Nome", chave: "nome" as const, largura: 165 },
  { titulo: "Tipo", chave: "tipo" as const, largura: 62 },
  { titulo: "Titular responsável", chave: "titular" as const, largura: 138 },
  { titulo: "Restrição alimentar", chave: "restricao" as const, largura: 118 },
  { titulo: "Status", chave: "status" as const, largura: 40 },
];
const LARGURA_TABELA = COLUNAS.reduce((s, c) => s + c.largura, 0);

const MAPA_ACENTOS: Record<string, string> = {
  "á": "a", "à": "a", "â": "a", "ã": "a", "ä": "a",
  "é": "e", "è": "e", "ê": "e", "ë": "e",
  "í": "i", "ì": "i", "î": "i", "ï": "i",
  "ó": "o", "ò": "o", "ô": "o", "õ": "o", "ö": "o",
  "ú": "u", "ù": "u", "û": "u", "ü": "u",
  "ç": "c", "ñ": "n",
  "Á": "A", "À": "A", "Â": "A", "Ã": "A", "Ä": "A",
  "É": "E", "È": "E", "Ê": "E", "Ë": "E",
  "Í": "I", "Ì": "I", "Î": "I", "Ï": "I",
  "Ó": "O", "Ò": "O", "Ô": "O", "Õ": "O", "Ö": "O",
  "Ú": "U", "Ù": "U", "Û": "U", "Ü": "U",
  "Ç": "C", "Ñ": "N",
};

function pdfStr(s: string): string {
  return s
    .replace(/[^\x20-\x7E]/g, (c) => MAPA_ACENTOS[c] ?? "?")
    .replace(/[\\()]/g, (c) => `\\${c}`);
}

function truncar(texto: string, largura: number, fontSize = 8): string {
  const maxChars = Math.max(4, Math.floor(largura / (fontSize * 0.52)));
  if (texto.length <= maxChars) return texto;
  return `${texto.slice(0, maxChars - 3)}...`;
}

function desenharCabecalhoTabela(ops: string[], y: number): number {
  ops.push(`${COR_OURO} rg`);
  ops.push(`${MARGIN} ${y - 14} ${LARGURA_TABELA} 16 re f`);

  let x = MARGIN;
  for (const col of COLUNAS) {
    ops.push(`BT`);
    ops.push(`/F1 8 Tf`);
    ops.push(`${COR_CLARO} rg`);
    ops.push(`${x + 4} ${y - 10} Td`);
    ops.push(`(${pdfStr(col.titulo)}) Tj`);
    ops.push(`ET`);
    x += col.largura;
  }
  return y - 20;
}

function desenharLinha(ops: string[], linha: LinhaRelatorio, y: number, zebra: boolean) {
  if (zebra) {
    ops.push(`0.965 0.941 0.902 rg`);
    ops.push(`${MARGIN} ${y - 12} ${LARGURA_TABELA} ${ROW_HEIGHT} re f`);
  }
  let x = MARGIN;
  for (const col of COLUNAS) {
    const valor = truncar(linha[col.chave] || "-", col.largura);
    ops.push(`BT`);
    ops.push(`/F2 8 Tf`);
    ops.push(`${COR_TEXTO} rg`);
    ops.push(`${x + 4} ${y - 9} Td`);
    ops.push(`(${pdfStr(valor)}) Tj`);
    ops.push(`ET`);
    x += col.largura;
  }
}

function construirPaginaConteudo(
  linhas: LinhaRelatorio[],
  opts: { primeira: boolean; resumo: string[]; pagina: number; totalPaginas: number },
): string {
  const ops: string[] = [];

  ops.push(`${COR_FUNDO} rg`);
  ops.push(`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re f`);
  ops.push(`${COR_OURO} rg`);
  ops.push(`0 ${PAGE_HEIGHT - 8} ${PAGE_WIDTH} 8 re f`);

  let y = PAGE_HEIGHT - MARGIN;

  if (opts.primeira) {
    ops.push(`BT`);
    ops.push(`/F1 18 Tf`);
    ops.push(`${COR_TEXTO} rg`);
    ops.push(`${MARGIN} ${y - 14} Td`);
    ops.push(`(${pdfStr("Relatorio de Confirmados - Carmem 50 Anos")}) Tj`);
    ops.push(`ET`);
    y -= 34;

    for (const linhaResumo of opts.resumo) {
      ops.push(`BT`);
      ops.push(`/F2 9 Tf`);
      ops.push(`${COR_DETALHE} rg`);
      ops.push(`${MARGIN} ${y} Td`);
      ops.push(`(${pdfStr(linhaResumo)}) Tj`);
      ops.push(`ET`);
      y -= 14;
    }
    y -= 8;
  } else {
    ops.push(`BT`);
    ops.push(`/F1 12 Tf`);
    ops.push(`${COR_TEXTO} rg`);
    ops.push(`${MARGIN} ${y - 10} Td`);
    ops.push(`(${pdfStr("Relatorio de Confirmados (continuacao)")}) Tj`);
    ops.push(`ET`);
    y -= 28;
  }

  y = desenharCabecalhoTabela(ops, y);

  linhas.forEach((linha, i) => {
    desenharLinha(ops, linha, y, i % 2 === 1);
    y -= ROW_HEIGHT;
  });

  const rodape = `Pagina ${opts.pagina} de ${opts.totalPaginas}`;
  ops.push(`BT`);
  ops.push(`/F2 7 Tf`);
  ops.push(`${COR_DETALHE} rg`);
  ops.push(`${PAGE_WIDTH - MARGIN - rodape.length * 3.6} 20 Td`);
  ops.push(`(${pdfStr(rodape)}) Tj`);
  ops.push(`ET`);

  return ops.join("\n");
}

export async function gerarPdfRelatorio(
  linhas: LinhaRelatorio[],
  resumo: string[],
): Promise<Buffer> {
  const ALTURA_UTIL = PAGE_HEIGHT - MARGIN - MARGIN;
  const linhasPrimeiraPagina = Math.max(
    1,
    Math.floor((ALTURA_UTIL - (34 + resumo.length * 14 + 8) - 20) / ROW_HEIGHT),
  );
  const linhasOutrasPaginas = Math.max(1, Math.floor((ALTURA_UTIL - 28 - 20) / ROW_HEIGHT));

  const blocos: LinhaRelatorio[][] = [];
  if (linhas.length === 0) {
    blocos.push([]);
  } else {
    let resto = linhas;
    blocos.push(resto.slice(0, linhasPrimeiraPagina));
    resto = resto.slice(linhasPrimeiraPagina);
    while (resto.length > 0) {
      blocos.push(resto.slice(0, linhasOutrasPaginas));
      resto = resto.slice(linhasOutrasPaginas);
    }
  }

  const totalPaginas = blocos.length;
  const paginas = blocos.map((bloco, i) =>
    construirPaginaConteudo(bloco, {
      primeira: i === 0,
      resumo,
      pagina: i + 1,
      totalPaginas,
    }),
  );

  const chunks: Buffer[] = [];
  const offsets: Record<number, number> = {};
  let pos = 0;

  function write(data: string | Buffer) {
    const buf = typeof data === "string" ? Buffer.from(data, "binary") : data;
    chunks.push(buf);
    pos += buf.length;
  }

  write("%PDF-1.4\n");
  write("%\xE2\xE3\xCF\xD3\n");

  offsets[1] = pos;
  write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  const kids = paginas.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  offsets[2] = pos;
  write(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${paginas.length} >>\nendobj\n`);

  const fontBoldId = 3 + paginas.length * 2;
  const fontRegularId = fontBoldId + 1;

  paginas.forEach((conteudo, i) => {
    const pageObjId = 3 + i * 2;
    const contentObjId = 4 + i * 2;

    offsets[pageObjId] = pos;
    write(
      `${pageObjId} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]\n` +
        `   /Contents ${contentObjId} 0 R\n` +
        `   /Resources << /Font << /F1 ${fontBoldId} 0 R /F2 ${fontRegularId} 0 R >> >>\n` +
        `>>\nendobj\n`,
    );

    const streamBuf = Buffer.from(conteudo, "binary");
    offsets[contentObjId] = pos;
    write(`${contentObjId} 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n`);
    write(streamBuf);
    write("\nendstream\nendobj\n");
  });

  offsets[fontBoldId] = pos;
  write(
    `${fontBoldId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`,
  );
  offsets[fontRegularId] = pos;
  write(
    `${fontRegularId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`,
  );

  const xrefPos = pos;
  const objCount = fontRegularId + 1;

  write(`xref\n0 ${objCount}\n`);
  write(`0000000000 65535 f \n`);
  for (let i = 1; i < objCount; i++) {
    const offset = offsets[i] ?? 0;
    write(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }

  write(`trailer\n<< /Size ${objCount} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  return Buffer.concat(chunks);
}
