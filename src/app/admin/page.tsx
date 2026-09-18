import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Medidor, classesDoNivel } from "@/components/Medidor";
import { ROTULOS_NIVEL, nivelDoEscore } from "@/lib/avaliacao";
import { sessaoAtiva } from "@/lib/admin";
import { K_MINIMO, gerarRelatorio, type Recorte } from "@/lib/relatorios";

import { sair } from "./acoes";

export const metadata: Metadata = {
  title: "Painel da gestão",
};

const PERIODOS = [
  { rotulo: "30 dias", dias: 30 },
  { rotulo: "90 dias", dias: 90 },
  { rotulo: "12 meses", dias: 365 },
  { rotulo: "Tudo", dias: null },
] as const;

export default async function PainelAdmin({ searchParams }: PageProps<"/admin">) {
  if (!(await sessaoAtiva())) redirect("/admin/login");

  const { periodo } = await searchParams;
  const dias = lerPeriodo(typeof periodo === "string" ? periodo : undefined);
  const relatorio = await gerarRelatorio(dias);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Painel da gestão</h1>
          <p className="mt-1 text-sm text-texto-suave">
            Apenas dados agregados. Recortes com menos de {K_MINIMO} respostas aparecem
            suprimidos.
          </p>
        </div>
        <form action={sair}>
          <button
            type="submit"
            className="rounded-lg border border-borda px-4 py-2 text-sm font-medium transition hover:border-primaria"
          >
            Sair
          </button>
        </form>
      </div>

      <nav className="mt-6 flex flex-wrap items-center gap-2">
        {PERIODOS.map((opcao) => {
          const ativo = dias === opcao.dias;
          return (
            <Link
              key={opcao.rotulo}
              href={opcao.dias === null ? "/admin?periodo=tudo" : `/admin?periodo=${opcao.dias}`}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                ativo
                  ? "border-primaria bg-primaria text-white"
                  : "border-borda hover:border-primaria"
              }`}
            >
              {opcao.rotulo}
            </Link>
          );
        })}

        <a
          href={`/admin/exportar?periodo=${dias ?? "tudo"}`}
          className="ml-auto rounded-lg border border-borda px-4 py-1.5 text-sm font-medium transition hover:border-primaria"
        >
          Exportar CSV
        </a>
      </nav>

      {relatorio.suprimido ? (
        <section className="mt-8 rounded-xl border border-borda bg-suave p-6">
          <h2 className="font-semibold">Ainda não há dados suficientes</h2>
          <p className="mt-2 text-sm text-texto-suave">
            Foram registradas {relatorio.total}{" "}
            {relatorio.total === 1 ? "resposta" : "respostas"} neste período. O painel
            só abre os números a partir de {K_MINIMO}, para que ninguém seja identificado
            por eliminação.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <Indicador rotulo="Respostas no período" valor={String(relatorio.total)} />
            <Indicador
              rotulo="Índice geral de saúde"
              valor={`${relatorio.mediaGeral}/100`}
              destaque={classesDoNivel(nivelDoEscore(relatorio.mediaGeral)).texto}
            />
            <Indicador
              rotulo="Sinalizações de risco"
              valor={String(relatorio.alertasUrgentes)}
              nota="Pessoas que marcaram o item de autolesão acima de 'Nunca'"
            />
          </section>

          {relatorio.alertasUrgentes > 0 ? (
            <p className="mt-4 rounded-xl border border-urgencia bg-urgencia-fundo p-4 text-sm">
              <strong>{relatorio.alertasUrgentes}</strong>{" "}
              {relatorio.alertasUrgentes === 1 ? "pessoa sinalizou" : "pessoas sinalizaram"}{" "}
              pensamentos de autolesão. Não há como saber quem — e é assim de propósito.
              O caminho é ampliar a oferta de cuidado para todo mundo: divulgação do CVV,
              rodas de conversa, ampliação do atendimento psicológico na região com mais
              sinalizações.
            </p>
          ) : null}

          <section className="mt-10">
            <h2 className="text-xl font-semibold">Como está cada área</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {relatorio.dimensoes.map((dimensao) => (
                <article
                  key={dimensao.id}
                  className="rounded-xl border border-borda bg-cartao p-4"
                >
                  <div className="flex items-baseline gap-2">
                    <span aria-hidden>{dimensao.icone}</span>
                    <h3 className="font-semibold">{dimensao.nome}</h3>
                  </div>
                  <div className="mt-3">
                    <Medidor escore={dimensao.media} nivel={dimensao.nivel} />
                  </div>
                  <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
                    {(["bom", "atencao", "prioridade"] as const).map((nivel) => (
                      <div key={nivel} className="flex gap-1">
                        <dt>{ROTULOS_NIVEL[nivel]}:</dt>
                        <dd className="font-medium tabular-nums">
                          {dimensao.distribuicao[nivel]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 grid gap-6 sm:grid-cols-2">
            <TabelaRecorte titulo="Por região" itens={relatorio.porRegiao} />
            <TabelaRecorte titulo="Por função" itens={relatorio.porFuncao} />
            <TabelaRecorte titulo="Por tempo de casa" itens={relatorio.porTempoCasa} />
            <TabelaRecorte titulo="Por faixa etária" itens={relatorio.porFaixaEtaria} />
          </section>

          {relatorio.serieMensal.length > 1 ? (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Evolução mês a mês</h2>
              <table className="mt-4 w-full text-sm">
                <thead className="border-b border-borda text-left text-texto-suave">
                  <tr>
                    <th className="py-2 font-medium">Mês</th>
                    <th className="py-2 font-medium">Respostas</th>
                    <th className="py-2 font-medium">Índice geral</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.serieMensal.map((mes) => (
                    <tr key={mes.mes} className="border-b border-borda">
                      <td className="py-2">{mes.mes}</td>
                      <td className="py-2 tabular-nums">{mes.n}</td>
                      <td className="py-2 tabular-nums">{mes.media}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function lerPeriodo(valor: string | undefined): number | null {
  if (valor === "tudo") return null;
  const dias = Number(valor);
  return PERIODOS.some((p) => p.dias === dias) ? dias : 90;
}

function Indicador({
  rotulo,
  valor,
  nota,
  destaque,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  destaque?: string;
}) {
  return (
    <div className="rounded-xl border border-borda bg-cartao p-4">
      <p className="text-sm text-texto-suave">{rotulo}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${destaque ?? ""}`}>{valor}</p>
      {nota ? <p className="mt-1 text-xs text-texto-suave">{nota}</p> : null}
    </div>
  );
}

function TabelaRecorte({ titulo, itens }: { titulo: string; itens: Recorte[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <table className="mt-3 w-full text-sm">
        <thead className="border-b border-borda text-left text-texto-suave">
          <tr>
            <th className="py-2 font-medium">Grupo</th>
            <th className="py-2 text-right font-medium">n</th>
            <th className="py-2 text-right font-medium">Índice</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.rotulo} className="border-b border-borda">
              <td className="py-2">{item.rotulo}</td>
              <td className="py-2 text-right tabular-nums">
                {item.suprimido ? `<${K_MINIMO}` : item.n}
              </td>
              <td className="py-2 text-right tabular-nums">
                {item.mediaGeral === null ? (
                  <span className="text-texto-suave" title={`Grupo com menos de ${K_MINIMO} respostas`}>
                    suprimido
                  </span>
                ) : (
                  `${item.mediaGeral}/100`
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
