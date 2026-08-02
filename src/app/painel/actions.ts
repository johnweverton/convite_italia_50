"use server";

import { cookies } from "next/headers";

const NOME_COOKIE = "painel_senha";
const DURACAO_COOKIE_SEGUNDOS = 60 * 60 * 12; // 12h, cobre um turno de trabalho da cerimonialista

/**
 * Autentica o acesso ao painel privado via cookie httpOnly (nunca via URL).
 * A senha em si continua sendo uma comparação simples com PAINEL_SENHA. Não há
 * usuários/sessões no app, então o cookie apenas evita expor a senha na barra
 * de endereço, no histórico do navegador e em logs de acesso.
 */
export async function entrarPainel(senha: string) {
  const senhaEsperada = process.env.PAINEL_SENHA;
  if (!senhaEsperada || senha !== senhaEsperada) {
    return { ok: false as const, erro: "Senha incorreta." };
  }

  cookies().set(NOME_COOKIE, senha, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/painel",
    maxAge: DURACAO_COOKIE_SEGUNDOS,
  });

  return { ok: true as const };
}

export async function sairPainel() {
  cookies().delete({ name: NOME_COOKIE, path: "/painel" });
}
