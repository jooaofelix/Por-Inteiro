/**
 * Pontuação do autodiagnóstico e montagem da devolutiva.
 *
 * Régua: cada item vale de 0 a 4. Itens negativos são invertidos, de forma que
 * o escore final de cada dimensão vai de 0 a 100 e MAIOR É SEMPRE MELHOR.
 * Isso vale para todas as dimensões, o que deixa o resultado comparável e o
 * gráfico da gestão legível sem legenda.
 */

import {
  DIMENSOES,
  ITEM_RISCO,
  ITENS,
  VALOR_MAXIMO,
  buscarDimensao,
  itensDaDimensao,
  type Dimensao,
  type DimensaoId,
  type TipoServico,
} from "@/data/questionario";

export type Nivel = "bom" | "atencao" | "prioridade";

export type Respostas = Record<string, number>;

export type ResultadoDimensao = {
  dimensao: Dimensao;
  escore: number;
  nivel: Nivel;
  /** Enunciados que mais puxaram o escore para baixo, até três. */
  pontosDeAtencao: string[];
  recomendacoes: string[];
  encaminhamentos: TipoServico[];
};

export type Resultado = {
  escoreGeral: number;
  nivelGeral: Nivel;
  dimensoes: ResultadoDimensao[];
  /** Dimensões em `prioridade`, da pior para a menos grave. */
  prioridades: ResultadoDimensao[];
  alertaUrgente: boolean;
};

const LIMITE_BOM = 70;
const LIMITE_ATENCAO = 45;

export const ROTULOS_NIVEL: Record<Nivel, string> = {
  bom: "Indo bem",
  atencao: "Sinal de atenção",
  prioridade: "Precisa de cuidado agora",
};

export const DESCRICOES_NIVEL: Record<Nivel, string> = {
  bom: "O que você já faz aqui está funcionando. Vale manter.",
  atencao: "Ainda dá para virar o jogo com mudanças pequenas e constantes.",
  prioridade: "Esta área está pesando. Procurar apoio aqui faz diferença real.",
};

export function nivelDoEscore(escore: number): Nivel {
  if (escore >= LIMITE_BOM) return "bom";
  if (escore >= LIMITE_ATENCAO) return "atencao";
  return "prioridade";
}

/**
 * Valor do item já na direção "quanto maior, melhor".
 * Um item negativo respondido com "Sempre" (4) vale 0.
 */
function valorNormalizado(positivo: boolean, valor: number): number {
  return positivo ? valor : VALOR_MAXIMO - valor;
}

export function calcularResultado(respostas: Respostas): Resultado {
  const dimensoes = DIMENSOES.map((dimensao) =>
    avaliarDimensao(dimensao.id, respostas),
  );

  const escoreGeral = Math.round(
    dimensoes.reduce((soma, d) => soma + d.escore, 0) / dimensoes.length,
  );

  const prioridades = dimensoes
    .filter((d) => d.nivel === "prioridade")
    .sort((a, b) => a.escore - b.escore);

  return {
    escoreGeral,
    nivelGeral: nivelDoEscore(escoreGeral),
    dimensoes,
    prioridades,
    alertaUrgente: (respostas[ITEM_RISCO.id] ?? 0) > 0,
  };
}

function avaliarDimensao(id: DimensaoId, respostas: Respostas): ResultadoDimensao {
  const dimensao = buscarDimensao(id);
  const itens = itensDaDimensao(id);

  const obtido = itens.reduce(
    (soma, item) =>
      soma + valorNormalizado(item.positivo, respostas[item.id] ?? 0),
    0,
  );
  const maximo = itens.length * VALOR_MAXIMO;
  const escore = maximo === 0 ? 0 : Math.round((obtido / maximo) * 100);
  const nivel = nivelDoEscore(escore);

  // Os itens em que a pessoa está pior — é o que a devolutiva deve nomear,
  // em vez de repetir o escore com outras palavras.
  const pontosDeAtencao = itens
    .map((item) => ({
      enunciado: item.enunciado,
      valor: valorNormalizado(item.positivo, respostas[item.id] ?? 0),
    }))
    .filter((i) => i.valor <= 1)
    .sort((a, b) => a.valor - b.valor)
    .slice(0, 3)
    .map((i) => i.enunciado);

  return {
    dimensao,
    escore,
    nivel,
    pontosDeAtencao,
    recomendacoes: RECOMENDACOES[id][nivel],
    encaminhamentos: nivel === "bom" ? [] : dimensao.encaminhamentos,
  };
}

/** Escores por dimensão, no formato gravado no banco. */
export function escoresPorDimensao(respostas: Respostas): Record<string, number> {
  const escores: Record<string, number> = {};
  for (const d of DIMENSOES) {
    escores[d.id] = avaliarDimensao(d.id, respostas).escore;
  }
  return escores;
}

