/**
 * Conteúdo do autodiagnóstico.
 *
 * É um instrumento de AUTOAVALIAÇÃO e encaminhamento, não um teste
 * diagnóstico. Os itens são inspirados no formato de escalas de rastreio
 * conhecidas (frequência nas últimas duas semanas, itens positivos e
 * negativos misturados), mas foram escritos para a rotina de quem trabalha na
 * socioeducação. Nenhum resultado aqui substitui avaliação profissional, e a
 * interface repete isso em todas as telas de resultado.
 *
 * Para revisar o conteúdo com a equipe técnica, este é o único arquivo que
 * precisa ser alterado: enunciados, dimensões e recomendações vivem todos
 * aqui.
 */

export type DimensaoId =
  | "mental"
  | "estresse"
  | "sono"
  | "fisica"
  | "alimentar"
  | "apoio";

/** Serviços que podem ser sugeridos como encaminhamento. */
export type TipoServico =
  | "emergencia"
  | "psicologia"
  | "psiquiatria"
  | "caps"
  | "caps_ad"
  | "ubs"
  | "nutricao"
  | "educacao_fisica"
  | "academia"
  | "esporte_publico"
  | "fisioterapia"
  | "assistencia_social";

export type Item = {
  id: string;
  dimensao: DimensaoId;
  enunciado: string;
  /**
   * `true` quando concordar mais é sinal de saúde ("Durmo o suficiente").
   * `false` quando concordar mais é sinal de sofrimento ("Acordo cansado").
   * A pontuação inverte os itens negativos para que, no fim, 100 seja sempre
   * o melhor cenário em todas as dimensões.
   */
  positivo: boolean;
};

export type Dimensao = {
  id: DimensaoId;
  nome: string;
  /** Frase curta que explica o que a dimensão mede, exibida no resultado. */
  descricao: string;
  /** Ordem de apresentação e agrupamento das etapas do formulário. */
  icone: string;
  /** Tipos de serviço sugeridos quando a dimensão precisa de atenção. */
  encaminhamentos: TipoServico[];
};

export const ESCALA = [
  { valor: 0, rotulo: "Nunca" },
  { valor: 1, rotulo: "Raramente" },
  { valor: 2, rotulo: "Às vezes" },
  { valor: 3, rotulo: "Quase sempre" },
  { valor: 4, rotulo: "Sempre" },
] as const;

export const VALOR_MAXIMO = 4;

export const DIMENSOES: Dimensao[] = [
  {
    id: "mental",
    nome: "Saúde mental e emocional",
    descricao: "Como têm estado seu humor, sua ansiedade e seu ânimo.",
    icone: "🧠",
    encaminhamentos: ["psicologia", "caps", "psiquiatria", "ubs"],
  },
  {
    id: "estresse",
    nome: "Estresse e esgotamento no trabalho",
    descricao:
      "O peso que a rotina da unidade deixa em você depois do expediente.",
    icone: "🔥",
    encaminhamentos: ["psicologia", "caps", "assistencia_social"],
  },
  {
    id: "sono",
    nome: "Sono e descanso",
    descricao: "Se você tem conseguido se recuperar entre um turno e outro.",
    icone: "🌙",
    encaminhamentos: ["ubs", "psicologia", "psiquiatria"],
  },
  {
    id: "fisica",
    nome: "Saúde física",
    descricao: "Movimento, disposição, dores e cuidado de rotina com o corpo.",
    icone: "💪",
    encaminhamentos: [
      "educacao_fisica",
      "academia",
      "esporte_publico",
      "fisioterapia",
      "ubs",
    ],
  },
  {
    id: "alimentar",
    nome: "Alimentação",
    descricao: "Como você tem comido no meio da correria dos plantões.",
    icone: "🥗",
    encaminhamentos: ["nutricao", "ubs"],
  },
  {
    id: "apoio",
    nome: "Rede de apoio e vínculos",
    descricao: "Com quem você pode contar e como tem lidado com a pressão.",
    icone: "🤝",
    encaminhamentos: ["assistencia_social", "psicologia", "caps_ad"],
  },
];

