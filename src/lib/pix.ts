/**
 * Gera o payload "Pix Copia e Cola" (BR Code estático EMV) a partir da chave do recebedor.
 * Tudo é exibido na página — o pagamento ocorre no app do banco do convidado.
 * Zero taxa, zero intermediário. Referência: Manual do BR Code (Bacen).
 */

function tlv(id: string, valor: string): string {
  const tamanho = valor.length.toString().padStart(2, "0");
  return `${id}${tamanho}${valor}`;
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF) — exigido pelo BR Code. */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Remove acentos e limita o tamanho — exigência dos campos de nome/cidade. */
function sanitizar(texto: string, max: number): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, max)
    .trim();
}

export type PixParams = {
  chave: string;
  nome: string;
  cidade: string;
  /** Valor em Reais. Omitido = QR sem valor (o convidado digita no app). */
  valor?: number | null;
  /** Identificador da transação (até 25 chars, A-Z0-9). */
  txid?: string;
};

export function gerarPixPayload({
  chave,
  nome,
  cidade,
  valor,
  txid = "***",
}: PixParams): string {
  const merchantAccount = tlv("00", "br.gov.bcb.pix") + tlv("01", chave.trim());

  const campos = [
    tlv("00", "01"), // Payload Format Indicator
    tlv("26", merchantAccount), // Merchant Account Information - Pix
    tlv("52", "0000"), // Merchant Category Code
    tlv("53", "986"), // Moeda - BRL
  ];

  if (valor && valor > 0) {
    campos.push(tlv("54", valor.toFixed(2)));
  }

  campos.push(
    tlv("58", "BR"), // País
    tlv("59", sanitizar(nome, 25)), // Nome do recebedor
    tlv("60", sanitizar(cidade, 15)), // Cidade
    tlv("62", tlv("05", sanitizar(txid, 25) || "***")), // Additional Data - txid
  );

  const semCrc = campos.join("") + "6304";
  return semCrc + crc16(semCrc);
}
