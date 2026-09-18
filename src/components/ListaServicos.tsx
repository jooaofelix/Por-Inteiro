import type { Servico } from "@/data/rede-apoio";

/**
 * Serviços sugeridos.
 *
 * Entradas ainda não confirmadas pela equipe aparecem visualmente separadas e
 * com aviso explícito — mandar alguém a um serviço que não existe mais é pior
 * do que não indicar nada.
 */
export function ListaServicos({ servicos }: { servicos: Servico[] }) {
  if (servicos.length === 0) return null;

  const confirmados = servicos.filter((s) => s.verificado);
  const aConfirmar = servicos.filter((s) => !s.verificado);

  return (
    <div className="space-y-4">
      {confirmados.map((servico) => (
        <CartaoServico key={servico.id} servico={servico} />
      ))}

      {aConfirmar.length > 0 ? (
        <div className="rounded-xl border border-dashed border-borda p-4">
          <p className="text-sm font-medium text-texto-suave">
            Estes dependem da sua unidade e ainda estão sendo levantados pela equipe.
            Confirme antes de contar com eles.
          </p>
          <div className="mt-3 space-y-3">
            {aConfirmar.map((servico) => (
              <CartaoServico key={servico.id} servico={servico} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CartaoServico({ servico }: { servico: Servico }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        servico.urgencia
          ? "border-urgencia bg-urgencia-fundo"
          : "border-borda bg-cartao"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-semibold">{servico.nome}</h3>
        {servico.gratuito ? (
          <span className="rounded-full bg-bom-fundo px-2 py-0.5 text-xs font-medium text-bom">
            Gratuito
          </span>
        ) : null}
      </div>

      <p className="mt-1.5 text-sm text-texto-suave">{servico.descricao}</p>

      {servico.contato ? (
        <p className="mt-2 text-sm">
          <span className="text-texto-suave">Como chegar: </span>
          <strong>{servico.contato}</strong>
        </p>
      ) : null}

      {servico.site ? (
        <a
          href={servico.site}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm font-medium text-acento-texto underline"
        >
          {servico.site.replace(/^https?:\/\//, "")}
        </a>
      ) : null}
    </div>
  );
}
