# Onda (波)

Um app pessoal de organização de vida, feito por mim e pra mim, que uso todo dia. Ele junta
num lugar só o que eu antes espalhava entre agenda, lista de tarefas, planilha de hábitos e
caderno: o que importa hoje, como cada área da vida está sendo cuidada e pra onde está indo
o meu tempo.

A estética é japonesa (papel washi, tinta azul, selo hanko) e o app é todo em português. Ele
roda na Vercel, atrás de uma senha única, porque o único usuário sou eu.

## O que ele faz

- **Hoje.** É o painel do dia: as 3 prioridades, os eventos, os hábitos ordenados por urgência
  e a **Bússola**, um gráfico radial de quanto cada área da vida está sendo "nutrida".
- **Ritual.** Um check-in de manhã (energia, intenção, as 3 vitórias do dia) e um check-out à
  noite. As prioridades do dia nascem aqui; sem ritual, o app convida a fazer em vez de
  inventar prioridades.
- **Áreas e Objetivos.** Sete áreas fixas (profissional, faculdade, saúde…), objetivos com metas
  mensuráveis e um indicador de área "em baixa".
- **Organização.** Ciclos de semana, mês, semestre e ano. Cada ciclo tem uma linha de chegada
  no início, um ponto de redirecionamento no meio e uma revisão no fim.
- **Projetos.** Quadro kanban por projeto, com tarefas que podem ser mensuráveis (por exemplo,
  "ler 300 páginas"). Bater a meta conclui a tarefa sozinha.
- **Hábitos.** Votação diária, com agenda por dia da semana.
- **Calendário.** A visão Dia mostra duas faixas lado a lado: o **plano** (eventos e blocos de
  foco) e o **feito** (o tempo de foco que de fato aconteceu).
- **Cronômetros e tempo de foco.** Pomodoro e cronômetros personalizados. Cada bloco de foco é
  gravado e ligado a uma tarefa, a um hábito (que é concluído no fim) ou a um foco livre. Assim
  dá pra ver quanto tempo foi pra cada projeto na semana.
- **Celular** (em teste numa branch). É um app separado, em 5 abas, instalável como PWA e com
  notificações push.

### A ideia por trás da Bússola

O quanto cada área está "nutrida" é a média dos últimos 30 dias da fração de hábitos daquela
área cumpridos no dia, com decaimento de 7% por dia, de modo que o que é recente pesa mais.
Cumprir um hábito fora do dia agendado conta como bônus, nunca é ignorado. Dias sem nada
agendado não entram na média, pra não punir folga. Abaixo de 25% a área é marcada como em
baixa, e isso muda a ordem dos hábitos na tela Hoje. A lógica está em
[`lib/nutricao.ts`](lib/nutricao.ts).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estrito · Supabase (Postgres) · Vercel

## Decisões de arquitetura

- **O navegador nunca fala com o banco.** Só o servidor acessa o Supabase
  ([`lib/db.ts`](lib/db.ts)); o cliente chama as rotas em `app/api/*`. Uma senha única protege
  tudo via [`proxy.ts`](proxy.ts), e o login tem limite de tentativas.
- **Atualização otimista com aviso de falha.** Há um store por domínio (`lib/*Store.ts`). Cada
  mutação atualiza a tela na hora e grava em segundo plano; as falhas são contadas e viram um
  aviso de "alterações não foram salvas", em vez de sumirem em silêncio.
- **Gravações que não se atropelam.** As rotas PATCH só mexem nos campos que recebem e os POST
  usam `upsert` com ids determinísticos (por exemplo, `${data}-${tipo}` para o ritual e
  `${sessao}-${fase}` para blocos de foco). Duas abas abertas ou um gatilho disparado duas vezes
  não duplicam nem apagam dado.
- **Idempotência onde há automação.** Votar num hábito alterna, mas concluir é idempotente. É o
  que qualquer gatilho automático usa (cronômetro que termina, revisão dos hábitos de ontem), pra nunca desmarcar
  algo por acidente.
- **Datas locais.** O app vive em data local `YYYY-MM-DD`, e os timestamps em UTC são sempre
  convertidos antes de comparar. Perto da meia-noite no Brasil, essa diferença já causou bug.
- **Tema diurno e noturno** por variáveis CSS, que viram a partir das 20h.

O esquema do banco está em [`supabase/schema.sql`](supabase/schema.sql).

## Como foi construído: desenvolvimento com IA

O Onda foi desenvolvido em par com o **Claude Code** (os commits com `Co-Authored-By: Claude`
são desse trabalho). As decisões de produto são minhas: o que construir, como cada conceito
deve funcionar e o que fica de fora. A IA implementa, testa e propõe. O processo que fui
lapidando:

1. **Contexto do projeto versionado.** O [`CLAUDE.md`](CLAUDE.md) é a memória do projeto: as
   convenções, os conceitos que não dá pra adivinhar lendo o código e as armadilhas que já
   morderam. Toda mudança relevante atualiza esse arquivo no mesmo commit, então cada sessão
   nova começa sabendo o que a anterior aprendeu.
2. **Protótipo antes de código.** Funcionalidades maiores nascem como um protótipo navegável
   pra eu validar. Depois vão pra uma branch com preview na Vercel, que eu testo no uso real, e
   só então entram na `main`.
3. **Validação obrigatória.** Toda mudança passa por `tsc`, lint (com uma base de problemas que
   só pode cair) e build. A lógica de domínio é testada isoladamente e as rotas são exercitadas
   contra um servidor local com dados descartáveis, apagados no fim.
4. **Banco com cuidado.** As mudanças de esquema são só aditivas. Eu rodo o SQL manualmente e o
   deploy só acontece depois, pra não quebrar o app no ar.

## Rodando localmente

```bash
npm install
# .env.local com SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e APP_PASSWORD
# e o esquema de supabase/schema.sql aplicado num projeto Supabase
npm run dev   # http://localhost:3000
```
