import QRCode from "qrcode";
import { readFileSync } from "fs";
import { join } from "path";
import { deflateSync } from "zlib";

/**
 * Gera um PDF elegante de ingresso com a logo "Carmem Cavalcante" no cabeçalho,
 * QR Code vetorial e layout premium.
 *
 * Usa a imagem PNG da logo embutida diretamente no PDF como XObject.
 */
export async function gerarPdfIngresso(ingresso: {
  nome: string;
  token: string;
  tipo: "principal" | "acompanhante";
}): Promise<Buffer> {
  // 1. Gera a matriz do QR Code
  const qrData = QRCode.create(ingresso.token, { errorCorrectionLevel: "M" });
  const modules = qrData.modules;
  const qrSize = modules.size;
  const qrModuleData = modules.data as Uint8Array;

  // 2. Le a logo PNG
  let logoPngBuffer: Buffer;
  try {
    logoPngBuffer = readFileSync(join(process.cwd(), "public", "cenas", "logo-carmem.png"));
  } catch {
    logoPngBuffer = Buffer.alloc(0);
  }

  // 3. Extrai dados do PNG para embutir no PDF
  let logoWidth = 0;
  let logoHeight = 0;
  let logoImageData: any = Buffer.alloc(0);
  let logoHasAlpha = false;
  let logoBitsPerComponent = 8;

  if (logoPngBuffer.length > 0) {
    const parsed = parsePng(logoPngBuffer);
    logoWidth = parsed.width;
    logoHeight = parsed.height;
    logoImageData = parsed.rgbData;
    logoHasAlpha = parsed.hasAlpha;
    logoBitsPerComponent = parsed.bitsPerComponent;
  }

  // 4. Dimensoes da pagina A5 vertical (pontos tipograficos)
  const pageWidth = 420;
  const pageHeight = 595;

  // 5. Posicionamento do QR no PDF
  const qrDrawSize = 180;
  const qrX = (pageWidth - qrDrawSize) / 2;
  const qrY = 175;
  const moduleSize = qrDrawSize / qrSize;

  // 6. Cores (escala 0-1)
  const COR_FUNDO    = "0.992 0.969 0.937";
  const COR_OURO     = "0.541 0.298 0.078";
  const COR_TEXTO    = "0.239 0.184 0.122";
  const COR_DETALHE  = "0.541 0.478 0.388";
  const COR_QR_BG    = "1 1 1";
  const COR_QR_MOD   = "0.100 0.059 0.000";

  // 7. Funcao auxiliar: escapa strings para literais PDF
  function pdfStr(s: string): string {
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

  // 8. Centralizacao de texto
  function centerX(text: string, fontSize: number): number {
    const approxWidth = text.length * fontSize * 0.55;
    return Math.max(20, (pageWidth - approxWidth) / 2);
  }

  // 9. Constroi o stream de conteudo da pagina
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

  // Logo no cabecalho (imagem PNG embutida)
  if (logoWidth > 0 && logoHeight > 0) {
    // Calcula dimensoes proporcionais para o cabecalho
    const maxLogoWidth = 280;
    const scale = Math.min(maxLogoWidth / logoWidth, 1);
    const drawW = logoWidth * scale;
    const drawH = logoHeight * scale;
    const logoXPos = (pageWidth - drawW) / 2;
    const logoYPos = pageHeight - 30 - drawH - 10;
    
    ops.push(`q`);
    ops.push(`${drawW} 0 0 ${drawH} ${logoXPos} ${logoYPos} cm`);
    ops.push(`/Logo Do`);
    ops.push(`Q`);
  } else {
    // Fallback: texto se a logo nao for encontrada
    const titulo = "Carmem Cavalcante";
    ops.push(`BT`);
    ops.push(`/F1 24 Tf`);
    ops.push(`${COR_OURO} rg`);
    ops.push(`${centerX(titulo, 24)} ${pageHeight - 60} Td`);
    ops.push(`(${pdfStr(titulo)}) Tj`);
    ops.push(`ET`);

    const subtitulo = "FESTA DI 50 ANNI";
    ops.push(`BT`);
    ops.push(`/F2 9 Tf`);
    ops.push(`${COR_DETALHE} rg`);
    ops.push(`${centerX(subtitulo, 9)} ${pageHeight - 78} Td`);
    ops.push(`(${pdfStr(subtitulo)}) Tj`);
    ops.push(`ET`);
  }

  // Linha separadora
  const sepHeaderY = logoWidth > 0 ? pageHeight - 130 : pageHeight - 92;
  ops.push(`${COR_OURO} RG`);
  ops.push(`0.4 w`);
  ops.push(`60 ${sepHeaderY} m ${pageWidth - 60} ${sepHeaderY} l S`);

  // Label "INGRESSO NOMINAL"
  const labelIngresso = "INGRESSO NOMINAL";
  ops.push(`BT`);
  ops.push(`/F3 7.5 Tf`);
  ops.push(`${COR_OURO} rg`);
  ops.push(`${centerX(labelIngresso, 7.5)} ${sepHeaderY - 22} Td`);
  ops.push(`(${pdfStr(labelIngresso)}) Tj`);
  ops.push(`ET`);

  // QR Code: fundo branco
  const qrPad = 6;
  ops.push(`${COR_QR_BG} rg`);
  ops.push(
    `${qrX - qrPad} ${qrY - qrPad} ${qrDrawSize + qrPad * 2} ${qrDrawSize + qrPad * 2} re f`,
  );

  // QR Code: modulos como retangulos preenchidos
  ops.push(`${COR_QR_MOD} rg`);
  for (let row = 0; row < qrSize; row++) {
    for (let col = 0; col < qrSize; col++) {
      const isDark = qrModuleData[row * qrSize + col];
      if (isDark) {
        const x = qrX + col * moduleSize;
        const y = qrY + (qrSize - 1 - row) * moduleSize;
        ops.push(
          `${x.toFixed(3)} ${y.toFixed(3)} ${moduleSize.toFixed(3)} ${moduleSize.toFixed(3)} re f`,
        );
      }
    }
  }

  // Linha separadora abaixo do QR
  const sepY = qrY - qrPad - 20;
  ops.push(`${COR_OURO} RG`);
  ops.push(`0.4 w`);
  ops.push(`60 ${sepY} m ${pageWidth - 60} ${sepY} l S`);

  // Nome do titular
  const nomeTitular = ingresso.nome.toUpperCase();
  ops.push(`BT`);
  ops.push(`/F1 15 Tf`);
  ops.push(`${COR_TEXTO} rg`);
  ops.push(`${centerX(nomeTitular, 15)} ${sepY - 26} Td`);
  ops.push(`(${pdfStr(nomeTitular)}) Tj`);
  ops.push(`ET`);

  // Tipo do ingresso
  const tipoLabel =
    ingresso.tipo === "principal" ? "TITULAR" : "ACOMPANHANTE";
  ops.push(`BT`);
  ops.push(`/F3 8 Tf`);
  ops.push(`${COR_OURO} rg`);
  ops.push(`${centerX(tipoLabel, 8)} ${sepY - 42} Td`);
  ops.push(`(${pdfStr(tipoLabel)}) Tj`);
  ops.push(`ET`);

  // Rodape
  const rodape = "Apresente este QR code na entrada";
  ops.push(`BT`);
  ops.push(`/F2 7.5 Tf`);
  ops.push(`${COR_DETALHE} rg`);
  ops.push(`${centerX(rodape, 7.5)} 30 Td`);
  ops.push(`(${pdfStr(rodape)}) Tj`);
  ops.push(`ET`);

  const contentStream = ops.join("\n");

  // 10. Monta o arquivo PDF binario
  const chunks: Buffer[] = [];
  const objOffsets: Record<number, number> = {};
  let pos = 0;

  function write(data: string | Buffer) {
    const buf = typeof data === "string" ? Buffer.from(data, "binary") : data;
    chunks.push(buf);
    pos += buf.length;
  }

  // Cabecalho PDF
  write("%PDF-1.4\n");
  write("%\xE2\xE3\xCF\xD3\n");

  // Obj 1 - Catalogo
  objOffsets[1] = pos;
  write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Obj 2 - Pages
  objOffsets[2] = pos;
  write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // Preparar dados da logo para o PDF
  let hasLogoObj = false;
  let logoObjId = 8;
  let smaskObjId = 9;
  let nextObjId = 8;

  if (logoWidth > 0 && logoImageData.length > 0) {
    hasLogoObj = true;
    logoObjId = nextObjId++;
    if (logoHasAlpha) {
      smaskObjId = nextObjId++;
    }
  }

  // Obj 3 - Page (com ou sem logo)
  objOffsets[3] = pos;
  const xObjectsDict = hasLogoObj ? ` /XObject << /Logo ${logoObjId} 0 R >>` : "";
  write(
    `3 0 obj\n` +
      `<< /Type /Page /Parent 2 0 R\n` +
      `   /MediaBox [0 0 ${pageWidth} ${pageHeight}]\n` +
      `   /Contents 4 0 R\n` +
      `   /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >>${xObjectsDict} >>\n` +
      `>>\nendobj\n`,
  );

  // Obj 4 - Content stream
  const streamBuf = Buffer.from(contentStream, "binary");
  objOffsets[4] = pos;
  write(`4 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n`);
  write(streamBuf);
  write("\nendstream\nendobj\n");

  // Obj 5 - Fonte F1: Helvetica-Bold (titulos)
  objOffsets[5] = pos;
  write(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n",
  );

  // Obj 6 - Fonte F2: Helvetica (textos normais)
  objOffsets[6] = pos;
  write(
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n",
  );

  // Obj 7 - Fonte F3: Helvetica-Oblique (labels pequenos)
  objOffsets[7] = pos;
  write(
    "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj\n",
  );

  // Obj 8+ - Logo image (se disponivel)
  if (hasLogoObj) {
    // Extrai RGB e Alpha separados
    const pixelCount = logoWidth * logoHeight;
    const rgbBuf = Buffer.alloc(pixelCount * 3);
    const alphaBuf = logoHasAlpha ? Buffer.alloc(pixelCount) : Buffer.alloc(0);
    const bytesPerPixel = logoHasAlpha ? 4 : 3;

    for (let i = 0; i < pixelCount; i++) {
      rgbBuf[i * 3]     = logoImageData[i * bytesPerPixel];
      rgbBuf[i * 3 + 1] = logoImageData[i * bytesPerPixel + 1];
      rgbBuf[i * 3 + 2] = logoImageData[i * bytesPerPixel + 2];
      if (logoHasAlpha) {
        alphaBuf[i] = logoImageData[i * bytesPerPixel + 3];
      }
    }

    const compressedRgb = deflateSync(rgbBuf);

    // SMask (alpha channel) object
    if (logoHasAlpha) {
      const compressedAlpha = deflateSync(alphaBuf);
      objOffsets[smaskObjId] = pos;
      write(
        `${smaskObjId} 0 obj\n` +
        `<< /Type /XObject /Subtype /Image\n` +
        `   /Width ${logoWidth} /Height ${logoHeight}\n` +
        `   /ColorSpace /DeviceGray /BitsPerComponent ${logoBitsPerComponent}\n` +
        `   /Filter /FlateDecode /Length ${compressedAlpha.length} >>\n` +
        `stream\n`,
      );
      write(compressedAlpha);
      write("\nendstream\nendobj\n");
    }

    // Logo image object
    objOffsets[logoObjId] = pos;
    const smaskRef = logoHasAlpha ? ` /SMask ${smaskObjId} 0 R` : "";
    write(
      `${logoObjId} 0 obj\n` +
      `<< /Type /XObject /Subtype /Image\n` +
      `   /Width ${logoWidth} /Height ${logoHeight}\n` +
      `   /ColorSpace /DeviceRGB /BitsPerComponent ${logoBitsPerComponent}\n` +
      `   /Filter /FlateDecode /Length ${compressedRgb.length}${smaskRef} >>\n` +
      `stream\n`,
    );
    write(compressedRgb);
    write("\nendstream\nendobj\n");
  }

  // Cross-reference table
  const xrefPos = pos;
  const objCount = nextObjId;

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

/**
 * Parser PNG simplificado que extrai pixels RGBA/RGB raw.
 */
function parsePng(buf: Buffer): {
  width: number;
  height: number;
  rgbData: Buffer;
  hasAlpha: boolean;
  bitsPerComponent: number;
} {
  const { inflateSync } = require("zlib") as typeof import("zlib");

  // Verifica assinatura PNG
  if (buf.slice(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error("Nao e um arquivo PNG valido.");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 2; // 2=RGB, 6=RGBA
  const idatChunks: Buffer[] = [];

  while (offset < buf.length) {
    const chunkLen = buf.readUInt32BE(offset);
    const chunkType = buf.slice(offset + 4, offset + 8).toString("ascii");
    const chunkData = buf.slice(offset + 8, offset + 8 + chunkLen);

    if (chunkType === "IHDR") {
      width = chunkData.readUInt32BE(0);
      height = chunkData.readUInt32BE(4);
      bitDepth = chunkData[8];
      colorType = chunkData[9];
    } else if (chunkType === "IDAT") {
      idatChunks.push(chunkData);
    } else if (chunkType === "IEND") {
      break;
    }

    offset += 8 + chunkLen + 4; // 4 bytes CRC
  }

  const compressed = Buffer.concat(idatChunks);
  const raw = inflateSync(compressed);

  const hasAlpha = colorType === 6;
  const bytesPerPixel = hasAlpha ? 4 : 3;
  const stride = width * bytesPerPixel;

  // Desfaz filtros PNG (por linha)
  const pixels = Buffer.alloc(width * height * bytesPerPixel);
  let prevRow = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filterByte = raw[y * (stride + 1)];
    const rowStart = y * (stride + 1) + 1;
    const currentRow = Buffer.alloc(stride);

    for (let x = 0; x < stride; x++) {
      const rawByte = raw[rowStart + x];
      const a = x >= bytesPerPixel ? currentRow[x - bytesPerPixel] : 0;
      const b = prevRow[x];
      const c = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;

      let val = rawByte;
      switch (filterByte) {
        case 0: // None
          val = rawByte;
          break;
        case 1: // Sub
          val = (rawByte + a) & 0xff;
          break;
        case 2: // Up
          val = (rawByte + b) & 0xff;
          break;
        case 3: // Average
          val = (rawByte + Math.floor((a + b) / 2)) & 0xff;
          break;
        case 4: // Paeth
          val = (rawByte + paethPredictor(a, b, c)) & 0xff;
          break;
      }
      currentRow[x] = val;
    }

    currentRow.copy(pixels, y * stride, 0, stride);
    prevRow = currentRow;
  }

  return {
    width,
    height,
    rgbData: pixels,
    hasAlpha,
    bitsPerComponent: bitDepth,
  };
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}
