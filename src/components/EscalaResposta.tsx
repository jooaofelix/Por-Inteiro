"use client";

import { ESCALA, type Item } from "@/data/questionario";

type Props = {
  item: Item;
  valor: number | undefined;
  aoEscolher: (valor: number) => void;
  /** Destaca o item quando a pessoa tenta avançar sem responder. */
  pendente?: boolean;
};

/**
 * Um item do questionário com a escala de frequência.
 *
 * São radios de verdade (não botões), para que leitor de tela anuncie "opção 3
 * de 5" e para que a navegação por setas funcione sem JavaScript extra.
 */
export function EscalaResposta({ item, valor, aoEscolher, pendente }: Props) {
  return (
    <fieldset
      className={`rounded-xl border p-4 transition ${
        pendente ? "border-prioridade bg-prioridade-fundo" : "border-borda bg-cartao"
      }`}
    >
      {/* Um <legend> se posiciona sobre a borda do <fieldset> e não acompanha o
          fluxo, então um enunciado longo escapa da moldura. `float-left w-full`
          o traz para dentro, e o `clear-both` das opções logo abaixo é o que
          impede que elas subam para o lado dele. A esquisitice vale a pena para
          preservar fieldset/legend, que é o que faz o leitor de tela anunciar a
          pergunta antes de ler as cinco alternativas. */}
      <legend className="float-left w-full text-base font-medium">
        {item.enunciado}
      </legend>

      <div className="mt-3 grid clear-both grid-cols-5 gap-1.5">
        {ESCALA.map((opcao) => {
          const selecionado = valor === opcao.valor;
          return (
            <label
              key={opcao.valor}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center text-xs leading-tight transition ${
                selecionado
                  ? "border-primaria bg-primaria text-white"
                  : "border-borda bg-suave hover:border-primaria"
              }`}
            >
              <input
                type="radio"
                name={item.id}
                value={opcao.valor}
                checked={selecionado}
                onChange={() => aoEscolher(opcao.valor)}
                className="sr-only"
              />
              <span aria-hidden className="text-sm font-semibold">
                {opcao.valor}
              </span>
              <span>{opcao.rotulo}</span>
            </label>
          );
        })}
      </div>

      {pendente ? (
        <p className="mt-2 text-sm text-prioridade">Escolha uma opção para continuar.</p>
      ) : null}
    </fieldset>
  );
}
