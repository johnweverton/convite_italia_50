import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

describe("GET /api/prazo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it("retorna encerrado=false antes do prazo, calculado pelo relogio do servidor", async () => {
    vi.setSystemTime(new Date("2026-08-03T12:00:00-03:00"));
    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ encerrado: false });
  });

  it("retorna encerrado=true depois do prazo", async () => {
    vi.setSystemTime(new Date("2026-08-04T00:00:01-03:00"));
    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ encerrado: true });
  });
});