/** `true` quando todos os itens pontuáveis foram respondidos. */
export function questionarioCompleto(respostas: Respostas): boolean {
  return ITENS.every((item) => typeof respostas[item.id] === "number");
}

/**
 * O que fazer para melhorar — o ponto central do projeto.
 *
 * Cada bloco é escrito para caber na rotina de quem faz plantão: ações
 * pequenas, concretas e que não dependem de dinheiro ou de tempo que a pessoa
 * não tem. Conteúdo revisável pela equipe técnica sem mexer no resto do código.
 */
const RECOMENDACOES: Record<DimensaoId, Record<Nivel, string[]>> = {
  mental: {
    bom: [
      "Continue nomeando o que sente: escrever duas linhas no fim do plantão ajuda a perceber uma virada antes que ela aperte.",
      "Mantenha o que já te sustenta — fé, família, hobby, terapia. É isso que segura nos meses difíceis.",
      "Você pode ser a pessoa com quem um colega vai desabafar. Perguntar “como você tá?” e esperar a resposta já é cuidado.",
    ],
    atencao: [
      "Separe 10 minutos por dia sem celular e sem trabalho. Pode ser no carro antes de entrar em casa. O objetivo é sair do modo alerta.",
      "Conte para alguém de confiança como você tem se sentido, com essas palavras mesmo. Guardar sozinho é o que mais pesa.",
      "Se o desânimo ou a ansiedade já duram mais de duas semanas seguidas, marque uma conversa com um psicólogo — não precisa esperar piorar.",
      "Reduza o que dá para reduzir: uma hora extra a menos na semana já muda o corpo.",
    ],
    prioridade: [
      "Procure atendimento psicológico nas próximas semanas. Na lista abaixo há opções gratuitas na sua região.",
      "Fale com alguém hoje ou amanhã — alguém da família, um amigo, um colega. Não precisa explicar tudo, só não passar por isso sozinho(a).",
      "Se você já está sem conseguir trabalhar, dormir ou comer direito, leve isso a um serviço de saúde: pode haver tratamento e afastamento necessário, e isso é direito, não fraqueza.",
      "O CVV atende de graça, 24 horas, pelo telefone 188. Não é só para emergência — é para quando você precisa falar.",
    ],
  },
  estresse: {
    bom: [
      "Você tem conseguido separar trabalho e vida. Proteja esse limite: ele é o que evita o esgotamento lá na frente.",
      "Continue dividindo os casos difíceis com a equipe. Supervisão e conversa entre pares são o que impede a história de virar peso individual.",
    ],
    atencao: [
      "Crie um ritual de saída do plantão: trocar de roupa, ouvir uma música específica, dar uma volta no quarteirão. O corpo precisa de um sinal de que acabou.",
      "Depois de uma ocorrência pesada, converse com alguém da equipe no mesmo dia. Falar em cima da hora evita que a cena volte sozinha depois.",
      "Reveja a escala com a chefia se estiver acumulando plantões. Sobrecarga contínua não se resolve com força de vontade.",
      "Tire suas férias inteiras. Fracionar tudo em pedacinhos não recupera ninguém.",
    ],
    prioridade: [
      "O que você descreve tem cara de esgotamento profissional, e ele não passa com descanso de fim de semana. Procure apoio psicológico.",
      "Leve a situação para a chefia ou para o setor de saúde do servidor: remanejamento, redução de carga e afastamento são medidas previstas e existem para isso.",
      "Se você repassa mentalmente cenas do trabalho, tem sobressaltos ou evita lembrar do que aconteceu, isso tem nome e tem tratamento. Busque um psicólogo com experiência em trauma.",
      "Combine com um colega de confiança de vocês se checarem depois de plantões pesados. Rede entre pares é o apoio que chega mais rápido.",
    ],
  },
  sono: {
    bom: [
      "Seu descanso está dando conta. Manter horário parecido para dormir, inclusive nas folgas, é o que segura isso.",
    ],
    atencao: [
      "Desligue telas 30 minutos antes de deitar e deixe o quarto escuro e fresco — em turno noturno, cortina blackout muda o jogo.",
      "Evite café depois das 16h e álcool para dormir: o álcool até apaga, mas estraga a segunda metade da noite.",
      "Se trabalha à noite, durma em um bloco só, sempre no mesmo horário, e avise em casa que aquele período é sagrado.",
      "Cochilo de 20 minutos antes do plantão ajuda. Mais que isso, atrapalha o sono da noite.",
    ],
    prioridade: [
      "Leve a queixa de sono a um médico na UBS: insônia crônica tem tratamento, e não precisa começar por remédio.",
      "Não use remédio para dormir por conta própria nem emprestado de alguém. O risco de dependência é real e alto em quem faz plantão.",
      "Se você acorda cansado(a) mesmo dormindo bastante, ou ronca muito, peça avaliação — pode ser apneia, e isso afeta coração e humor.",
      "Sono ruim por meses costuma andar junto com ansiedade ou depressão. Vale tratar as duas coisas ao mesmo tempo.",
    ],
  },
  fisica: {
    bom: [
      "Você já se movimenta e sente disposição. Um educador físico pode ajudar a variar o treino para não estacionar.",
      "Mantenha os exames de rotina em dia mesmo se sentindo bem — é o que pega as coisas cedo.",
    ],
    atencao: [
      "Comece por 20 minutos de caminhada, três vezes por semana. É o suficiente para mudar humor e sono, e cabe até no dia de plantão.",
      "Procure os equipamentos públicos da sua cidade: academia ao ar livre, CEU, pista, aula gratuita na praça. Tem na lista abaixo.",
      "Para dor de coluna, pescoço e ombros, fortalecimento orientado resolve mais que repouso. Um educador físico ou fisioterapeuta monta algo simples.",
      "Agende o check-up que está atrasado. Marcar é a parte difícil; o resto é rápido.",
    ],
    prioridade: [
      "Antes de começar qualquer atividade, passe na UBS para uma avaliação — principalmente se tem pressão alta, diabetes ou dor forte.",
      "Se a dor já atrapalha o trabalho, procure fisioterapia. Dor crônica não é algo para aguentar calado.",
      "Comece devagar e acompanhado(a): educador físico em academia, posto ou programa municipal. Recomeçar sozinho(a) e forte é a receita para desistir na segunda semana.",
      "Movimento é também tratamento para ansiedade e depressão. Não é substituto do resto, mas soma de verdade.",
    ],
  },
  alimentar: {
    bom: [
      "Sua rotina alimentar está sustentando o dia. Se quiser ajustar por algum objetivo de saúde, um nutricionista afina o plano.",
    ],
    atencao: [
      "Leve comida de casa nos dias de plantão. Deixar marmita pronta na folga é o que evita o lanche da esquina às 3 da manhã.",
      "Coma de três em três horas, mesmo que pouco. Ficar muitas horas sem comer é o que empurra para o ultraprocessado depois.",
      "Deixe uma garrafa de água à vista no posto de trabalho. Beber sem lembrar é mais fácil do que lembrar de beber.",
      "Inclua uma fruta ou uma porção de verdura em uma refeição por dia. Uma só, todo dia, já é mudança.",
    ],
    prioridade: [
      "Peça encaminhamento para nutricionista na UBS. O acompanhamento é gratuito e serve para qualquer objetivo, não só emagrecimento.",
      "Se você pula refeições no plantão e compensa comendo muito depois, isso mexe com sono, humor e peso. Vale tratar como questão de saúde, não de disciplina.",
      "Faça exames de rotina (glicemia, colesterol, pressão). Trabalho noturno aumenta o risco metabólico e é melhor acompanhar de perto.",
      "Comece por uma refeição do dia, não pelo cardápio inteiro. Café da manhã costuma ser a mais fácil de organizar.",
    ],
  },
  apoio: {
    bom: [
      "Ter com quem contar é o maior fator de proteção nesse trabalho. Cuide dessas relações como você cuida da escala.",
      "Se puder, seja ponto de apoio para um colega mais novo. A rede se fortalece assim.",
    ],
    atencao: [
      "Marque uma coisa com gente fora do trabalho a cada quinze dias. Convívio que não é sobre a unidade recarrega diferente.",
      "Combine com um colega de confiança de vocês se perguntarem, de verdade, como estão depois de plantões pesados.",
      "Se você percebeu que tem bebido ou fumado mais para relaxar, observe a frequência por duas semanas. Perceber cedo é o que evita virar dependência.",
      "O CRAS da sua região oferece grupos e acompanhamento gratuitos, e não é só para quem está em situação de pobreza.",
    ],
    prioridade: [
      "Isolamento e uso de substâncias para aguentar a rotina costumam vir juntos, e os dois têm tratamento gratuito.",
      "O CAPS AD atende uso de álcool e outras drogas sem julgamento e sem encaminhamento prévio — é só chegar.",
      "Escolha uma pessoa e conte hoje como você está. Uma só, e sem precisar explicar tudo.",
      "Se você sente que não tem para quem pedir ajuda, o CVV (188) atende 24 horas, de graça, e existe exatamente para isso.",
    ],
  },
};
