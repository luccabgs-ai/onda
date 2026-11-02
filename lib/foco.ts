import { CronometroFase, CronometroPreset, CronometroSessao, Habito, Project, SessaoFoco, Task } from './types';
import { toDateStr } from './nutricao';
import { periodoDe } from './ciclos';

/**
 * Regras do tempo de foco, sem React — quanto um bloco vale, como ele é montado e as somas
 * por dia e semana. O store (focoStore.ts) só guarda e grava.
 */

/** Encerrar ou pular uma fase de foco antes do fim só guarda o tempo se passou disso. */
export const MINIMO_MIN_BLOCO_INTERROMPIDO = 5;

/** Sessão rápida com pausas: rodadas de 25 min de foco com 5 de descanso, até somar o tempo pedido. */
export const POMODORO_FOCO_MIN = 25;
export const POMODORO_DESCANSO_MIN = 5;

/**
 * As fases de uma sessão rápida de `minutos` de foco. Sem pausas é um bloco só. Com pausas, o
 * que sobra da última rodada vira uma rodada curta — ou, se for menos de 10 min, entra na
 * anterior (ninguém quer pausar pra depois focar 5 min).
 */
export function fasesDaSessaoRapida(minutos: number, pausas: boolean): CronometroFase[] {
  const total = Math.max(1, Math.round(minutos));
  if (!pausas || total <= POMODORO_FOCO_MIN) return [{ tipo: 'foco', minutos: total }];
  const focos: number[] = [];
  let resta = total;
  while (resta > 0) {
    const bloco = Math.min(POMODORO_FOCO_MIN, resta);
    if (bloco < 10 && focos.length > 0) focos[focos.length - 1] += bloco;
    else focos.push(bloco);
    resta -= bloco;
  }
  return focos.flatMap((m, i): CronometroFase[] => i === 0
    ? [{ tipo: 'foco', minutos: m }]
    : [{ tipo: 'descanso', minutos: POMODORO_DESCANSO_MIN }, { tipo: 'foco', minutos: m }]);
}

/**
 * O hábito que a sessão conclui no fim: o escolhido na hora (null = nenhum) ou, em sessão
 * começada sem escolher, o vinculado ao cronômetro.
 */
export function habitoDaSessao(sessao: CronometroSessao, preset: CronometroPreset): string | undefined {
  return sessao.habitoId === undefined ? preset.habitoId : sessao.habitoId ?? undefined;
}

/** id do bloco: uma linha por fase de foco de uma sessão — gravar de novo (duas abas) não duplica. */
export const idDoBloco = (sessao: CronometroSessao) => `${sessao.sessaoId ?? sessao.faseTerminaEm}-${sessao.faseIndex}`;

/**
 * Minutos efetivos feitos na fase atual. `cheia` = a fase acabou sozinha (conta inteira).
 * Senão é a duração menos o que falta — e o que falta congela na pausa, então pausa não conta.
 */
export function minutosFeitosNaFase(sessao: CronometroSessao, preset: CronometroPreset, agoraMs: number, cheia: boolean): number {
  const fase = preset.fases[sessao.faseIndex];
  if (!fase) return 0;
  if (cheia) return fase.minutos;
  const restanteMs = sessao.pausado
    ? sessao.pausadoRestanteMs ?? 0
    : Math.max(0, new Date(sessao.faseTerminaEm).getTime() - agoraMs);
  return Math.max(0, fase.minutos - restanteMs / 60000);
}

/**
 * Monta a linha do bloco, copiando título, projeto e área da tarefa naquele momento. Sem
 * tarefa, um hábito ligado à sessão dá o nome (se o foco livre não tiver um) e a área.
 */
export function montarBloco(params: {
  sessao: CronometroSessao;
  preset: CronometroPreset;
  minutos: number;
  fimMs: number;
  tasks: Task[];
  projects: Project[];
  habitos?: Habito[];
}): SessaoFoco {
  const { sessao, preset, minutos, fimMs, tasks, projects, habitos = [] } = params;
  const task = sessao.taskId ? tasks.find(t => t.id === sessao.taskId) : undefined;
  const project = task ? projects.find(p => p.id === task.projectId) : undefined;
  const habitoId = habitoDaSessao(sessao, preset);
  const habito = habitoId ? habitos.find(h => h.id === habitoId) : undefined;
  return {
    id: idDoBloco(sessao),
    inicio: sessao.faseIniciouEm ?? new Date(fimMs - minutos * 60000).toISOString(),
    fim: new Date(fimMs).toISOString(),
    minutos: Math.round(minutos * 10) / 10,
    taskId: task?.id,
    taskTitulo: task?.title,
    projectId: project?.id,
    areaId: project?.areaId ?? (task ? undefined : habito?.areaId) ?? preset.areaId,
    rotulo: task ? undefined : sessao.rotulo ?? habito?.acao,
    presetId: preset.id,
    criadoEm: new Date().toISOString(),
  };
}

// ── Somas (datas de início em UTC → dia local, como manda o CLAUDE.md) ─────────

export const diaDoBloco = (s: SessaoFoco) => toDateStr(new Date(s.inicio));
export const somaMinutos = (lista: SessaoFoco[]) => lista.reduce((a, s) => a + s.minutos, 0);

export function blocosDoDia(sessoes: SessaoFoco[], dia: string): SessaoFoco[] {
  return sessoes.filter(s => diaDoBloco(s) === dia).sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** Blocos da semana (seg–dom) que contém `hoje`. */
export function blocosDaSemana(sessoes: SessaoFoco[], hoje: string): SessaoFoco[] {
  const semana = periodoDe('semana', hoje);
  return sessoes.filter(s => { const d = diaDoBloco(s); return d >= semana.inicio && d <= semana.fim; });
}

/** "3h40", "25 min" — usado em todas as telas que mostram foco. */
export function formatarMinutos(min: number): string {
  const total = Math.round(min);
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60), m = total % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}
