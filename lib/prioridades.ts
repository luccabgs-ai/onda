import { Task, Habito, Project, CalendarEvent, PrioridadeRitual } from './types';
import { votouHoje } from './nutricao';

export type PrioridadeItem =
  | { kind: 'manual'; id: string; text: string; areaId?: string; done: boolean; slotIndex: number }
  | { kind: 'task'; id: string; text: string; areaId?: string; done: boolean; taskId: string; slotIndex: number }
  | { kind: 'habito'; id: string; text: string; areaId?: string; done: boolean; habitoId: string; slotIndex: number }
  | { kind: 'evento'; id: string; text: string; areaId?: string; done: boolean; eventId: string; time?: string; slotIndex?: number };

/**
 * Monta as prioridades do dia a partir das 3 escolhas feitas no ritual da manhã (`vitorias`) —
 * cada uma resolvida pro dado real (task/hábito/evento) ou mantida como texto manual — mais os
 * eventos do calendário de hoje, que sempre aparecem à parte (não fazem parte dos 3 slots, mas
 * um evento já escolhido como slot não se repete na lista). Slots que referenciam algo apagado
 * (task/hábito/evento removido) ou ainda vazios são simplesmente ignorados.
 */
export function computePrioridadesDoDia(params: {
  tasks: Task[];
  projects: Project[];
  habitos: Habito[];
  vitorias: PrioridadeRitual[];
  events: CalendarEvent[];
  hoje: string;
}): PrioridadeItem[] {
  const { tasks, projects, habitos, vitorias, events, hoje } = params;

  const areaDaTask = (t: Task) => projects.find(p => p.id === t.projectId)?.areaId;

  const itemsSlots: PrioridadeItem[] = [];
  vitorias.forEach((v, slotIndex) => {
    if (v.origem === 'manual' && v.texto?.trim()) {
      itemsSlots.push({ kind: 'manual', id: `slot-${slotIndex}`, text: v.texto, done: !!v.done, slotIndex });
    } else if (v.origem === 'task' && v.taskId) {
      const t = tasks.find(x => x.id === v.taskId);
      if (t) itemsSlots.push({ kind: 'task', id: `slot-${slotIndex}`, text: t.title, areaId: areaDaTask(t), done: t.status === 'concluido', taskId: t.id, slotIndex });
    } else if (v.origem === 'habito' && v.habitoId) {
      const h = habitos.find(x => x.id === v.habitoId);
      if (h) itemsSlots.push({ kind: 'habito', id: `slot-${slotIndex}`, text: h.acao, areaId: h.areaId, done: votouHoje(h, hoje), habitoId: h.id, slotIndex });
    } else if (v.origem === 'evento' && v.eventoId) {
      const e = events.find(x => x.id === v.eventoId);
      if (e) itemsSlots.push({ kind: 'evento', id: `slot-${slotIndex}`, text: e.title, areaId: e.areaId, done: false, eventId: e.id, time: e.time, slotIndex });
    }
  });

  const idsEventosEmSlot = new Set(
    itemsSlots.filter((i): i is Extract<PrioridadeItem, { kind: 'evento' }> => i.kind === 'evento').map(i => i.eventId)
  );

  const itemsEventos: PrioridadeItem[] = events
    .filter(e => e.date <= hoje && (e.endDate ?? e.date) >= hoje && !idsEventosEmSlot.has(e.id))
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
    .map(e => ({ kind: 'evento', id: `evento-${e.id}`, text: e.title, areaId: e.areaId, done: false, eventId: e.id, time: e.time }));

  return [...itemsSlots, ...itemsEventos];
}
