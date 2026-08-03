import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

describe("prazoEncerrado", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it("retorna false um segundo antes do prazo (03/08/2026 23:59:59 -03:00)", async () => {
    vi.setSystemTime(new Date("2026-08-03T23:59:58-03:00"));
    const { prazoEncerrado } = await import("./prazo");
    expect(prazoEncerrado()).toBe(false);
  });

  it("retorna true um segundo depois do prazo", async () => {
    vi.setSystemTime(new Date("2026-08-04T00:00:00-03:00"));
    const { prazoEncerrado } = await import("./prazo");
    expect(prazoEncerrado()).toBe(true);
  });

  it("retorna false bem antes do prazo (evento ainda distante)", async () => {
    vi.setSystemTime(new Date("2026-07-15T12:00:00-03:00"));
    const { prazoEncerrado } = await import("./prazo");
    expect(prazoEncerrado()).toBe(false);
  });

  it("nao depende do fuso horario local do processo (equivalente a -03:00 em qualquer TZ)", async () => {
    // Mesmo instante absoluto que 03/08/2026 23:59:59 -03:00, escrito em UTC.
    vi.setSystemTime(new Date("2026-08-04T02:59:59.000Z"));
    const { prazoEncerrado } = await import("./prazo");
    expect(prazoEncerrado()).toBe(false);

    vi.setSystemTime(new Date("2026-08-04T03:00:01.000Z"));
    vi.resetModules();
    const { prazoEncerrado: prazoEncerrado2 } = await import("./prazo");
    expect(prazoEncerrado2()).toBe(true);
  });
});

describe("linkWhatsappCerimonialista", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retorna null quando a variavel de ambiente nao esta configurada", async () => {
    vi.stubEnv("NEXT_PUBLIC_CERIMONIALISTA_WHATSAPP", "");
    const { linkWhatsappCerimonialista } = await import("./prazo");
    expect(linkWhatsappCerimonialista("oi")).toBeNull();
  });

  it("monta o link wa.me com a mensagem codificada quando o numero esta configurado", async () => {
    vi.stubEnv("NEXT_PUBLIC_CERIMONIALISTA_WHATSAPP", "5585999999999");
    const { linkWhatsappCerimonialista } = await import("./prazo");
    const link = linkWhatsappCerimonialista("Olá, preciso de ajuda");
    expect(link).toBe("https://wa.me/5585999999999?text=Ol%C3%A1%2C%20preciso%20de%20ajuda");
  });
});
