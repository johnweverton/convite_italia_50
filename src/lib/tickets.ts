import { randomBytes } from "crypto";
import QRCode from "qrcode";

/** Token opaco e único usado como identificador do ingresso/convite no QR e no link. */
export function gerarToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Gera o PNG do QR code (buffer) a partir do token do ingresso, para anexar no e-mail. */
export function gerarQrBuffer(token: string): Promise<Buffer> {
  return QRCode.toBuffer(token, { margin: 1, width: 480 });
}
