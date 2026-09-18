import Link from "next/link";

import { Simbolo } from "@/components/Marca";
import { DIMENSOES, ITENS } from "@/data/questionario";

export default function Inicio() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="flex items-center gap-4">
        <Simbolo className="h-14 w-14 shrink-0" corDoVao="var(--fundo)" />
        <div>
          <p className="text-sm font-semibold tracking-wide text-acento-texto uppercase">
            Fundação CASA · saúde do servidor
          </p>
          <p className="font-marca text-lg font-semibold">
            Um olhar para a saúde de quem cuida.
          </p>
        </div>
      </div>

      <h1 className="mt-6 text-4xl font-bold text-balance sm:text-5xl">
        Você cuida de adolescentes o dia inteiro. Quem cuida de você?
      </h1>

      <p className="mt-5 text-lg text-texto-suave">
        São {ITENS.length} perguntas sobre como anda sua saúde — mental, física,
        alimentação, sono, descanso e rede de apoio. No fim, você recebe um retrato do
        seu momento, o que dá para fazer para melhorar e os serviços de apoio da sua
        região.
      </p>

      <div className="mt-8 rounded-xl border border-borda bg-primaria-clara p-5">
        <h2 className="font-semibold">É anônimo de verdade</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            Não pedimos nome, matrícula, CPF, e-mail nem telefone. Em nenhum momento.
          </li>
          <li>
            Sua chefia e o RH não recebem a sua resposta. A gestão só vê números
            somados de grupos grandes — nunca uma pessoa.
          </li>
          <li>
            Você sai com um código para reabrir o seu resultado depois. O código é só
            seu: nem nós conseguimos recuperá-lo.
          </li>
        </ul>
        <Link href="/privacidade" className="mt-3 inline-block text-sm font-medium text-acento-texto underline">
          Ver em detalhe o que é guardado
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/questionario"
          className="rounded-lg bg-primaria px-6 py-3 text-center font-semibold text-white transition hover:bg-primaria-escura"
        >
          Começar — leva de 5 a 8 minutos
        </Link>
        <Link
          href="/acompanhar"
          className="rounded-lg border border-borda px-6 py-3 text-center font-medium transition hover:border-primaria hover:text-acento-texto"
        >
          Já respondi, tenho um código
        </Link>
      </div>

      <h2 className="mt-14 text-2xl font-semibold">O que o questionário olha</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {DIMENSOES.map((dimensao) => (
          <div
            key={dimensao.id}
            className="rounded-xl border border-borda bg-cartao p-4"
          >
            <div className="flex items-baseline gap-2">
              <span aria-hidden className="text-lg">
                {dimensao.icone}
              </span>
              <h3 className="font-semibold">{dimensao.nome}</h3>
            </div>
            <p className="mt-1 text-sm text-texto-suave">{dimensao.descricao}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 text-2xl font-semibold">Como funciona</h2>
      <ol className="mt-5 space-y-4">
        {[
          {
            titulo: "Você responde sozinho(a), no seu tempo",
            texto:
              "Pode ser no celular, no intervalo ou em casa. Dá para parar e voltar na mesma tela.",
          },
          {
            titulo: "Recebe um retrato do seu momento",
            texto:
              "Cada área ganha um resultado, com o que está sustentando você e o que está pesando.",
          },
          {
            titulo: "Vê o que dá para fazer",
            texto:
              "Orientações práticas, do tamanho de quem faz plantão — não conselho genérico de internet.",
          },
          {
            titulo: "Encontra apoio perto de você",
            texto:
              "Psicólogos, CAPS, UBS, nutrição, educadores físicos, academias e assistência social da sua região.",
          },
        ].map((passo, indice) => (
          <li key={passo.titulo} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primaria text-sm font-semibold text-white">
              {indice + 1}
            </span>
            <div>
              <h3 className="font-semibold">{passo.titulo}</h3>
              <p className="text-sm text-texto-suave">{passo.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-14 overflow-hidden rounded-2xl bg-marinho p-8 text-white">
        <p className="font-marca text-2xl font-bold text-balance">
          Todas as suas partes importam.
        </p>
        <p className="mt-2 max-w-md text-sm text-claro">
          Saúde, equilíbrio, bem-estar e propósito caminham juntos. Pessoas que cuidam
          também precisam de cuidado.
        </p>
        <Link
          href="/questionario"
          className="mt-6 inline-block rounded-lg bg-vivo px-6 py-3 font-semibold text-white transition hover:brightness-110"
        >
          Responder agora
        </Link>
      </section>
    </div>
  );
}
