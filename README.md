<div align="center">

# Por Inteiro

**Um olhar para a saúde de quem cuida.**

Autodiagnóstico de saúde anônimo para profissionais da Fundação CASA, com
devolutiva prática e encaminhamento para a rede de apoio da região.

</div>

---

## O problema

Quem trabalha na socioeducação passa o dia cuidando de adolescentes em situação
de altíssima complexidade — e raramente tem para onde levar o próprio desgaste.
Pesquisar isso com nome e crachá não funciona: ninguém assume esgotamento,
insônia ou uso de álcool num formulário que a chefia pode abrir.

O Por Inteiro resolve isso invertendo a ordem: **a pessoa é dona do resultado, a
instituição só enxerga o agregado.**

## O que o sistema faz

1. **Responde.** 26 perguntas em seis áreas de saúde, de 5 a 8 minutos, no
   celular, sem login e sem identificação.
2. **Devolve um retrato.** Escore de 0 a 100 por área, com o que está pesando
   nomeado item a item — e o que está sustentando a pessoa também.
3. **Diz o que dá para fazer.** Orientações do tamanho de quem faz plantão, não
   conselho genérico de internet.
4. **Aponta para onde ir.** CAPS, UBS, CRAS, CEREST, psicologia, nutrição,
   educação física e equipamentos públicos da região informada.
5. **Devolve os números para a gestão.** Painel agregado para decidir onde o
   cuidado precisa chegar primeiro.

### As seis áreas

| Área | O que olha |
| --- | --- |
| 🧠 Saúde mental e emocional | Humor, ansiedade, ânimo, sentido |
| 🔥 Estresse e esgotamento no trabalho | O que a rotina da unidade deixa depois do expediente |
| 🌙 Sono e descanso | Recuperação entre turnos |
| 💪 Saúde física | Movimento, disposição, dores, cuidado de rotina |
| 🥗 Alimentação | Como se come no meio da correria |
| 🤝 Rede de apoio e vínculos | Com quem contar, e como se tem lidado com a pressão |

## Como o anonimato é construído

Não é promessa, é arquitetura. O sistema **não consegue** identificar quem
respondeu, nem para quem o opera.

- **Não existe cadastro.** Nome, matrícula, CPF, e-mail, telefone e unidade não
  são pedidos em momento nenhum, e não existe coluna para eles no banco.
- **O CEP não sai do navegador.** Ele vira região (`src/data/regioes.ts`) no
  cliente; o que trafega é só o slug da região.
- **O código de retorno não é gravado.** O banco guarda `SHA-256(código +
  pepper)`. Quem tiver uma cópia do banco não reabre o resultado de ninguém — e
  um código perdido é irrecuperável, inclusive para a equipe do projeto.
- **O painel só mostra agregado.** Não existe tela, rota ou exportação que
  devolva uma resposta individual.
- **k-anonimato nos recortes.** Qualquer grupo com menos de `K_MINIMO` (5)
  respostas sai suprimido, sem média e sem a contagem exata. É o que impede que
  "a média da equipe técnica da região X", num grupo de duas pessoas, vire a
  resposta dessas duas pessoas.
- **O IP é efêmero.** Usado só como chave em memória do limitador de
  requisições, nunca gravado nem associado a uma resposta.

A página `/privacidade` explica tudo isso para quem vai responder, na linguagem
de quem vai responder.

### Risco de autolesão

Há um item de triagem sobre pensamentos de autolesão. Ele fica **fora de toda
pontuação** — risco não é média com mais nada — e é opcional. Qualquer resposta
acima de "Nunca" abre o painel de cuidado urgente no topo do resultado, com CVV
(188) e SAMU (192), mesmo que todas as áreas estejam verdes. A gestão vê apenas
**quantas** pessoas sinalizaram, nunca quem.

## Rede de apoio: o que é dado verificado e o que não é

Encaminhar alguém para um serviço que não existe é pior do que não encaminhar.
Por isso `src/data/rede-apoio.ts` separa duas coisas:

- **`verificado: true`** — portas de entrada públicas de acesso estável: CVV
  188, SAMU 192, Disque Saúde 136, UBS, CAPS, CAPS AD, CRAS, CEREST, Academia da
  Saúde, clínicas-escola, SESC. São canais, não unidades específicas, e por isso
  não envelhecem.
- **`verificado: false`** — vagas regionais com o formato pronto, a serem
  preenchidas pela equipe da Fundação com a rede real de cada unidade. Enquanto
  estiverem assim, a interface as exibe em bloco separado, com aviso explícito.

**Nenhum endereço ou telefone foi preenchido por adivinhação.** Antes de entrar
em produção, a camada regional precisa ser levantada e validada com a equipe
técnica.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** com os tokens da identidade visual
- **Prisma 7** + **SQLite** em desenvolvimento (troca para Postgres alterando o
  `provider` no schema e o adaptador em `src/lib/prisma.ts`)
