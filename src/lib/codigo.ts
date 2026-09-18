import { createHash, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Código de retorno — o único elo entre a pessoa e a resposta dela.
 *
 * O código é gerado no servidor, mostrado UMA vez e nunca gravado em texto
 * claro: o banco guarda apenas o SHA-256 do código somado a um pepper de
 * ambiente. Quem obtiver uma cópia do banco não consegue reabrir o resultado
 * de ninguém, e nós mesmos não conseguimos recuperar um código perdido —
 * a interface avisa isso antes de a pessoa sair da tela.
 */

/**
 * Alfabeto sem 0/O, 1/I/L e 5/S: o código é lido em voz alta e anotado no
 * papel, então confundir caractere é o erro mais provável.
 */
const ALFABETO = "ABCDEFGHJKMNPQRTUVWXYZ2346789";
const BLOCOS = 2;
const TAMANHO_BLOCO = 4;

export function gerarCodigo(): string {
  const blocos: string[] = [];

  for (let b = 0; b < BLOCOS; b++) {
    let bloco = "";
    for (let i = 0; i < TAMANHO_BLOCO; i++) {
      // randomInt usa a fonte de entropia do SO — Math.random seria previsível
      // e o código é a única credencial do resultado.
      bloco += ALFABETO[randomInt(ALFABETO.length)];
    }
    blocos.push(bloco);
  }

  return `PI-${blocos.join("-")}`;
}

/** Aceita o código como a pessoa digitar: minúsculo, sem hífen, com espaços. */
export function normalizarCodigo(entrada: string): string {
  const limpo = entrada.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (limpo.length !== BLOCOS * TAMANHO_BLOCO + 2) return "";
  if (!limpo.startsWith("PI")) return "";

  const corpo = limpo.slice(2);
  const blocos: string[] = [];
  for (let i = 0; i < corpo.length; i += TAMANHO_BLOCO) {
    blocos.push(corpo.slice(i, i + TAMANHO_BLOCO));
  }

  return `PI-${blocos.join("-")}`;
}

export function hashCodigo(codigo: string): string {
  const pepper = process.env.CODIGO_PEPPER ?? "";
  return createHash("sha256").update(`${codigo}:${pepper}`).digest("hex");
}

/** Comparação em tempo constante, para não vazar o código por tempo de resposta. */
export function codigosIguais(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
