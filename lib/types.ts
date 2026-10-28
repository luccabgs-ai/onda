export interface Area {
  id: string;
  name: string;
  sub: string;
  kanji: string;
  color: string;
  angle: number;
  nutrido: number;
  objetivo: string;
  ultima: string;
  habitos: number;
  projetos: number;
  streakDias: number;
  projects?: { name: string; status: string; due: string; progress: number }[];
  notas?: { date: string; text: string }[];
}

/** De onde vem uma das 3 prioridades do dia, escolhida no ritual da manhã. */
export type PrioridadeOrigem = 'manual' | 'evento' | 'task' | 'habito';

/**
 * Uma das 3 prioridades do dia. `manual` guarda o texto (e seu próprio `done`, já que não tem
 * outro dado de onde derivar isso); as outras origens só guardam o id referenciado — o texto e
 * o estado de feito/votado vêm sempre do dado real (task/hábito/evento) na hora de exibir.
 */
export interface PrioridadeRitual {
  origem: PrioridadeOrigem;
  texto?: string;
  done?: boolean;
  eventoId?: string;
  taskId?: string;
  habitoId?: string;
}

/**
 * Onde o hábito se pendura: num dos Rituais (manhã/noite), em outro hábito já existente
 * (empilhamento — "depois de X, eu faço Y"), num texto livre descrito à mão, ou em nenhuma âncora.
 */
export type AncoraTipo = 'ritual_manha' | 'ritual_noite' | 'habito' | 'outro' | 'nenhuma';

export interface Habito {
  id: string;
  identidade: string;          // "Ser alguém que cuida da saúde" — o voto
  areaId: string;               // qual Área esse voto nutre
  acao: string;                 // "Treinar" — a evidência concreta
  metaAtual: string;            // "30min" — pode encolher
  metaOriginal: string;         // meta com que o hábito nasceu
  ancoraTipo: AncoraTipo;
  ancoraHabitoId?: string;      // preenchido quando ancoraTipo === 'habito'
  ancoraTexto?: string;         // preenchido quando ancoraTipo === 'outro'
  diasSemana: number[];         // 0=dom … 6=sáb — em quais dias esse voto é esperado
  horario?: string;              // 'HH:MM' — que horas do dia, opcional
  local?: string;                // onde esse hábito acontece, opcional
  votos: Record<string, boolean>;       // 'YYYY-MM-DD' -> voto dado
  encolhimentoDismissadoEm?: string;    // última vez que recusou encolher
  criadoEm: string;
  atualizadoEm: string;
}

export type RitualTipo = 'manha' | 'noite';

export interface RitualRegistro {
  id: string;          // `${data}-${tipo}` — no máximo um registro por dia/tipo, upsert idempotente
  data: string;        // 'YYYY-MM-DD'
  tipo: RitualTipo;
  energia: number;     // 1..5 — manhã: como acordou; noite: como foi o dia
  intencao?: string;   // manhã
  vitorias?: PrioridadeRitual[]; // manhã — as 3 prioridades do dia
  funcionou?: string;  // noite
  carrega?: string;    // noite — o que fica pra amanhã
  criadoEm: string;
  atualizadoEm: string;
}

export type Priority = 'baixa' | 'media' | 'alta';
export type TaskStatus = 'a_fazer' | 'em_andamento' | 'concluido';

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  checklist: ChecklistItem[];
  valorAlvo?: number;   // presente = tarefa mensurável ("Estudar 5 artigos"); ausente = tarefa comum
  valorAtual?: number;  // quanto já foi feito — só tem sentido com valorAlvo; ausente conta como 0
  unidade?: string;     // "artigos", "km"...
  status: TaskStatus;
  order: number;        // posição dentro da coluna — menor vem primeiro
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  color: string;
  areaId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** 'foco' = bloco de foco planejado na visão Dia do calendário (tem hora de fim e, opcional, tarefa). */
export type EventType = 'evento' | 'comemoracao' | 'lembrete' | 'foco';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD' for multi-day
  type: EventType;
  areaId?: string;
  projectId?: string;
  description?: string;
  location?: string;
  time?: string;      // 'HH:MM' if has time
  endTime?: string;   // 'HH:MM' — fim no mesmo dia (blocos de foco e eventos com duração)
  taskId?: string;    // bloco de foco: a tarefa planejada (ausente = foco livre)
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type FaseTipo = 'foco' | 'descanso';

export interface CronometroFase {
  tipo: FaseTipo;
  minutos: number;
}

export interface CronometroPreset {
  id: string;
  nome: string;
  fases: CronometroFase[];   // sequência de blocos — um bloco único ou várias rodadas de foco/descanso
  areaId?: string;
  habitoId?: string;         // ao concluir a sessão inteira, marca esse hábito como feito hoje
  pronto?: boolean;          // true pros presets que já vêm com o app (não editáveis/excluíveis)
  criadoEm: string;
  atualizadoEm: string;
}

