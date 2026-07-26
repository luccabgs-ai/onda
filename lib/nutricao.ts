import { Habito, Area } from './types';

export const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

export const DOW_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6];

/** Hábitos criados antes desse campo existir contam como "todo dia". */
function diasSemanaDe(habito: Habito): number[] {
  return habito.diasSemana ?? TODOS_OS_DIAS;
}

export function estaAgendadoEm(habito: Habito, dateStr: string): boolean {
  const dow = new Date(dateStr + 'T12:00:00').getDay();
  return diasSemanaDe(habito).includes(dow);
}

/** Dias anteriores à criação do hábito não contam em nenhum cálculo — ele ainda não existia. */
function existiaEm(habito: Habito, dateStr: string): boolean {
  return habito.criadoEm.slice(0, 10) <= dateStr;
}

export function descreverFrequencia(diasSemana: number[]): string {
  if (diasSemana.length === 7) return 'todo dia';
  if (diasSemana.length === 0) return 'sem dias definidos';
  return [...diasSemana].sort((a, b) => a - b).map(d => DOW_LABELS[d]).join(', ');
}

/**
 * Conta faltas seguidas olhando pra trás a partir de ontem, mas só considera os dias em
 * que o hábito estava agendado — dias fora da frequência escolhida não contam nem quebram
 * a sequência. Hoje não conta — ainda pode ser votado.
 */
export function faltasConsecutivas(habito: Habito, hoje: string = toDateStr(new Date())): number {
  let faltas = 0;
  let cursor = addDays(hoje, -1);
  // limite de segurança: não olha mais que 365 dias pra trás
  for (let i = 0; i < 365; i++) {
    if (!existiaEm(habito, cursor)) break;
    if (estaAgendadoEm(habito, cursor)) {
      if (habito.votos[cursor]) break;
      faltas++;
    }
    cursor = addDays(cursor, -1);
  }
  return faltas;
}

export function votouHoje(habito: Habito, hoje: string = toDateStr(new Date())): boolean {
  return !!habito.votos[hoje];
}

/** A partir de 3 faltas seguidas, e se a última recusa não foi hoje/ontem, oferece encolher a meta. */
export function deveOferecerEncolhimento(habito: Habito, hoje: string = toDateStr(new Date())): boolean {
  if (faltasConsecutivas(habito, hoje) < 3) return false;
  if (!habito.encolhimentoDismissadoEm) return true;
  const diasDesdeRecusa = Math.round(
    (new Date(hoje + 'T12:00:00').getTime() - new Date(habito.encolhimentoDismissadoEm + 'T12:00:00').getTime()) / 86400000
  );
  return diasDesdeRecusa >= 4;
}

const DECAY = 0.93;
const JANELA = 30;

/**
 * Nutrição de cada Área = média ponderada (decaimento exponencial) da fração de hábitos
 * daquela Área votados em cada um dos últimos 30 dias, contando os hábitos agendados naquele
 * dia da semana — mais qualquer hábito votado naquele dia mesmo sem estar agendado (um voto
 * "bônus" fora do dia sempre conta a favor, nunca é ignorado). Um voto hoje pesa o máximo;
 * cada dia sem voto a contribuição anterior esmaece ~7%, nunca despenca de uma vez. Dias sem
 * nenhum hábito agendado ou votado não entram na média (não penalizam nem inflam o resultado).
 * Áreas sem nenhum hábito mantêm o valor estático de fallback (areas[].nutrido).
 */
export function computeNutridoMap(
  habitos: Habito[],
  areas: Area[],
  hoje: string = toDateStr(new Date())
): Record<string, number> {
  const map: Record<string, number> = {};

  for (const area of areas) {
    const habitosDaArea = habitos.filter(h => h.areaId === area.id);
    if (habitosDaArea.length === 0) {
      map[area.id] = area.nutrido;
      continue;
    }

    let weightedSum = 0;
    let weightTotal = 0;
    let cursor = hoje;

    for (let k = 0; k < JANELA; k++) {
      const w = Math.pow(DECAY, k);
      const relevantesDoDia = habitosDaArea.filter(h => (existiaEm(h, cursor) && estaAgendadoEm(h, cursor)) || h.votos[cursor]);
      if (relevantesDoDia.length > 0) {
        const votados = relevantesDoDia.filter(h => h.votos[cursor]).length;
        const scoreDoDia = votados / relevantesDoDia.length;
        weightedSum += w * scoreDoDia;
        weightTotal += w;
      }
      cursor = addDays(cursor, -1);
    }

    map[area.id] = weightTotal > 0 ? weightedSum / weightTotal : area.nutrido;
  }

  return map;
}

/** Grade dos últimos N dias pra exibir como campo que fica mais verde, não como corrente. */
export function historicoGrid(habito: Habito, dias: number = 30, hoje: string = toDateStr(new Date())): { date: string; voted: boolean; scheduled: boolean }[] {
  const out: { date: string; voted: boolean; scheduled: boolean }[] = [];
  let cursor = addDays(hoje, -(dias - 1));
  for (let i = 0; i < dias; i++) {
    out.push({ date: cursor, voted: !!habito.votos[cursor], scheduled: existiaEm(habito, cursor) && estaAgendadoEm(habito, cursor) });
    cursor = addDays(cursor, 1);
  }
  return out;
}
