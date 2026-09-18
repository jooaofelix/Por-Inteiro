"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";

import { EscalaResposta } from "@/components/EscalaResposta";
import {
  DIMENSOES,
  FAIXAS_ETARIAS,
  FUNCOES,
  ITEM_RISCO,
  ITENS,
  TEMPOS_DE_CASA,
  itensDaDimensao,
} from "@/data/questionario";
import { REGIOES, regiaoPorCep } from "@/data/regioes";

type Contexto = {
  regiao: string;
  funcao: string;
  tempoCasa: string;
  faixaEtaria: string;
};

const CONTEXTO_VAZIO: Contexto = {
  regiao: "",
  funcao: "",
  tempoCasa: "",
  faixaEtaria: "",
};

type Rascunho = { contexto: Contexto; respostas: Record<string, number> };

/**
 * Rascunho em sessionStorage, não em localStorage: muita gente responde em
 * computador compartilhado da unidade. Assim ele sobrevive a um F5 acidental
 * ou à aba recarregada pelo sistema no celular, mas morre quando a aba fecha.
 *
 * A retomada é sempre explícita, por botão. Restaurar sozinho faria as
 * respostas de saúde de uma pessoa reaparecerem na tela para a próxima que
 * sentasse naquele computador.
 */
const CHAVE_RASCUNHO = "por-inteiro:rascunho";

function lerRascunho(): string | null {
  try {
    return sessionStorage.getItem(CHAVE_RASCUNHO);
  } catch {
    // Navegador com armazenamento bloqueado: seguimos sem rascunho.
    return null;
  }
}

/** O rascunho só muda por ação desta própria tela, então não há o que assinar. */
function semAssinatura(): () => void {
  return () => {};
}

