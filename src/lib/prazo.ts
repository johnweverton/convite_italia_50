/**
 * Prazo final para confirmar presença / gerar QR code: 5 dias antes do evento.
 * Evento: 08/08/2026. Prazo: 03/08/2026, fim do dia, horário de Brasília.
 * Constante pura (sem I/O), pode ser importada tanto em Server quanto em Client Components.
 */
export const EVENTO_EM = new Date("2026-08-08T00:00:00-03:00");
export const PRAZO_CONFIRMACAO = new Date("2026-08-03T23:59:59-03:00");

export function prazoEncerrado(): boolean {
  return Date.now() > PRAZO_CONFIRMACAO.getTime();
}

export const numeroWhatsappCerimonialista =
  process.env.NEXT_PUBLIC_CERIMONIALISTA_WHATSAPP ?? "";

export function linkWhatsappCerimonialista(mensagem: string): string | null {
  if (!numeroWhatsappCerimonialista) return null;
  return `https://wa.me/${numeroWhatsappCerimonialista}?text=${encodeURIComponent(mensagem)}`;
}

export const mensagemPrazoEncerrado =
  "O prazo para confirmar presença e gerar o ingresso com QR code foi encerrado em 03/08/2026. " +
  "Em caso de urgência, entre em contato diretamente com a cerimonialista.";
