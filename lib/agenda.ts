import { CalendarEvent, SessaoFoco } from './types';
import { blocosDoDia } from './foco';

/**
 * Contas da agenda de um dia — o que é bloco de foco, o que já virou foco de verdade e o que
 * "não aconteceu". Sem React; usado pela Hoje e pela aba Agenda do celular.
 */

/** Evento sem hora de fim ocupa isso. */
export const DURACAO_PADRAO_MIN = 60;

export const paraMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const paraHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
export const minutosDoIso = (iso: string) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); };
const cruza = (a: { ini: number; fim: number }, b: { ini: number; fim: number }) => Math.max(0, Math.min(a.fim, b.fim) - Math.max(a.ini, b.ini));

export interface ItemAgenda { ev: CalendarEvent; ini: number; fim: number }
export interface FeitoAgenda { s: SessaoFoco; ini: number; fim: number }

export const eventosDoDia = (eventos: CalendarEvent[], dia: string) =>
  eventos.filter(e => e.endDate ? e.date <= dia && e.endDate >= dia : e.date === dia);

/** Eventos com hora do dia, em ordem, com início e fim em minutos. */
export function itensComHora(eventos: CalendarEvent[], dia: string): ItemAgenda[] {
  return eventosDoDia(eventos, dia).filter(e => e.time).map(e => {
    const ini = paraMin(e.time!);
    const fim = e.endTime ? Math.max(paraMin(e.endTime), ini + 5) : ini + DURACAO_PADRAO_MIN;
    return { ev: e, ini, fim };
  }).sort((a, b) => a.ini - b.ini);
}

export function feitosDoDia(sessoes: SessaoFoco[], dia: string): FeitoAgenda[] {
  return blocosDoDia(sessoes, dia).map(s => {
    const ini = minutosDoIso(s.inicio);
    return { s, ini, fim: Math.max(ini + 5, ini + Math.round(s.minutos)) };
  });
}

/** Até que minuto o dia "já aconteceu": dia passado inteiro, hoje até agora, futuro nada. */
export const corteDoDia = (dia: string, hoje: string, agoraMin: number) => dia < hoje ? 24 * 60 : dia === hoje ? agoraMin : -1;

const mesmoAlvo = (ev: CalendarEvent, s: SessaoFoco) => ev.taskId ? s.taskId === ev.taskId : !s.taskId;

/** Minutos de foco de verdade dentro do bloco planejado (mesma tarefa, horário que se cruza). */
export function feitoNoBloco(item: ItemAgenda, feitos: FeitoAgenda[], corte: number): number {
  const janela = { ini: item.ini, fim: Math.min(item.fim, corte) };
  return feitos.filter(f => mesmoAlvo(item.ev, f.s)).reduce((a, f) => a + cruza(janela, f), 0);
}

/** "feito 50 min" / "não aconteceu" / "20 min até agora" — ou null se o bloco ainda não começou. */
export function estadoDoBloco(item: ItemAgenda, feitos: FeitoAgenda[], corte: number): { ok: boolean; minutos: number } | null {
  if (corte < item.ini) return null;
  const minutos = feitoNoBloco(item, feitos, corte);
  if (item.fim <= corte) return { ok: minutos > 0, minutos };
  return minutos > 0 ? { ok: true, minutos } : null;
}

/** Planejado (blocos de foco) × feito, e quantos blocos já passados viraram foco. */
export function resumoDoDia(itens: ItemAgenda[], feitos: FeitoAgenda[], corte: number) {
  const blocos = itens.filter(i => i.ev.type === 'foco');
  const passados = blocos.filter(b => b.fim <= corte);
  return {
    planejado: blocos.reduce((a, b) => a + (b.fim - b.ini), 0),
    feito: feitos.reduce((a, f) => a + Math.round(f.s.minutos), 0),
    blocosPassados: passados.length,
    blocosCumpridos: passados.filter(b => feitoNoBloco(b, feitos, corte) > 0).length,
  };
}
