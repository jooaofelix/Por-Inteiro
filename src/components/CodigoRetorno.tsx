"use client";

import { useState } from "react";

/**
 * Mostra o código de retorno logo depois do envio.
 *
 * Aparece uma única vez, porque o servidor não guarda o código — só o hash.
 * Se a pessoa fechar a aba sem anotar, o resultado fica inacessível para
 * sempre, inclusive para nós. O texto diz isso com todas as letras.
 */
export function CodigoRetorno({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sem permissão de área de transferência o código continua visível na
      // tela para ser anotado à mão, que é o caminho recomendado mesmo.
    }
  }

  return (
    <section className="rounded-xl border-2 border-primaria bg-primaria-clara p-5">
      <h2 className="font-bold">Anote seu código</h2>
      <p className="mt-1 text-sm">
        Com ele você reabre este resultado depois e compara sua evolução. Ele não está
        ligado ao seu nome — e, se você perder, nem nós conseguimos recuperar.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <code className="rounded-lg border border-primaria bg-cartao px-4 py-2.5 font-mono text-xl font-bold tracking-widest">
          {codigo}
        </code>
        <button
          type="button"
          onClick={copiar}
          className="sem-impressao rounded-lg border border-primaria px-4 py-2.5 text-sm font-medium text-primaria transition hover:bg-primaria hover:text-white"
        >
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>

      <p className="mt-3 text-sm text-texto-suave">
        Se estiver em um computador compartilhado, escreva no papel em vez de salvar
        no navegador.
      </p>
    </section>
  );
}
