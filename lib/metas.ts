import { Habito, Meta } from './types';
import { toDateStr } from './nutricao';

/**
 * Valor atual de uma Meta. Pra metas vinculadas a hábito, nunca é guardado — é sempre
 * recalculado contando os votos do hábito desde que a meta foi criada (e até o prazo, se
 * houver um). Isso evita qualquer chance de o contador dessincronizar do histórico real.
 */
export function valorAtualDeMeta(meta: Meta, habitos: Habito[]): number {
  if (meta.rastreio === 'manual') return meta.valorManual ?? 0;

  const habito = habitos.find(h => h.id === meta.habitoId);
  if (!habito) return 0;

  const desde = meta.criadoEm.slice(0, 10);
  return Object.keys(habito.votos).filter(data => {
    if (data < desde) return false;
    if (meta.prazo && data > meta.prazo) return false;
    return true;
  }).length;
}

export function progressoDeMeta(meta: Meta, habitos: Habito[]): number {
  if (meta.valorAlvo <= 0) return 0;
  return Math.min(1, valorAtualDeMeta(meta, habitos) / meta.valorAlvo);
}

export function metaConcluida(meta: Meta, habitos: Habito[]): boolean {
  return valorAtualDeMeta(meta, habitos) >= meta.valorAlvo;
}

export function diasRestantes(prazo: string, hoje: string = toDateStr(new Date())): number {
  const d1 = new Date(hoje + 'T12:00:00').getTime();
  const d2 = new Date(prazo + 'T12:00:00').getTime();
  return Math.round((d2 - d1) / 86400000);
}

/** Quantas metas de um Objetivo já bateram o alvo, do total. */
export function progressoDoObjetivo(metasDoObjetivo: Meta[], habitos: Habito[]): { concluidas: number; total: number } {
  return {
    concluidas: metasDoObjetivo.filter(m => metaConcluida(m, habitos)).length,
    total: metasDoObjetivo.length,
  };
}
