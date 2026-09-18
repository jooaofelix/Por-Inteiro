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
- **Cloudflare Workers** via `@opennextjs/cloudflare`, com **D1** (o SQLite
  gerenciado da Cloudflare) como banco
- **Prisma 7** com o adaptador `@prisma/adapter-d1`
- **Zod** na validação do envio
- Testes com o runner nativo do Node (`node --test`)

## Rodando o projeto

```bash
npm install

cp .dev.vars.example .dev.vars
openssl rand -hex 32   # cole em CODIGO_PEPPER
openssl rand -hex 32   # cole em SESSION_SECRET
# e escolha uma ADMIN_SENHA

npm run d1:migrar       # cria o schema no D1 local
npm run demo:gerar      # opcional: gera d1/demo.sql
npx wrangler d1 execute por-inteiro --local --file d1/demo.sql

npm run dev             # http://localhost:3000, já com o D1 local
```

O `next dev` enxerga os bindings do Cloudflare (inclusive o D1) por causa do
`initOpenNextCloudflareForDev()` em `next.config.ts`, então o ambiente de
desenvolvimento é o mesmo de produção.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento, com os bindings do Cloudflare |
| `npm test` | Suíte de testes |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | ESLint |
| `npm run cf:build` | Empacota o app como Worker em `.open-next/` |
| `npm run cf:preview` | Empacota e roda o Worker localmente |
| `npm run cf:deploy` | Empacota e publica na Cloudflare |
| `npm run cf:tipos` | Regenera `cloudflare-env.d.ts` a partir do `wrangler.jsonc` |
| `npm run d1:migrar` | Aplica as migrações no D1 local |
| `npm run d1:migrar:producao` | Aplica as migrações no D1 de produção |
| `npm run db:migrar` | Escreve uma nova migração com o Prisma (veja abaixo) |
| `npm run demo:gerar` | Gera `d1/demo.sql` com dados sintéticos |

## Publicando

O schema já está aplicado no D1 de produção (`por-inteiro`). Para publicar:

```bash
# uma vez, para criar os secrets no Worker
npx wrangler secret put CODIGO_PEPPER
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_SENHA

npm run cf:deploy
```

Os secrets ficam no Worker, nunca em arquivo. `CODIGO_PEPPER` em especial não
pode mudar depois que o sistema estiver em uso: trocá-lo invalida todos os
códigos de retorno já entregues.

Para popular a produção com os dados de demonstração (só faz sentido antes do
uso real):

```bash
npx wrangler d1 execute por-inteiro --remote --file d1/demo.sql
```

### Mudando o schema

O Prisma escreve as migrações; o Wrangler as aplica no D1.

```bash
cp .env.example .env                       # SQLite local, só para o Prisma autorar
npm run db:migrar -- --name minha_mudanca  # gera prisma/migrations/<data>_minha_mudanca/
cp prisma/migrations/<data>_minha_mudanca/migration.sql d1/migrations/000N_minha_mudanca.sql
npm run d1:migrar                          # aplica no D1 local
npm run d1:migrar:producao                 # aplica no D1 de produção
npx prisma generate                        # atualiza o cliente
```

### Variáveis de ambiente

| Variável | Onde vive | Para quê |
| --- | --- | --- |
| `CODIGO_PEPPER` | `.dev.vars` / secret do Worker | Segredo no hash do código de retorno. **Trocar invalida todos os códigos já entregues.** |
| `SESSION_SECRET` | `.dev.vars` / secret do Worker | Assina o cookie do painel |
| `ADMIN_SENHA` | `.dev.vars` / secret do Worker | Senha do painel. Sem ela, o painel fica indisponível. |
| `DATABASE_URL` | `.env` | Só para o Prisma escrever migrações. A aplicação não usa. |

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
- **O limitador de requisições é em memória do isolate.** No Workers cada
  isolate tem a sua contagem, então o limite real é mais frouxo do que os
  números sugerem. Ele segura robô e envio repetido, mas para um limite
  rigoroso o caminho é o Rate Limiting da própria Cloudflare ou um contador em
  Durable Object.
- **As auditorias de dependência** apontam vulnerabilidades no CLI do Prisma
  (`mysql2`, `deepmerge-ts`). São dependências de desenvolvimento, não vão para
  o runtime de produção.

---

O Por Inteiro é uma ferramenta de autocuidado e encaminhamento. **Não faz
diagnóstico e não substitui atendimento profissional.**
Se você está em sofrimento, o CVV atende no **188**, 24 horas, de graça.