export function Formulario() {
  const router = useRouter();

  const [etapa, setEtapa] = useState(0);
  const [contexto, setContexto] = useState<Contexto>(CONTEXTO_VAZIO);
  const [cep, setCep] = useState("");
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [pendentes, setPendentes] = useState<Set<string>>(new Set());
  /** Vira `true` no primeiro toque da pessoa em qualquer campo desta sessão. */
  const [interagiu, setInteragiu] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const topo = useRef<HTMLDivElement>(null);

  // Etapas: contexto, uma por dimensão, e o item de triagem no fim.
  const totalEtapas = DIMENSOES.length + 2;

  // useSyncExternalStore lê o armazenamento sem quebrar a hidratação: no
  // servidor o instantâneo é sempre nulo, e o valor real entra depois que a
  // página vira interativa.
  const rascunhoSalvo = useSyncExternalStore(semAssinatura, lerRascunho, () => null);
  const [rascunhoResolvido, setRascunhoResolvido] = useState(false);

  const respondidas = ITENS.filter(
    (item) => typeof respostas[item.id] === "number",
  ).length;

  useEffect(() => {
    // Enquanto a pessoa não tocar em nada, ela acabou de chegar: gravar aqui
    // apagaria um rascunho anterior antes de ela decidir se quer retomá-lo.
    if (!interagiu) return;

    try {
      sessionStorage.setItem(
        CHAVE_RASCUNHO,
        JSON.stringify({ contexto, respostas } satisfies Rascunho),
      );
    } catch {
      // Sem armazenamento, o questionário continua funcionando em memória.
    }
  }, [contexto, respostas, interagiu]);

  // `interagiu` também faz o aviso sumir assim que a pessoa começa a responder:
  // sem ele o banner voltaria a aparecer, já que o próprio rascunho recém-salvo
  // é relido a cada render.
  const podeRetomar = !rascunhoResolvido && !interagiu && rascunhoSalvo !== null;

  function retomar() {
    setRascunhoResolvido(true);
    setInteragiu(true);
    if (!rascunhoSalvo) return;
    try {
      const rascunho = JSON.parse(rascunhoSalvo) as Partial<Rascunho>;
      if (rascunho.contexto) setContexto(rascunho.contexto);
      if (rascunho.respostas) setRespostas(rascunho.respostas);
    } catch {
      descartarRascunho();
    }
  }

  function descartar() {
    setRascunhoResolvido(true);
    descartarRascunho();
  }

  const responder = useCallback((id: string, valor: number) => {
    setInteragiu(true);
    setRespostas((atual) => ({ ...atual, [id]: valor }));
    setPendentes((atual) => {
      if (!atual.has(id)) return atual;
      const proximo = new Set(atual);
      proximo.delete(id);
      return proximo;
    });
  }, []);

  const aplicarCep = useCallback((entrada: string) => {
    setInteragiu(true);
    setCep(entrada);
    const regiao = regiaoPorCep(entrada);
    if (regiao) setContexto((atual) => ({ ...atual, regiao: regiao.slug }));
  }, []);

  const itensDaEtapa = useMemo(() => {
    if (etapa === 0 || etapa === totalEtapas - 1) return [];
    return itensDaDimensao(DIMENSOES[etapa - 1].id);
  }, [etapa, totalEtapas]);

  function irPara(proxima: number) {
    setEtapa(proxima);
    setErro(null);
    topo.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function avancar() {
    if (etapa === 0) {
      if (!contexto.regiao) {
        setErro("Escolha a sua região para podermos indicar apoio perto de você.");
        return;
      }
      irPara(1);
      return;
    }

    const faltando = itensDaEtapa.filter(
      (item) => typeof respostas[item.id] !== "number",
    );
    if (faltando.length > 0) {
      setPendentes(new Set(faltando.map((i) => i.id)));
      setErro(
        faltando.length === 1
          ? "Falta responder uma pergunta desta página."
          : `Faltam ${faltando.length} perguntas nesta página.`,
      );
      return;
    }

    irPara(etapa + 1);
  }

  async function enviar() {
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/respostas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          regiao: contexto.regiao,
          funcao: contexto.funcao || null,
          tempoCasa: contexto.tempoCasa || null,
          faixaEtaria: contexto.faixaEtaria || null,
          itens: respostas,
        }),
      });

      if (!resposta.ok) {
        const corpo: unknown = await resposta.json().catch(() => null);
        const mensagem =
          corpo && typeof corpo === "object" && "erro" in corpo
            ? String((corpo as { erro: unknown }).erro)
            : "Não foi possível salvar suas respostas.";
        throw new Error(mensagem);
      }

      const { codigo } = (await resposta.json()) as { codigo: string };
      descartarRascunho();
      router.push(`/resultado/${codigo}?novo=1`);
    } catch (causa) {
      setErro(
        causa instanceof Error
          ? causa.message
          : "Não foi possível salvar suas respostas. Tente de novo.",
      );
      setEnviando(false);
    }
  }

  const progresso = Math.round((respondidas / ITENS.length) * 100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8" ref={topo}>
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-texto-suave">
          <span>
            Etapa {etapa + 1} de {totalEtapas}
          </span>
          <span>
            {respondidas} de {ITENS.length} perguntas
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-suave"
          role="progressbar"
          aria-valuenow={progresso}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do questionário"
        >
          <div
            className="h-full rounded-full bg-acento transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {podeRetomar ? (
        <div className="mb-6 rounded-xl border border-primaria bg-primaria-clara p-4">
          <p className="font-medium">Você tem um questionário começado nesta aba.</p>
          <p className="mt-1 text-sm text-texto-suave">
            Se este computador é compartilhado, confira se o começo é seu antes de
            retomar.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={retomar}
              className="rounded-lg bg-primaria px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaria-escura"
            >
              Retomar de onde parei
            </button>
            <button
              type="button"
              onClick={descartar}
              className="rounded-lg border border-borda px-4 py-2 text-sm font-medium transition hover:border-primaria"
            >
              Começar do zero
            </button>
          </div>
        </div>
      ) : null}

      {etapa === 0 ? (
        <EtapaContexto
          contexto={contexto}
          cep={cep}
          aoMudarCep={aplicarCep}
          aoMudar={(campo, valor) => {
            setInteragiu(true);
            setContexto((atual) => ({ ...atual, [campo]: valor }));
          }}
        />
      ) : null}

      {etapa > 0 && etapa < totalEtapas - 1 ? (
        <section>
          <h1 className="text-2xl font-bold">
            <span aria-hidden className="mr-2">
              {DIMENSOES[etapa - 1].icone}
            </span>
            {DIMENSOES[etapa - 1].nome}
          </h1>
          <p className="mt-2 text-texto-suave">{DIMENSOES[etapa - 1].descricao}</p>
          <p className="mt-1 text-sm text-texto-suave">
            Pense nas últimas duas semanas. Não existe resposta certa — responda o que
            for verdade para você.
          </p>

          <div className="mt-6 space-y-4">
            {itensDaEtapa.map((item) => (
              <EscalaResposta
                key={item.id}
                item={item}
                valor={respostas[item.id]}
                aoEscolher={(valor) => responder(item.id, valor)}
                pendente={pendentes.has(item.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {etapa === totalEtapas - 1 ? (
        <EtapaRisco
          valor={respostas[ITEM_RISCO.id]}
          aoEscolher={(valor) => responder(ITEM_RISCO.id, valor)}
        />
      ) : null}

      {erro ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-prioridade bg-prioridade-fundo p-3 text-sm text-prioridade"
        >
          {erro}
        </p>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => irPara(Math.max(0, etapa - 1))}
          disabled={etapa === 0 || enviando}
          className="rounded-lg border border-borda px-5 py-2.5 font-medium transition hover:border-primaria disabled:invisible"
        >
          Voltar
        </button>

        {etapa < totalEtapas - 1 ? (
          <button
            type="button"
            onClick={avancar}
            className="rounded-lg bg-primaria px-6 py-2.5 font-semibold text-white transition hover:bg-primaria-escura"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="rounded-lg bg-primaria px-6 py-2.5 font-semibold text-white transition hover:bg-primaria-escura disabled:opacity-60"
          >
            {enviando ? "Preparando seu resultado…" : "Ver meu resultado"}
          </button>
        )}
      </div>
    </div>
  );
}

function descartarRascunho(): void {
  try {
    sessionStorage.removeItem(CHAVE_RASCUNHO);
  } catch {
    // Sem armazenamento não há o que descartar.
  }
}

function EtapaContexto({
  contexto,
  cep,
  aoMudarCep,
  aoMudar,
}: {
  contexto: Contexto;
  cep: string;
  aoMudarCep: (valor: string) => void;
  aoMudar: (campo: keyof Contexto, valor: string) => void;
}) {
  return (
    <section>
      <h1 className="text-2xl font-bold">Antes de começar</h1>
      <p className="mt-2 text-texto-suave">
        Só a região é obrigatória, e serve para indicarmos serviços perto de você. O
        resto ajuda a Fundação a enxergar onde o cuidado precisa chegar primeiro — e
        você pode pular tudo.
      </p>

      <div className="mt-6 space-y-5">
        <div className="rounded-xl border border-borda bg-cartao p-4">
          <label htmlFor="cep" className="block font-medium">
            CEP <span className="font-normal text-texto-suave">(opcional)</span>
          </label>
          <p className="mt-1 text-sm text-texto-suave">
            Usamos só os dois primeiros dígitos, para descobrir a região. O CEP
            completo não sai do seu navegador e não é guardado.
          </p>
          <input
            id="cep"
            inputMode="numeric"
            autoComplete="off"
            placeholder="00000-000"
            value={cep}
            onChange={(evento) => aoMudarCep(evento.target.value)}
            className="mt-3 w-40 rounded-lg border border-borda bg-suave px-3 py-2"
          />
        </div>

        <Selecao
          id="regiao"
          rotulo="Região"
          obrigatorio
          valor={contexto.regiao}
          aoMudar={(valor) => aoMudar("regiao", valor)}
          opcoes={REGIOES.map((r) => ({
            valor: r.slug,
            rotulo: `${r.nome} — ${r.referencias}`,
          }))}
        />

        <Selecao
          id="funcao"
          rotulo="Sua função"
          valor={contexto.funcao}
          aoMudar={(valor) => aoMudar("funcao", valor)}
          opcoes={FUNCOES.map((f) => ({ valor: f, rotulo: f }))}
        />

        <Selecao
          id="tempoCasa"
          rotulo="Há quanto tempo trabalha na Fundação"
          valor={contexto.tempoCasa}
          aoMudar={(valor) => aoMudar("tempoCasa", valor)}
          opcoes={TEMPOS_DE_CASA.map((t) => ({ valor: t, rotulo: t }))}
        />

        <Selecao
          id="faixaEtaria"
          rotulo="Faixa etária"
          valor={contexto.faixaEtaria}
          aoMudar={(valor) => aoMudar("faixaEtaria", valor)}
          opcoes={FAIXAS_ETARIAS.map((f) => ({ valor: f, rotulo: f }))}
        />
      </div>
    </section>
  );
}

function Selecao({
  id,
  rotulo,
  valor,
  opcoes,
  aoMudar,
  obrigatorio,
}: {
  id: string;
  rotulo: string;
  valor: string;
  opcoes: { valor: string; rotulo: string }[];
  aoMudar: (valor: string) => void;
  obrigatorio?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {rotulo}{" "}
        {obrigatorio ? null : (
          <span className="font-normal text-texto-suave">(opcional)</span>
        )}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        className="mt-2 w-full rounded-lg border border-borda bg-cartao px-3 py-2.5"
      >
        <option value="">Selecione…</option>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}

function EtapaRisco({
  valor,
  aoEscolher,
}: {
  valor: number | undefined;
  aoEscolher: (valor: number) => void;
}) {
  return (
    <section>
      <h1 className="text-2xl font-bold">Uma última pergunta</h1>
      <p className="mt-2 text-texto-suave">
        Essa é delicada, e por isso ela vem separada das outras e não entra em nenhuma
        pontuação. Se preferir não responder, pode pular e ver seu resultado.
      </p>

      <div className="mt-6">
        <EscalaResposta item={ITEM_RISCO} valor={valor} aoEscolher={aoEscolher} />
      </div>

      <div className="mt-6 rounded-xl border border-urgencia bg-urgencia-fundo p-4 text-sm">
        <p className="font-semibold text-urgencia">
          Se isso passa pela sua cabeça, você não precisa lidar com isso sozinho(a).
        </p>
        <p className="mt-2">
          O CVV atende de graça, 24 horas, pelo <strong>188</strong> — por telefone ou
          pelo chat em cvv.org.br. Em emergência, ligue <strong>192</strong>.
        </p>
      </div>
    </section>
  );
}