export const ITENS: Item[] = [
  // Saúde mental e emocional
  { id: "m1", dimensao: "mental", positivo: false, enunciado: "Nas últimas duas semanas, me senti para baixo, desanimado(a) ou sem esperança." },
  { id: "m2", dimensao: "mental", positivo: false, enunciado: "Tenho tido pouco interesse ou pouco prazer em fazer as coisas de que gostava." },
  { id: "m3", dimensao: "mental", positivo: false, enunciado: "Tenho me sentido nervoso(a), ansioso(a) ou no limite." },
  { id: "m4", dimensao: "mental", positivo: true, enunciado: "Consigo lidar com as emoções difíceis que aparecem no trabalho." },
  { id: "m5", dimensao: "mental", positivo: true, enunciado: "Sinto que o que eu faço tem sentido." },

  // Estresse e esgotamento no trabalho
  { id: "e1", dimensao: "estresse", positivo: false, enunciado: "Termino o plantão emocionalmente esgotado(a)." },
  { id: "e2", dimensao: "estresse", positivo: true, enunciado: "Consigo me desligar do trabalho quando chego em casa." },
  { id: "e3", dimensao: "estresse", positivo: false, enunciado: "Situações difíceis que vivi na unidade ficam se repetindo na minha cabeça." },
  { id: "e4", dimensao: "estresse", positivo: true, enunciado: "Sinto que meu trabalho é reconhecido." },
  { id: "e5", dimensao: "estresse", positivo: true, enunciado: "Tenho com quem dividir as situações pesadas do trabalho." },

  // Sono e descanso
  { id: "s1", dimensao: "sono", positivo: true, enunciado: "Durmo o suficiente para acordar descansado(a)." },
  { id: "s2", dimensao: "sono", positivo: false, enunciado: "Tenho dificuldade para pegar no sono ou acordo várias vezes à noite." },
  { id: "s3", dimensao: "sono", positivo: false, enunciado: "Meus horários de trabalho atrapalham meu sono." },
  { id: "s4", dimensao: "sono", positivo: true, enunciado: "Tenho tempo de lazer ou descanso durante a semana." },

  // Saúde física
  { id: "f1", dimensao: "fisica", positivo: true, enunciado: "Faço atividade física (caminhada, academia, esporte) na semana." },
  { id: "f2", dimensao: "fisica", positivo: false, enunciado: "Sinto dores no corpo (coluna, pescoço, ombros) que atrapalham meu dia." },
  { id: "f3", dimensao: "fisica", positivo: true, enunciado: "Tenho disposição física para dar conta do meu dia." },
  { id: "f4", dimensao: "fisica", positivo: true, enunciado: "Cuido da minha saúde com consultas e exames de rotina." },

  // Alimentação
  { id: "a1", dimensao: "alimentar", positivo: true, enunciado: "Faço minhas refeições em horários mais ou menos regulares." },
  { id: "a2", dimensao: "alimentar", positivo: true, enunciado: "Como frutas, verduras ou legumes no meu dia a dia." },
  { id: "a3", dimensao: "alimentar", positivo: false, enunciado: "Acabo comendo o que dá (lanche rápido, ultraprocessado) por causa da correria." },
  { id: "a4", dimensao: "alimentar", positivo: true, enunciado: "Bebo água ao longo do dia." },

  // Rede de apoio e vínculos
  { id: "r1", dimensao: "apoio", positivo: true, enunciado: "Tenho pessoas com quem posso contar quando preciso." },
  { id: "r2", dimensao: "apoio", positivo: false, enunciado: "Me sinto sozinho(a), mesmo quando estou acompanhado(a)." },
  { id: "r3", dimensao: "apoio", positivo: false, enunciado: "Tenho usado bebida, cigarro ou remédio para dar conta da rotina." },
  { id: "r4", dimensao: "apoio", positivo: true, enunciado: "Consigo pedir ajuda quando não estou bem." },
];

/**
 * Item de triagem de risco. Fica FORA da pontuação de propósito: risco de
 * autolesão não é média com mais nada. Qualquer resposta diferente de "Nunca"
 * abre o painel de cuidado urgente no resultado, mesmo que todas as outras
 * dimensões estejam verdes.
 */
export const ITEM_RISCO: Item = {
  id: "risco",
  dimensao: "mental",
  positivo: false,
  enunciado:
    "Nas últimas duas semanas, tive pensamentos de que seria melhor não estar aqui, ou de me machucar.",
};

export const TODOS_OS_ITENS: Item[] = [...ITENS, ITEM_RISCO];

/** Perguntas de contexto. Todas opcionais, todas em faixas largas. */
export const FUNCOES = [
  "Agente de apoio socioeducativo",
  "Equipe técnica (psicologia, serviço social, pedagogia)",
  "Direção ou coordenação",
  "Saúde (enfermagem, medicina, odontologia)",
  "Educação e oficinas",
  "Administrativo, cozinha, manutenção e apoio",
  "Prefiro não informar",
] as const;

export const TEMPOS_DE_CASA = [
  "Menos de 1 ano",
  "1 a 3 anos",
  "4 a 10 anos",
  "Mais de 10 anos",
  "Prefiro não informar",
] as const;

export const FAIXAS_ETARIAS = [
  "Até 29 anos",
  "30 a 39 anos",
  "40 a 49 anos",
  "50 anos ou mais",
  "Prefiro não informar",
] as const;

export function itensDaDimensao(dimensao: DimensaoId): Item[] {
  return ITENS.filter((i) => i.dimensao === dimensao);
}

export function buscarDimensao(id: DimensaoId): Dimensao {
  const dimensao = DIMENSOES.find((d) => d.id === id);
  if (!dimensao) throw new Error(`Dimensão desconhecida: ${id}`);
  return dimensao;
}