- **Zod** na validação do envio
- Testes com o runner nativo do Node (`node --test`)

## Rodando o projeto

```bash
npm install

cp .env.example .env
# gere os segredos e preencha o .env:
openssl rand -hex 32   # CODIGO_PEPPER
openssl rand -hex 32   # SESSION_SECRET
# e escolha uma ADMIN_SENHA

npm run db:migrate      # cria o banco e aplica as migrações
npm run demo:popular    # opcional: 140 respostas sintéticas para ver o painel
npm run dev
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e execução de produção |
| `npm test` | Suíte de testes |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Cria/atualiza o banco local |
| `npm run db:deploy` | Aplica migrações em produção |
| `npm run db:studio` | Prisma Studio |
| `npm run demo:popular` | Popula com dados sintéticos de demonstração |

### Variáveis de ambiente

| Variável | Para quê |
| --- | --- |
| `DATABASE_URL` | Conexão com o banco |
| `CODIGO_PEPPER` | Segredo no hash do código de retorno. **Trocar invalida todos os códigos já entregues.** |
| `SESSION_SECRET` | Assina o cookie do painel. Obrigatório em produção. |
| `ADMIN_SENHA` | Senha do painel. Sem ela, o painel fica indisponível. |

## Mapa do código

```
src/
├── data/                  conteúdo revisável pela equipe técnica
│   ├── questionario.ts    dimensões, itens, escala, item de risco
│   ├── regioes.ts         regiões e mapeamento CEP → região
│   └── rede-apoio.ts      serviços sugeridos
├── lib/
│   ├── avaliacao.ts       pontuação, níveis e recomendações
│   ├── relatorios.ts      agregação e k-anonimato
│   ├── codigo.ts          geração, normalização e hash do código
│   ├── admin.ts           sessão do painel
│   └── prisma.ts          cliente do banco
├── components/            marca, escala, medidor, listas
└── app/
    ├── questionario/      formulário em etapas
    ├── resultado/[codigo] devolutiva
    ├── acompanhar/        reabrir com o código
    ├── privacidade/       o que é guardado e o que não
    ├── admin/             painel e exportação CSV
    └── api/respostas/     gravação do envio
```

**Para revisar o conteúdo com a equipe técnica, mexa só em `src/data/`.**
Enunciados, dimensões, recomendações e rede de apoio vivem lá, separados da
lógica.

## Identidade visual

Paleta e tipografia seguem o manual da marca, em `src/app/globals.css`:

| | | |
| --- | --- | --- |
| Azul-marinho | `#092957` | confiança, estabilidade, profundidade |
| Azul-vivo | `#0088FF` | energia, acesso, movimento |
| Azul-claro | `#8BCBFA` | humanidade, acolhimento, equilíbrio |
| Branco | `#FFFFFF` | clareza, respiro, simplicidade |

Tipografia geométrica e arredondada: Quicksand na marca e nos títulos, Nunito no
texto corrido. O símbolo é SVG desenhado em código (`src/components/Marca.tsx`),
para ficar nítido do favicon ao cartaz.

Duas observações sobre o uso da paleta em tela:

- O azul-vivo puro sobre branco tem contraste 3,3:1 — serve para preenchimento e
  gráfico, não para texto (a WCAG AA pede 4,5:1). Links e rótulos usam
  `--acento-texto`, um tom levemente mais escuro do mesmo azul.
- Os três níveis de resultado usam cores semânticas próprias, porque azul contra
  azul não os distingue. A cor nunca aparece sozinha: vem sempre com o rótulo
  escrito e o número ao lado.

## Limitações conhecidas

- **O instrumento não é validado.** Os itens seguem o formato de escalas de
  rastreio conhecidas, mas o questionário não passou por validação
  psicométrica. Antes de uso institucional, precisa de revisão da equipe técnica
  de saúde da Fundação — e, idealmente, de um estudo de validação.
- **A camada regional da rede de apoio está vazia** por decisão, como explicado
  acima.
- **O painel tem uma senha única**, sem contas nominais nem trilha de auditoria.
  Suficiente enquanto ele só mostra agregados; o ponto de troca é
  `src/lib/admin.ts`.
- **O limitador de requisições é em memória**, então só funciona com uma
  instância. Com mais de uma, trocar por contador compartilhado ou pelo
  limitador da borda.
- **SQLite** serve ao piloto. Para várias unidades em paralelo, migrar para
  Postgres.
- **As auditorias de dependência** apontam vulnerabilidades no CLI do Prisma
  (`mysql2`, `deepmerge-ts`). São dependências de desenvolvimento, não vão para
  o runtime de produção.

---

O Por Inteiro é uma ferramenta de autocuidado e encaminhamento. **Não faz
diagnóstico e não substitui atendimento profissional.**
Se você está em sofrimento, o CVV atende no **188**, 24 horas, de graça.
