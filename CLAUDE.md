@AGENTS.md

# Onda (波)

App pessoal de organização de vida do Lucca — único usuário, em português, com estética
japonesa (papel washi, tinta azul, selo hanko). Hospedado na Vercel em `onda-self.vercel.app`,
atrás de uma senha só (sem contas de usuário).

Telas: **Hoje** (painel do dia), **Áreas**, **Objetivos** (+ metas), **Organização** (ciclos
de semana/mês/semestre/ano), **Projetos** (quadro kanban por projeto), **Calendário**,
**Hábitos**, **Cronômetros** e **Ritual** (check-in da manhã e check-out da noite).

No **celular** (tela até 768px) o app é outro: 5 abas — **Hoje** (três momentos do dia),
**Agenda** (dia/semana/mês com plano × feito), **Foco** (cronômetro), **Projetos** e **Rumo**
(objetivos + linha de chegada da semana) — em `components/celular/`.
É instalável na tela inicial (PWA) e manda lembretes às 7h, 12h e 21h. O Lucca pediu que a
versão de PC **não mude** por causa do celular: o que for de celular fica atrás de
`useTelaPequena()`; antes de mexer numa tela de PC, pergunte.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estrito · Supabase (Postgres) · Vercel.

- `npm run dev` (porta 3000) · `npm run build` · `npm run lint` · `npx tsc --noEmit`
- `.env.local`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_PASSWORD`. Notificações
  usam também `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `CRON_SECRET` (sem elas
  o envio só fica desligado).
- Esta máquina não tem Node instalado: baixe o oficial (nodejs.org) no scratchpad e use pelo
  `PATH`. Pro build sem `.env.local`, passe valores falsos nas variáveis só no comando.

## Como o app é construído

- **Nada de Tailwind na prática.** Ele está instalado e importado em `globals.css`, mas não é
  usado — não use. Estilo é `style={{}}` inline usando as variáveis de cor de
  `app/globals.css` (`--ink`, `--washi`, `--hanko`, `--moss`, `--char`, `--card-bg`…). Elas têm
  versão noturna em `html[data-night="true"]`, que `app/page.tsx` liga a partir das 20h, então
  **nunca escreva cor literal** que só funcione num dos dois temas. O código antigo tem muito
  `rgba(27,54,93,…)` e `color + '50'` escritos direto — é dívida, não padrão a copiar.
  Fontes: `.serif` (Cormorant Garamond), `.jp` (Noto Serif JP), Inter no corpo.
- **O navegador nunca fala com o Supabase.** Só o servidor, via `lib/db.ts` (chave
  `service_role`, RLS desligado). O navegador chama as rotas `app/api/*`.
- **Um store por domínio** em `lib/*Store.ts` (`projectsStore`, `habitsStore`, `calendarStore`,
  `cronometrosStore`, `objetivosStore`, `rituaisStore`, `ciclosStore`, `focoStore`). Todos são hooks instanciados **uma vez**
  em `app/page.tsx` e passados por prop — não há contexto global.
- **Padrão de cada store:** carrega com `useRetryFetch` (retenta com espera e expõe `erro`);
  cada mutação atualiza o estado local na hora e dispara a gravação com `gravar()` de
  `lib/gravacao.ts`, que conta falhas e alimenta o aviso "alterações não foram salvas".
- **`jsonComNulos()`** no corpo das gravações: `JSON.stringify` comum descarta chaves
  `undefined`, e aí limpar um campo opcional não persiste. Use sempre nas rotas que aceitam
  limpar campo.
- **Rotas PATCH só mexem no que recebem** (`if ('campo' in body)`), e POST usa `upsert`. Isso é
  o que mantém abas antigas e gravações concorrentes de se atropelarem — preserve esse padrão.
- **`localStorage` só pra enfeite local** que não precisa sincronizar: cronômetro em andamento
  (`cronometroSessaoStore`) e "já vi o popup de ontem hoje". Dado de verdade vai pro banco.
- Nomes em português no domínio (`habitos`, `vitorias`, `valorAlvo`); colunas em `snake_case`;
  as rotas traduzem uma coisa na outra (`rowToTask`, `valor_alvo` ↔ `valorAlvo`).

## Conceitos que não dá pra adivinhar lendo o código

- **Áreas** são fixas no código (`lib/data.ts`): profissional, faculdade, saúde, social,
  finanças, hobbies, desenvolvimento. Não há CRUD de área.
- **Nutrição / Bússola** (`lib/nutricao.ts`): nutrido de cada área é a média dos últimos 30
  dias, com decaimento de 7% por dia, da fração de hábitos daquela área votados no dia. Um
  hábito votado **fora** do dia agendado conta como bônus a favor, nunca é ignorado. Dias sem
  hábito agendado nem votado não entram na média.
