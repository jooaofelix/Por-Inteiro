import type { Metadata } from "next";
import Link from "next/link";

import { ITENS } from "@/data/questionario";
import { K_MINIMO } from "@/lib/relatorios";

export const metadata: Metadata = {
  title: "Privacidade",
};

export default function PaginaPrivacidade() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">O que guardamos, e o que não</h1>
      <p className="mt-3 text-texto-suave">
        Uma ferramenta de saúde mental só funciona se a pessoa confiar nela. Então em vez
        de prometer sigilo, a gente explica exatamente como ele é feito.
      </p>

      <Bloco titulo="O que NÃO é guardado">
        <ul>
          <li>Nome, apelido, CPF, RG, matrícula ou número funcional.</li>
          <li>E-mail, telefone ou qualquer forma de contato.</li>
          <li>Unidade onde você trabalha.</li>
          <li>Endereço IP ou identificador do seu aparelho.</li>
          <li>
            Seu CEP completo. Ele é convertido em região ainda no seu navegador e
            descartado — o que sai do aparelho é só a região.
          </li>
          <li>O seu código de retorno em texto legível (veja abaixo).</li>
        </ul>
      </Bloco>

      <Bloco titulo="O que é guardado">
        <ul>
          <li>Suas respostas às {ITENS.length} perguntas e os escores calculados.</li>
          <li>A data em que você respondeu.</li>
          <li>A região (não a cidade, não o bairro, não o CEP).</li>
          <li>
            Função, tempo de casa e faixa etária, <strong>se</strong> você tiver
            escolhido informar. Todos são opcionais e ficam em faixas largas.
          </li>
          <li>
            Uma marca de que o item sobre pensamentos de autolesão foi respondido acima
            de &quot;Nunca&quot;, para a gestão saber quantas pessoas estão nessa
            situação — nunca quem são.
          </li>
        </ul>
      </Bloco>

      <Bloco titulo="Como funciona o código de retorno">
        <p>
          Ao terminar, o sistema gera um código aleatório do tipo{" "}
          <code className="font-mono">PI-A2C4-K7M9</code>. Ele é mostrado uma única vez e{" "}
          <strong>não é gravado</strong>: o banco guarda apenas um resumo criptográfico
          dele (SHA-256 com um segredo do servidor).
        </p>
        <p>
          Na prática: quem tiver uma cópia do banco de dados não consegue reabrir o
          resultado de ninguém, porque o resumo não volta a ser código. E se você perder
          o código, nem a equipe do projeto consegue recuperá-lo. Essa impossibilidade é
          intencional.
        </p>
      </Bloco>

      <Bloco titulo="O que a gestão vê">
        <p>
          O painel administrativo mostra <strong>apenas números somados</strong>: média
          por área de saúde, distribuição entre os níveis, comparação entre regiões,
          funções e faixas etárias. Não existe tela que mostre uma resposta individual —
          nem para a direção, nem para o RH.
        </p>
        <p>
          Qualquer recorte com menos de {K_MINIMO} respostas aparece suprimido, sem a
          média. É o que impede que &quot;a média da equipe técnica da região X&quot;,
          num grupo de duas pessoas, vire a resposta dessas duas pessoas.
        </p>
      </Bloco>

      <Bloco titulo="Para que servem esses números">
        <p>
          Para a Fundação enxergar onde o cuidado precisa chegar primeiro: se o
          esgotamento está concentrado em uma região, se o sono é pior em determinada
          função, se a rede de apoio de uma área precisa ser ampliada. Decisão sobre
          política de saúde do servidor, não sobre servidores.
        </p>
        <p>
          Seu resultado individual não é usado em avaliação de desempenho, sindicância,
          escala ou qualquer decisão sobre a sua vida funcional — e a estrutura do
          sistema torna isso impossível, porque o dado individual simplesmente não pode
          ser ligado a você.
        </p>
      </Bloco>

      <Bloco titulo="Se você está em um computador compartilhado">
        <p>
          O rascunho das respostas fica na aba do navegador e some quando você a fecha.
          Ainda assim, anote o código no papel em vez de salvá-lo no navegador, e feche
          a aba ao terminar.
        </p>
      </Bloco>

      <p className="mt-10">
        <Link href="/questionario" className="font-semibold text-acento-texto underline">
          Voltar e começar o questionário
        </Link>
      </p>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{titulo}</h2>
      <div className="mt-2 space-y-3 text-texto-suave [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
