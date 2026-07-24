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

/** Prioridade adicionada à mão pelo usuário — soma-se às sugeridas automaticamente pelo app. */
export interface PrioridadeManual {
  id: string;
  text: string;
  areaId?: string;
  done: boolean;
  data: string;       // 'YYYY-MM-DD' — dia ao qual essa prioridade pertence
  createdAt: string;
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

export interface TodayData {
  dataExtensa: string;
  intencao: string;
  energia: number;
}

export interface RitualEntry {
  date: string;
  dow: string;
  energiaAM: number;
  energiaPM: number;
  intencao: string;
  funcionou: string;
  carrega: string;
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
  createdAt: string;
  updatedAt: string;
}

export type EventType = 'evento' | 'comemoracao' | 'lembrete';

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
