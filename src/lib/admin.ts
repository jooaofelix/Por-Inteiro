import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

/**
 * Acesso do painel da gestão.
 *
 * Autenticação deliberadamente simples: uma senha única de ambiente
 * (`ADMIN_SENHA`) e um cookie assinado. O painel não mostra resposta
 * individual — só agregados —, então não há o que ganhar criando contas
 * nominais agora. Quando a Fundação precisar de vários perfis de acesso e de
 * trilha de auditoria, o ponto de troca é este arquivo: as telas só chamam
 * `sessaoAtiva()` e `abrirSessao()`.
 */

const NOME_COOKIE = "pi_admin";
const DURACAO_SEGUNDOS = 60 * 60 * 8; // uma jornada

const SEGREDO_DEV = "segredo-de-desenvolvimento-nao-usar-em-producao";

function segredo(): string {
  const configurado = process.env.SESSION_SECRET;
  if (configurado) return configurado;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET não configurado. Gere um com `openssl rand -hex 32`.",
    );
  }
  return SEGREDO_DEV;
}

export function adminConfigurado(): boolean {
  return Boolean(process.env.ADMIN_SENHA);
}

function assinar(expiraEm: number): string {
  return createHmac("sha256", segredo()).update(String(expiraEm)).digest("hex");
}

function comparar(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** `true` se a senha confere. Sempre em tempo constante. */
export function senhaCorreta(tentativa: string): boolean {
  const esperada = process.env.ADMIN_SENHA;
  if (!esperada) return false;
  return comparar(tentativa, esperada);
}

export async function abrirSessao(): Promise<void> {
  const expiraEm = Math.floor(Date.now() / 1000) + DURACAO_SEGUNDOS;
  const valor = `${expiraEm}.${assinar(expiraEm)}`;

  const jar = await cookies();
  jar.set(NOME_COOKIE, valor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
}

export async function fecharSessao(): Promise<void> {
  const jar = await cookies();
  jar.delete(NOME_COOKIE);
}

export async function sessaoAtiva(): Promise<boolean> {
  const jar = await cookies();
  const valor = jar.get(NOME_COOKIE)?.value;
  if (!valor) return false;

  const [expiraEmTexto, assinatura] = valor.split(".");
  const expiraEm = Number(expiraEmTexto);
  if (!expiraEmTexto || !assinatura || !Number.isFinite(expiraEm)) return false;
  if (expiraEm < Math.floor(Date.now() / 1000)) return false;

  return comparar(assinatura, assinar(expiraEm));
}
