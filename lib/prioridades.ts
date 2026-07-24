import { Task, Habito, Project, PrioridadeManual, Priority, CalendarEvent } from './types';
import { estaAgendadoEm, votouHoje } from './nutricao';

export type PrioridadeItem =
  | { kind: 'manual'; id: string; text: string; areaId?: string; done: boolean }
  | { kind: 'task'; id: string; text: string; areaId?: string; done: boolean; taskId: string; priority: Priority }
  | { kind: 'habito'; id: string; text: string; areaId?: string; done: boolean; habitoId: string }
  | { kind: 'evento'; id: string; text: string; areaId?: string; done: boolean; eventId: string; time?: string };

const PESO_PRIORIDADE: Record<Priority, number> = { alta: 2, media: 1, baixa: 0 };

function ordenarTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pesoDiff = PESO_PRIORIDADE[b.priority] - PESO_PRIORIDADE[a.priority];
    if (pesoDiff !== 0) return pesoDiff;
    const dueDiff = (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
    if (dueDiff !== 0) return dueDiff;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

/**
 * Monta as prioridades do dia: prioridades manuais e eventos do calendário de hoje primeiro
 * (sempre aparecem, sem contar pro `limite`), depois preenche as vagas restantes até `limite`
 * na ordem: 1) tasks alta/média vencidas ou de hoje, 2) hábito agendado e ainda não votado da
 * Área mais negligenciada, 3) tasks baixa vencidas ou de hoje. Cada fonte já filtra o que está
 * concluído/votado — assim que o usuário resolve um item automático, ele sai da lista e o
 * próximo candidato do pool assume a vaga.
 */
export function computePrioridadesDoDia(params: {
  tasks: Task[];
  projects: Project[];
  habitos: Habito[];
  manuais: PrioridadeManual[];
  events: CalendarEvent[];
  nutridoMap: Record<string, number>;
  hoje: string;
  limite?: number;
}): PrioridadeItem[] {
  const { tasks, projects, habitos, manuais, events, nutridoMap, hoje, limite = 3 } = params;

  const areaDaTask = (t: Task) => projects.find(p => p.id === t.projectId)?.areaId;

  const itemsManuais: PrioridadeItem[] = manuais
    .filter(m => m.data === hoje)
    .map(m => ({ kind: 'manual', id: m.id, text: m.text, areaId: m.areaId, done: m.done }));

  const eventosHoje = events
    .filter(e => e.date <= hoje && (e.endDate ?? e.date) >= hoje)
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
  const itemsEventos: PrioridadeItem[] = eventosHoje.map(e =>
    ({ kind: 'evento', id: e.id, text: e.title, areaId: e.areaId, done: false, eventId: e.id, time: e.time }));

  const items: PrioridadeItem[] = [...itemsManuais, ...itemsEventos];

  const tasksAbertas = tasks.filter(t => t.status !== 'concluido' && t.dueDate !== undefined && t.dueDate <= hoje);
  const altaMedia = ordenarTasks(tasksAbertas.filter(t => t.priority !== 'baixa'));
  const baixa = ordenarTasks(tasksAbertas.filter(t => t.priority === 'baixa'));

  const habitosPendentes = habitos
    .filter(h => estaAgendadoEm(h, hoje) && !votouHoje(h, hoje))
    .sort((a, b) => (nutridoMap[a.areaId] ?? 1) - (nutridoMap[b.areaId] ?? 1));

  const taskToItem = (t: Task): PrioridadeItem =>
    ({ kind: 'task', id: t.id, text: t.title, areaId: areaDaTask(t), done: false, taskId: t.id, priority: t.priority });
  const habitoToItem = (h: Habito): PrioridadeItem =>
    ({ kind: 'habito', id: h.id, text: h.acao, areaId: h.areaId, done: false, habitoId: h.id });

  const pools: PrioridadeItem[][] = [
    altaMedia.map(taskToItem),
    habitosPendentes.map(habitoToItem),
    baixa.map(taskToItem),
  ];

  for (const pool of pools) {
    if (items.length >= limite) break;
    for (const item of pool) {
      if (items.length >= limite) break;
      items.push(item);
    }
  }

  return items;
}
