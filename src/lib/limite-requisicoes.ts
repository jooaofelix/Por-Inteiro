import { headers } from "next/headers";

/**
 * Limite simples de tentativas por origem: contém robô, envio repetido em
 * massa que distorceria os relatórios e força bruta no código de retorno.
 *
 * O endereço de origem vive apenas em memória e some quando o processo
 * reinicia. Nada disso é gravado no banco nem associado a uma resposta — é
 * chave efêmera de contagem e nada mais.
 *
 * Em produção com mais de uma instância, trocar por um contador compartilhado
 * (Redis) ou pelo limitador da própria borda.
 */

const JANELA_MS = 10 * 60 * 1000;

const contagens = new Map<string, { inicio: number; tentativas: number }>();

/**
 * @param chave  identificador da origem, já com prefixo do que está sendo
 *               limitado (ex.: `envio:1.2.3.4`), para que um contador não
 *               consuma a cota do outro.
 */
export function dentroDoLimite(chave: string, maximo: number): boolean {
  const agora = Date.now();
  const atual = contagens.get(chave);

  if (!atual || agora - atual.inicio > JANELA_MS) {
    contagens.set(chave, { inicio: agora, tentativas: 1 });
    limpar(agora);
    return true;
  }

  atual.tentativas += 1;
  return atual.tentativas <= maximo;
}

export function origemDaRequisicao(request: Request): string {
  return extrair(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));
}

/** Mesma leitura, para Server Actions e Server Components. */
export async function origemAtual(): Promise<string> {
  const cabecalhos = await headers();
  return extrair(cabecalhos.get("x-forwarded-for"), cabecalhos.get("x-real-ip"));
}

function extrair(encaminhado: string | null, direto: string | null): string {
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return direto ?? "desconhecida";
}

function limpar(agora: number): void {
  for (const [chave, valor] of contagens) {
    if (agora - valor.inicio > JANELA_MS) contagens.delete(chave);
  }
}