- **`LIMIAR_AREA_NEGLIGENCIADA = 0.25`**: abaixo disso a área é "em baixa". É um valor só,
  compartilhado por Hoje, Áreas e a ordenação de hábitos — já teve dois valores diferentes
  espalhados por telas e isso é bug, não escolha.
- **As 3 prioridades do dia nascem no ritual da manhã** (passo "3 vitórias"), cada uma podendo
  ser texto livre, evento do calendário, tarefa de projeto ou hábito. Ficam em
  `RitualRegistro.vitorias`. Sem ritual feito, a tela Hoje mostra um convite pro ritual em vez
  de inventar prioridades. Eventos de hoje aparecem sempre, fora dos 3 espaços.
- **Hábitos de hoje** são ordenados assim: agendados primeiro; dentro de cada grupo (agendados e
  não agendados), quem tem horário vem antes, em ordem cronológica; entre os sem horário, a área
  mais negligenciada primeiro. A exclamação vermelha no pill só aparece quando a área em baixa é
  de fato o motivo da posição (agendado, sem horário, área abaixo do limiar).
- **Votar é alternância, concluir é idempotente.** `votar()` liga/desliga o voto do dia;
  `completarHabito()` só marca se ainda não estiver marcado — é o que qualquer gatilho
  automático deve usar (cronômetro que termina, popup de hábitos de ontem), pra nunca desmarcar
  por acidente ao disparar duas vezes.
- **Tarefa mensurável** (`valorAlvo`, `valorAtual`, `unidade` em `tasks`): bater a meta move a
  etapa pra Concluído; cair abaixo dela devolve pra Em Andamento. O formulário de editar tarefa
  **nunca envia `valorAtual`**, senão salvar apagaria o progresso.
- **Organização / ciclos** (`lib/ciclos.ts`): cada escala (semana seg–dom, mês, semestre jan–jun
  / jul–dez, ano) tem um ciclo por período, id = `${escala}-${inicio}`, que só nasce quando algo
  é escrito nele. Início = linha de chegada (`foco`) + `itens` (metas sim/não e indicadores com
  alvo "pelo menos"/"no máximo"); meio = ponto de redirecionamento (`meioNota`/`meioEm`); fim =
  revisão e `fechadoEm`. O "momento" (`momentoDoCiclo`) é derivado da data, nunca gravado. A
  rota `PATCH /api/ciclos/[id]` também cria a linha se ela não existir (o cliente manda sempre
  `escala`/`inicio`/`fim`), pra não haver corrida entre criar e atualizar. As quatro escalas
  ainda usam a mesma tela; o que difere entre elas fica em `ESCALAS`.
- **Tempo de foco** (`lib/foco.ts` + `lib/focoStore.ts`, tabela `sessoes_foco`): cada fase de
  **foco** do cronômetro vira um bloco gravado (descanso não conta), id `${sessaoId}-${faseIndex}`
  com upsert. Antes de começar, o PC pergunta "no que você vai focar?" — tarefa ou foco livre
  (opcional). Quem grava o fim natural é o `CronometroNotificacao` (dono do relógio, roda em
  qualquer tela); pular fase ou encerrar grava o tempo feito só se passou de
  `MINIMO_MIN_BLOCO_INTERROMPIDO` (5 min); reiniciar a fase descarta. Título, projeto e área da
  tarefa são copiados no bloco, pra o histórico sobreviver à tarefa apagada.
  Na mesma escolha dá pra ligar um **hábito** que a sessão conclui no fim (`sessao.habitoId`:
  `null` = nenhum, ausente = o do cronômetro — leia sempre via `habitoDaSessao()`). Fim natural
  marca sozinho; encerrar cedo só oferece, já marcado, na tela do fim. **Sessão rápida**: tempo
  + "com pausas" (`fasesDaSessaoRapida`, rodadas de 25/5) escolhidos na hora, roda como sessão
  avulsa e não vira cronômetro salvo.
- **Calendário, visão Dia** (`components/calendario/DiaView.tsx`): linha do tempo das 6h à meia-noite
  com duas faixas — **plano** (eventos e blocos de foco) e **feito** (`sessoes_foco`). Bloco de foco é
  um `CalendarEvent` com `type: 'foco'`, `endTime` e `taskId` opcional; aparece onde eventos já
  aparecem. "Começar foco agora" inicia uma sessão **avulsa** (`iniciarAvulso`, sem cronômetro
  salvo, com a duração do bloco) — por isso, pra achar o cronômetro de uma sessão use sempre
  `presetDaSessao()`, nunca só `presets.find`.