/** Sessão de cronômetro em andamento — persiste pra sobreviver a troca de aba e reload da página. */
export interface CronometroSessao {
  presetId: string;
  faseIndex: number;
  faseTerminaEm: string;        // ISO — instante em que a fase atual termina, se não estiver pausado
  pausadoRestanteMs?: number;   // quando pausado, quantos ms faltavam na fase atual
  pausado: boolean;
  sessaoId?: string;            // identifica a sessão — os blocos gravados são `${sessaoId}-${faseIndex}`
  faseIniciouEm?: string;       // ISO — quando a fase atual começou (vira o "início" do bloco gravado)
  taskId?: string;              // no que está focando; ausente = foco livre
  rotulo?: string;              // nome opcional do foco livre ("estudar", "e-mails")
  avulso?: { nome: string; fases: CronometroFase[] };  // sessão sem cronômetro salvo (bloco do calendário)
}

/** No que uma sessão de cronômetro vai focar: uma tarefa ou foco livre (com nome opcional). */
export type AlvoFoco = { taskId: string } | { rotulo?: string };

/**
 * Um bloco de foco feito — uma linha por fase de foco (descanso não conta). Tarefa, projeto e
 * área são copiados na hora: o histórico de tempo sobrevive se a tarefa for apagada depois.
 */
export interface SessaoFoco {
  id: string;            // `${sessaoId}-${faseIndex}` — gravar duas vezes não duplica
  inicio: string;        // ISO
  fim: string;           // ISO
  minutos: number;       // efetivos — pausa não conta
  taskId?: string;
  taskTitulo?: string;
  projectId?: string;
  areaId?: string;
  rotulo?: string;       // foco livre
  presetId?: string;
  nota?: string;         // "o que avançou?"
  criadoEm: string;
}

export type ObjetivoStatus = 'ativo' | 'concluido' | 'arquivado';

/** A chegada, mais geral — "Ser um corredor de longa distância". */
export interface Objetivo {
  id: string;
  titulo: string;
  descricao?: string;
  areaId?: string;
  habitoIds: string[];     // hábitos vinculados a esse objetivo — 0, 1 ou vários
  status: ObjetivoStatus;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Como o progresso de uma Meta é medido: 'habito' conta automaticamente os votos de um
 * hábito vinculado ao Objetivo (nunca guarda o número — sempre recalcula do histórico de
 * votos, pra nunca dessincronizar); 'manual' é um contador que a pessoa mesma ajusta,
 * pra metas que não correspondem a um voto de hábito (ex: "correr 10km").
 */
export type MetaRastreio = 'habito' | 'manual';

/** A parte quantificável e específica de um Objetivo — "Correr 40x até o fim do ano". */
export interface Meta {
  id: string;
  objetivoId: string;
  titulo: string;
  unidade?: string;        // "vezes", "km", "kg"...
  valorAlvo: number;
  rastreio: MetaRastreio;
  habitoId?: string;       // preenchido quando rastreio === 'habito' — um dos habitoIds do Objetivo
  valorManual?: number;    // preenchido/ajustado quando rastreio === 'manual'
  prazo?: string;          // 'YYYY-MM-DD', opcional
  criadoEm: string;
  atualizadoEm: string;
}

/** Escalas de organização — cada uma é um ciclo com início, meio e fim (linha de chegada). */
export type CicloEscala = 'semana' | 'mes' | 'semestre' | 'ano';

/**
 * Um compromisso do ciclo. 'meta' é binária (cumpri ou não); 'indicador' é um número medido
 * contra um alvo — `sentido` diz se o alvo é piso ('mais': pelo menos X) ou teto ('menos': no máximo X).
 */
export type CicloItemTipo = 'meta' | 'indicador';

export interface CicloItem {
  id: string;
  tipo: CicloItemTipo;
  titulo: string;
  areaId?: string;
  feito?: boolean;              // meta
  alvo?: number;                // indicador
  atual?: number;               // indicador — ausente = ainda não medido
  unidade?: string;             // indicador
  sentido?: 'mais' | 'menos';   // indicador
  acumula?: boolean;            // indicador — soma ao longo do período (treinos, gasto) e por isso tem ritmo;
                                // false = média ou valor pontual (horas de sono), só comparado com o alvo. Ausente = true.
}

/**
 * O planejamento de um período (semana/mês/semestre/ano). Só passa a existir no banco quando
 * algo é escrito nele. id = `${escala}-${inicio}` — no máximo um por período, como o ritual.
 */
export interface Ciclo {
  id: string;
  escala: CicloEscala;
  inicio: string;          // 'YYYY-MM-DD'
  fim: string;             // 'YYYY-MM-DD', inclusivo
  foco?: string;           // a linha de chegada: como quero que esse período termine
  itens: CicloItem[];
  meioNota?: string;       // ponto de redirecionamento no meio do período
  meioEm?: string;         // ISO — quando o ponto do meio foi registrado
  nota?: number;           // 1..5 — como foi o período, dada no fechamento
  funcionou?: string;
  naoFuncionou?: string;
  levar?: string;          // o que vai pro próximo período
  fechadoEm?: string;      // ISO — cruzou a linha de chegada
  criadoEm: string;
  atualizadoEm: string;
}
