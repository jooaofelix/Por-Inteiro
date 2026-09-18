import { sessaoAtiva } from "@/lib/admin";
import { gerarRelatorio, relatorioParaCsv } from "@/lib/relatorios";

/**
 * Exporta o relatório em CSV.
 *
 * Exporta apenas agregados, pelo mesmo motivo que a tela mostra apenas
 * agregados: um CSV com uma linha por resposta, contendo região, função e
 * faixa etária, seria reidentificável em unidades pequenas — e uma vez baixado,
 * escapa de qualquer controle do sistema.
 */
export async function GET(request: Request) {
  if (!(await sessaoAtiva())) {
    return new Response("Não autorizado", { status: 401 });
  }

  const periodo = new URL(request.url).searchParams.get("periodo");
  const dias = periodo === "tudo" || periodo === null ? null : Number(periodo);
  const relatorio = await gerarRelatorio(Number.isFinite(dias) ? dias : null);

  if (relatorio.suprimido) {
    return new Response(
      "Não há respostas suficientes no período para gerar um relatório.",
      { status: 409 },
    );
  }

  const nome = `por-inteiro-${periodo ?? "tudo"}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(`﻿${relatorioParaCsv(relatorio)}`, {
    headers: {
      // BOM acima para o Excel em português abrir os acentos corretamente.
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nome}"`,
    },
  });
}