- **Hoje do celular, três momentos** (`HojeCelular`): segue o que já foi feito, não só a hora —
  sem ritual da manhã pede a abertura (até 18h); a partir das 11h sem registro `meio`, pede o ponto
  do meio-dia (manter/trocar vitórias + energia); a partir das 18h, o fechamento. O ritual é feito
  **na própria tela** (não em modal). No fechamento, cada vitória não feita pode ir pra
  `levar` (jsonb no ritual da noite) — **nada passa sozinho**: `levar` e o `carrega` ("amanhã
  eu começo por…") só viram **sugestão** na manhã seguinte. Contas de bloco planejado × feito
  ficam em `lib/agenda.ts`.
- **Ritual**: tipos `manha`, `meio` e `noite`; no máximo um registro por dia e por tipo (id = `${data}-${tipo}`), gravado com
  upsert. O check-in da manhã é o que acende o selo na barra lateral.

## Armadilhas que já morderam aqui

- **Datas.** O app vive em data local `'YYYY-MM-DD'` (`toDateStr`). Campos `criadoEm`/
  `atualizadoEm` são ISO em **UTC** — comparar `updatedAt.slice(0,10)` com a data local erra
  perto da meia-noite no Brasil. Converta: `toDateStr(new Date(iso))`. Prazo vencido se compara
  com `new Date(due + 'T23:59:59')`.
- **Botão dentro de botão.** `<Checkbox>` já é um `<button>`. Envolver numa linha clicável usa
  `<div onClick>`, nunca `<button>` — HTML inválido faz o navegador remontar o DOM e a área
  clicável sai do lugar. E não repita o `onChange` do Checkbox quando a linha já alterna: o
  clique borbulha e alterna duas vezes.
- **Lint tem base de 4 problemas** (1 erro proposital de `setState` em efeito no
  `cronometroSessaoStore` + 3 avisos de variável não usada). Esse número pode **cair**, nunca
  subir. Pra ler `localStorage` em componente novo, use inicializador do `useState`, não efeito.
- **Notificações**: `vercel.json` agenda `/api/notificacoes/enviar` às 10h, 15h e 0h **UTC**
  (7h, 12h e 21h no Brasil); no plano Hobby chega em qualquer minuto daquela hora. A rota
  autentica pelo `CRON_SECRET`, olha os rituais de hoje (data em `America/Sao_Paulo`) e não
  manda o lembrete de um momento já feito. Aparelhos inscritos ficam em `push_inscricoes`.
  No iPhone só funciona com o app instalado na tela inicial.
- **Janela no celular vai pro `<body>`.** No Safari do iPhone, um modal `position: fixed` desenhado
  dentro da área que rola do app de celular é recortado — o rodapé com o botão sumia atrás da
  barra de abas. Todo modal aberto de dentro de `components/celular/` passa por `<ForaDoApp>`
  (portal pro body). Campo de texto no celular precisa de 16px, senão o iPhone dá zoom sozinho.
- **`proxy.ts`** bloqueia tudo que não está no `matcher`. Ao adicionar asset público novo (tipo
  `icon.svg`), inclua lá, senão nem o navegador nem o Google conseguem buscar.
- O Supabase já devolveu `JWT issued at future` de forma passageira. Se aparecer, tente de novo
  antes de investigar.

## Como trabalhar neste repositório

1. Implemente na `main`.
2. Valide: `npx tsc --noEmit`, `npm run lint` (confira a base acima), `npm run build`.
3. **Mudança de banco:** escreva o `ALTER TABLE` aditivo (coluna nova é anulável ou tem
   default), atualize `supabase/schema.sql`, entregue o SQL pro Lucca rodar no SQL Editor do
   Supabase e **espere a confirmação** — publicar antes quebra o app no ar.
4. Teste de verdade contra o servidor local: crie dados descartáveis pela API, confira ida e
   volta, confirme que os dados reais ficaram intactos e **apague o que criou**. A senha de
   login fica em `APP_PASSWORD`, no `.env.local` (pergunte ao Lucca; não a escreva em arquivo
   versionado). Testes e arquivos temporários vão pro diretório de scratchpad, nunca pro repo.
5. Commit em português, descrevendo o efeito pro usuário e não o arquivo mexido.
6. `git push origin main`. (A antiga branch `mobile-bottom-nav` foi aposentada: o celular agora
   é o app de `components/celular/`, na própria `main`. As classes `mobile-*` que sobraram no
   código não fazem nada na `main`.) Pra mostrar algo ao Lucca antes de publicar, suba numa
   branch: a Vercel gera um link de preview que ele abre no celular.
7. Não há ferramenta de navegador nesta máquina. Se a mudança for visual, diga claramente que
   não foi conferida na tela.
