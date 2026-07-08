import QRCode from "qrcode";

/**
 * Gera um PDF elegante de ingresso desenhando o QR Code como vetores (retângulos),
 * sem nenhuma dependência externa além do 'qrcode' já presente no projeto.
 *
 * O PDF segue a especificação PDF 1.4 com fontes Type1 padrão do PDF.
 */
export async function gerarPdfIngresso(ingresso: {
  nome: string;
  token: string;
  tipo: "principal" | "acompanhante";
}): Promise<Buffer> {
  // ── 1. Gera a matriz do QR Code ──
  const qrData = QRCode.create(ingresso.token, { errorCorrectionLevel: "M" });
  const modules = qrData.modules;
  const qrSize = modules.size; // número de módulos (ex: 29)
  const qrModuleData = modules.data as Uint8Array;

  // ── 2. Dimensões da página A5 vertical (em pontos tipográficos: 1pt = 1/72 pol) ──
  const pageWidth = 420;
  const pageHeight = 595;

  // ── 3. Posicionamento do QR no PDF ──
  const qrDrawSize = 200; // tamanho total do QR desenhado em pontos
  const qrX = (pageWidth - qrDrawSize) / 2;
  const qrY = 200; // distância do fundo da página
  const moduleSize = qrDrawSize / qrSize;

  // ── 4. Cores (escala 0-1) ──
  const COR_FUNDO    = "0.992 0.969 0.937"; // #FDFBEF creme quente
  const COR_OURO     = "0.541 0.298 0.078"; // #8A4C14 ouro/marrom rico
  const COR_TEXTO    = "0.239 0.184 0.122"; // #3D2F1F marrom escuro
  const COR_DETALHE  = "0.541 0.478 0.388"; // #8A7A63 bege médio
  const COR_QR_BG    = "1 1 1";             // branco para fundo do QR
  const COR_QR_MOD   = "0.100 0.059 0.000"; // #1A0F00 quase preto aquecido

  // ── 5. Função auxiliar: escapa strings para literais PDF ──
  function pdfStr(s: string): string {
    // Transliteração de caracteres acentuados para ASCII (fontes Type1 padrão)
    const map: Record<string, string> = {
      "á":"a","à":"a","â":"a","ã":"a","ä":"a",
      "é":"e","è":"e","ê":"e","ë":"e",
      "í":"i","ì":"i","î":"i","ï":"i",
      "ó":"o","ò":"o","ô":"o","õ":"o","ö":"o",
      "ú":"u","ù":"u","û":"u","ü":"u",
      "ç":"c","ñ":"n",
      "Á":"A","À":"A","Â":"A","Ã":"A","Ä":"A",
      "É":"E","È":"E","Ê":"E","Ë":"E",
      "Í":"I","Ì":"I","Î":"I","Ï":"I",
      "Ó":"O","Ò":"O","Ô":"O","Õ":"O","Ö":"O",
      "Ú":"U","Ù":"U","Û":"U","Ü":"U",
      "Ç":"C","Ñ":"N",
    };
    return s
      .replace(/[^\x20-\x7E]/g, (c) => map[c] ?? "?")
      .replace(/[\\()]/g, (c) => `\\${c}`);
  }

  // ── 6. Centralização de texto (estimativa Helvetica ~0.55 × fontSize por char) ──
  function centerX(text: string, fontSize: number): number {
    const approxWidth = text.length * fontSize * 0.55;
    return Math.max(20, (pageWidth - approxWidth) / 2);
  }

  // ── 7. Constrói o stream de conteúdo da página ──
  const ops: string[] = [];

  // Fundo creme
  ops.push(`${COR_FUNDO} rg`);
  ops.push(`0 0 ${pageWidth} ${pageHeight} re f`);

  // Faixa superior ouro (12pt)
  ops.push(`${COR_OURO} rg`);
  ops.push(`0 ${pageHeight - 12} ${pageWidth} 12 re f`);

  // Faixa inferior ouro (8pt)
  ops.push(`0 0 ${pageWidth} 8 re f`);

  // Linha fina horizontal superior
  ops.push(`${COR_OURO} RG`);
  ops.push(`0.4 w`);
  ops.push(`24 ${pageHeight - 24} m ${pageWidth - 24} ${pageHeight - 24} l S`);

  // Linha fina horizontal inferior
  ops.push(`24 22 m ${pageWidth - 24} 22 l S`);

  // ── Título: "Carmem - 50 ANOS" ──
  const titulo = "Carmem - 50 ANOS";
  ops.push(`BT`);
  ops.push(`/F1 24 Tf`);
  ops.push(`${COR_OURO} rg`);
  ops.push(`${centerX(titulo, 24)} ${pageHeight - 64} Td`);
  ops.push(`(${pdfStr(titulo)}) Tj`);
  ops.push(`ET`);

  // Subtítulo
  const subtitulo = "Convite Pessoal & Intransferivel";
  ops.push(`BT`);
  ops.push(`/F2 8 Tf`);
  ops.push(`${COR_DETALHE} rg`);
  ops.push(`${centerX(subtitulo, 8)} ${pageHeight - 80} Td`);
  ops.push(`(${pdfStr(subtitulo)}) Tj`);
  ops.push(`ET`);

  // Linha separadora
  ops.push(`${COR_OURO} RG`);
  ops.push(`0.4 w`);
  ops.push(`60 ${pageHeight - 92} m ${pageWidth - 60} ${pageHeight - 92} l S`);

  // Label "INGRESSO NOMINAL"
  const labelIngresso = "INGRESSO NOMINAL";
  ops.push(`BT`);
  ops.push(`/F3 7.5 Tf`);
  ops.push(`${COR_OURO} rg`);
  ops.push(`${centerX(labelIngresso, 7.5)} ${pageHeight - 114} Td`);
  ops.push(`(${pdfStr(labelIngresso)}) Tj`);
  ops.push(`ET`);

  // ── QR Code: fundo branco ──
  const qrPad = 6;
  ops.push(`${COR_QR_BG} rg`);
  ops.push(
    `${qrX - qrPad} ${qrY - qrPad} ${qrDrawSize + qrPad * 2} ${qrDrawSize + qrPad * 2} re f`,
  );

  // ── QR Code: módulos como retângulos preenchidos ──
  ops.push(`${COR_QR_MOD} rg`);
  for (let row = 0; row < qrSize; row++) {
    for (let col = 0; col < qrSize; col++) {
      const isDark = qrModuleData[row * qrSize + col];
      if (isDark) {
        // PDF origin = bottom-left; linha 0 do QR fica em cima
        const x = qrX + col * moduleSize;
        const y = qrY + (qrSize - 1 - row) * moduleSize;
        ops.push(
          `${x.toFixed(3)} ${y.toFixed(3)} ${moduleSize.toFixed(3)} ${moduleSize.toFixed(3)} re f`,
        );
      }
    }
  }

  // ── Linha separadora abaixo do QR ──
  const sepY = qrY - qrPad - 20;
  ops.push(`${COR_OURO} RG`);
  ops.push(`0.4 w`);
  ops.push(`60 ${sepY} m ${pageWidth - 60} ${sepY} l S`);

  // ── Nome do titular ──
  const nomeTitular = ingresso.nome.toUpperCase();
  ops.push(`BT`);
  ops.push(`/F1 15 Tf`);
  ops.push(`${COR_TEXTO} rg`);
  ops.push(`${centerX(nomeTitular, 15)} ${sepY - 26} Td`);
  ops.push(`(${pdfStr(nomeTitular)}) Tj`);
  ops.push(`ET`);

  // ── Tipo do ingresso ──
  const tipoLabel =
    ingresso.tipo === "principal" ? "TITULAR" : "ACOMPANHANTE";
  ops.push(`BT`);
  ops.push(`/F3 8 Tf`);
  ops.push(`${COR_OURO} rg`);
  ops.push(`${centerX(tipoLabel, 8)} ${sepY - 42} Td`);
  ops.push(`(${pdfStr(tipoLabel)}) Tj`);
  ops.push(`ET`);

  // ── Rodapé ──
  const rodape = "Apresente este QR code na entrada";
  ops.push(`BT`);
  ops.push(`/F2 7.5 Tf`);
  ops.push(`${COR_DETALHE} rg`);
  ops.push(`${centerX(rodape, 7.5)} 30 Td`);
  ops.push(`(${pdfStr(rodape)}) Tj`);
  ops.push(`ET`);

  const contentStream = ops.join("\n");

  // ── 8. Monta o arquivo PDF binário ──
  const chunks: Buffer[] = [];
  const objOffsets: Record<number, number> = {};
  let pos = 0;

  function write(data: string | Buffer) {
    const buf = typeof data === "string" ? Buffer.from(data, "binary") : data;
    chunks.push(buf);
    pos += buf.length;
  }

  // Cabeçalho PDF
  write("%PDF-1.4\n");
  write("%\xE2\xE3\xCF\xD3\n"); // bytes binários para indicar arquivo binário

  // Obj 1 — Catálogo
  objOffsets[1] = pos;
  write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Obj 2 — Pages
  objOffsets[2] = pos;
  write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // Obj 3 — Page
  objOffsets[3] = pos;
  write(
    `3 0 obj\n` +
      `<< /Type /Page /Parent 2 0 R\n` +
      `   /MediaBox [0 0 ${pageWidth} ${pageHeight}]\n` +
      `   /Contents 4 0 R\n` +
      `   /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >>\n` +
      `>>\nendobj\n`,
  );

  // Obj 4 — Content stream
  const streamBuf = Buffer.from(contentStream, "binary");
  objOffsets[4] = pos;
  write(`4 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n`);
  write(streamBuf);
  write("\nendstream\nendobj\n");

  // Obj 5 — Fonte F1: Helvetica-Bold (títulos)
  objOffsets[5] = pos;
  write(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n",
  );

  // Obj 6 — Fonte F2: Helvetica (textos normais)
  objOffsets[6] = pos;
  write(
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n",
  );

  // Obj 7 — Fonte F3: Helvetica-Oblique (labels pequenos)
  objOffsets[7] = pos;
  write(
    "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj\n",
  );

  // ── Cross-reference table ──
  const xrefPos = pos;
  const objCount = 8; // objetos 0 a 7

  write(`xref\n0 ${objCount}\n`);
  write(`0000000000 65535 f \n`);
  for (let i = 1; i < objCount; i++) {
    const offset = objOffsets[i] ?? 0;
    write(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }

  // Trailer
  write(`trailer\n<< /Size ${objCount} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  return Buffer.concat(chunks);
}
