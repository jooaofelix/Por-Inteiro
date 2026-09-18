import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CodigoRetorno } from "@/components/CodigoRetorno";
import { ListaServicos } from "@/components/ListaServicos";
import { Medidor, classesDoNivel } from "@/components/Medidor";
import { PainelUrgencia } from "@/components/PainelUrgencia";
import type { TipoServico } from "@/data/questionario";
import { servicosPara } from "@/data/rede-apoio";
import { buscarRegiao } from "@/data/regioes";
import {
  DESCRICOES_NIVEL,
  calcularResultado,
  type Respostas,
} from "@/lib/avaliacao";
import { hashCodigo, normalizarCodigo } from "@/lib/codigo";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Seu resultado",
  robots: { index: false, follow: false },
};

export default async function PaginaResultado({
  params,
  searchParams,
}: PageProps<"/resultado/[codigo]">) {
  const { codigo: codigoBruto } = await params;
  const { novo } = await searchParams;

  const codigo = normalizarCodigo(decodeURIComponent(codigoBruto));
  if (!codigo) notFound();

  const registro = await prisma.resposta.findUnique({
    where: { codigoHash: hashCodigo(codigo) },
    select: { criadoEm: true, regiao: true, itens: true },
  });
  if (!registro) notFound();

  const respostas = JSON.parse(registro.itens) as Respostas;
  const resultado = calcularResultado(respostas);
  const regiao = buscarRegiao(registro.regiao);

  // Um serviço só aparece uma vez, mesmo quando várias dimensões o indicam.
  const tipos = new Set<TipoServico>();
  for (const dimensao of resultado.dimensoes) {
    for (const tipo of dimensao.encaminhamentos) tipos.add(tipo);
  }
  const servicos = servicosPara([...tipos], registro.regiao);

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(registro.criadoEm);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      {novo ? <CodigoRetorno codigo={codigo} /> : null}

      {resultado.alertaUrgente ? <PainelUrgencia /> : null}

      <section>
        <p className="text-sm text-texto-suave">Respondido em {dataFormatada}</p>
        <h1 className="mt-1 text-3xl font-bold">Seu retrato de hoje</h1>
        <p className="mt-3 text-texto-suave">
          Isto é uma fotografia das últimas duas semanas, não um diagnóstico. Serve para
          você enxergar onde apertar o cuidado — e onde você já está indo bem.
        </p>

        <div className="mt-6 rounded-xl border border-borda bg-cartao p-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">Como você está no geral</h2>
            <span
              className={`text-3xl font-bold tabular-nums ${classesDoNivel(resultado.nivelGeral).texto}`}
            >
              {resultado.escoreGeral}
            </span>
          </div>
          <div className="mt-3">
            <Medidor escore={resultado.escoreGeral} nivel={resultado.nivelGeral} />
          </div>
          <p className="mt-3 text-sm text-texto-suave">
            {DESCRICOES_NIVEL[resultado.nivelGeral]}
          </p>
        </div>
      </section>

      {resultado.prioridades.length > 0 ? (
        <section className="rounded-xl border border-prioridade bg-prioridade-fundo p-5">
          <h2 className="font-bold text-prioridade">Por onde começar</h2>
          <p className="mt-1 text-sm">
            Se você só tiver energia para mexer em uma coisa agora, que seja{" "}
            <strong>{resultado.prioridades[0].dimensao.nome.toLowerCase()}</strong>. É o
            que está pesando mais.
          </p>
          {resultado.prioridades.length > 1 ? (
            <p className="mt-2 text-sm text-texto-suave">
              Também pedem atenção:{" "}
              {resultado.prioridades
                .slice(1)
                .map((p) => p.dimensao.nome.toLowerCase())
                .join(", ")}
              .
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold">Área por área</h2>

        {resultado.dimensoes.map((item) => (
          <article
            key={item.dimensao.id}
            className="rounded-xl border border-borda bg-cartao p-5"
          >
            <div className="flex items-baseline gap-2">
              <span aria-hidden className="text-lg">
                {item.dimensao.icone}
              </span>
              <h3 className="text-lg font-semibold">{item.dimensao.nome}</h3>
            </div>

            <div className="mt-3">
              <Medidor escore={item.escore} nivel={item.nivel} />
            </div>

            <p className="mt-3 text-sm text-texto-suave">
              {DESCRICOES_NIVEL[item.nivel]}
            </p>

            {item.pontosDeAtencao.length > 0 ? (
              <div className="mt-4 rounded-lg bg-suave p-3">
                <p className="text-sm font-medium">O que mais pesou aqui</p>
                <ul className="mt-1.5 space-y-1 text-sm text-texto-suave">
                  {item.pontosDeAtencao.map((ponto) => (
                    <li key={ponto}>— {ponto}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4">
              <p className="text-sm font-medium">
                {item.nivel === "bom" ? "Para manter" : "O que dá para fazer"}
              </p>
              <ul className="mt-2 space-y-2">
                {item.recomendacoes.map((recomendacao) => (
                  <li key={recomendacao} className="flex gap-2 text-sm">
                    <span aria-hidden className="text-acento">
                      ▸
                    </span>
                    <span>{recomendacao}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Apoio perto de você</h2>
        <p className="mt-2 text-texto-suave">
          {regiao && regiao.slug !== "outra" ? (
            <>
              Serviços para <strong>{regiao.nome}</strong> e canais que atendem todo o
              estado.
            </>
          ) : (
            <>Canais que atendem todo o país, já que a região não foi informada.</>
          )}
        </p>

        <div className="mt-5">
          <ListaServicos servicos={servicos} />
        </div>
      </section>

      <section className="sem-impressao rounded-xl border border-borda bg-suave p-5">
        <h2 className="font-semibold">Guarde este resultado</h2>
        <p className="mt-1 text-sm text-texto-suave">
          Use o código <strong className="font-mono">{codigo}</strong> em{" "}
          <Link href="/acompanhar" className="text-acento-texto underline">
            &quot;já tenho um código&quot;
          </Link>{" "}
          para reabrir esta página. Responder de novo daqui a alguns meses mostra o que
          mudou.
        </p>
        <p className="mt-3 text-sm text-texto-suave">
          Para imprimir ou salvar em PDF, use a impressão do navegador.
        </p>
      </section>

      <p className="text-sm text-texto-suave">
        O Por Inteiro não faz diagnóstico. Se algo aqui bateu forte, leve este retrato
        para um profissional de saúde — ele ajuda a começar a conversa.
      </p>
    </div>
  );
}
