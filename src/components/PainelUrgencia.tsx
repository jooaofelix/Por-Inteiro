import { servicosDeUrgencia } from "@/data/rede-apoio";

/**
 * Painel exibido quando a pessoa sinalizou pensamentos de autolesão.
 *
 * Aparece no topo do resultado e independe de qualquer escore: alguém pode
 * estar com todas as dimensões em verde e ainda assim ter marcado este item.
 */
export function PainelUrgencia() {
  return (
    <section className="rounded-xl border-2 border-urgencia bg-urgencia-fundo p-5">
      <h2 className="text-lg font-bold text-urgencia">
        Antes de qualquer outra coisa
      </h2>
      <p className="mt-2">
        Você marcou que tem tido pensamentos de não estar aqui ou de se machucar. Isso
        merece atenção agora — e existe gente pronta para te escutar, de graça e sem
        julgamento.
      </p>

      <ul className="mt-4 space-y-2">
        {servicosDeUrgencia().map((servico) => (
          <li key={servico.id} className="text-sm">
            <strong>{servico.nome}</strong>
            {servico.contato ? (
              <>
                {" — "}
                <span className="text-lg font-bold">{servico.contato}</span>
              </>
            ) : null}
            <p className="text-texto-suave">{servico.descricao}</p>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm">
        Se puder, conte hoje mesmo para alguém de confiança como você está. Não precisa
        explicar tudo.
      </p>
    </section>
  );
}
