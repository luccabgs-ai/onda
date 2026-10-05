import { Ciclo, CicloEscala, CicloItem } from './types';
import { addDays, toDateStr } from './nutricao';

export interface Periodo {
  escala: CicloEscala;
  inicio: string;   // 'YYYY-MM-DD'
  fim: string;      // 'YYYY-MM-DD', inclusivo
}

/**
 * O que muda de uma escala pra outra. Hoje as quatro telas são iguais e só o texto difere —
 * quando cada escala ganhar formato próprio, é aqui que a diferença começa.
 */
export const ESCALAS: Record<CicloEscala, {
  label: string;
  jp: string;
  artigo: string;               // "esta semana", "este mês"…
  pai?: CicloEscala;            // a escala maior em que esta se encaixa
  diasParaFechar: number;       // a partir de quantos dias do fim o fechamento é sugerido
  perguntaFoco: string;
}> = {
  semana:   { label: 'Semana',   jp: '週',   artigo: 'esta semana',   pai: 'mes',      diasParaFechar: 1,  perguntaFoco: 'Como você quer que esta semana termine?' },
  mes:      { label: 'Mês',      jp: '月',   artigo: 'este mês',      pai: 'semestre', diasParaFechar: 3,  perguntaFoco: 'O que precisa estar verdade no último dia do mês?' },
  semestre: { label: 'Semestre', jp: '半期', artigo: 'este semestre', pai: 'ano',      diasParaFechar: 14, perguntaFoco: 'Onde você quer estar na metade (ou no fim) do ano?' },
  ano:      { label: 'Ano',      jp: '年',   artigo: 'este ano',                       diasParaFechar: 30, perguntaFoco: 'Que ano você quer ter vivido quando ele acabar?' },
};

export const ORDEM_ESCALAS: CicloEscala[] = ['semana', 'mes', 'semestre', 'ano'];

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const pad = (n: number) => String(n).padStart(2, '0');
const partes = (d: string) => d.split('-').map(Number) as [number, number, number];
const ultimoDiaDoMes = (ano: number, mes: number) => new Date(ano, mes, 0).getDate(); // mes 1..12

/** O período da escala que contém `data`. Semana vai de segunda a domingo. */
export function periodoDe(escala: CicloEscala, data: string): Periodo {
  const [ano, mes] = partes(data);
  switch (escala) {
    case 'semana': {
      const dow = new Date(data + 'T12:00:00').getDay(); // 0=dom
      const inicio = addDays(data, dow === 0 ? -6 : 1 - dow);
      return { escala, inicio, fim: addDays(inicio, 6) };
    }
    case 'mes':
      return { escala, inicio: `${ano}-${pad(mes)}-01`, fim: `${ano}-${pad(mes)}-${pad(ultimoDiaDoMes(ano, mes))}` };
    case 'semestre':
      return mes <= 6
        ? { escala, inicio: `${ano}-01-01`, fim: `${ano}-06-30` }
        : { escala, inicio: `${ano}-07-01`, fim: `${ano}-12-31` };
    case 'ano':
      return { escala, inicio: `${ano}-01-01`, fim: `${ano}-12-31` };
  }
}

export const periodoAnterior = (p: Periodo) => periodoDe(p.escala, addDays(p.inicio, -1));
export const periodoSeguinte = (p: Periodo) => periodoDe(p.escala, addDays(p.fim, 1));
export const idDoCiclo = (p: Periodo) => `${p.escala}-${p.inicio}`;

export function diasEntre(de: string, ate: string): number {
  return Math.round((new Date(ate + 'T12:00:00').getTime() - new Date(de + 'T12:00:00').getTime()) / 86400000);
}

export const duracaoEmDias = (p: Periodo) => diasEntre(p.inicio, p.fim) + 1;

/** O dia do ponto de redirecionamento — o meio do período. */
export const meioDoPeriodo = (p: Periodo) => addDays(p.inicio, Math.floor((duracaoEmDias(p) - 1) / 2));

/** Quanto do período já passou, de 0 a 1 (conta o dia de hoje como vivido pela metade). */
export function fracaoDecorrida(p: Periodo, hoje: string): number {
  if (hoje < p.inicio) return 0;
  if (hoje > p.fim) return 1;
  return (diasEntre(p.inicio, hoje) + 0.5) / duracaoEmDias(p);
}

/** Dias que faltam até a linha de chegada, contando hoje. */
export const diasRestantes = (p: Periodo, hoje: string) => diasEntre(hoje, p.fim) + 1;

/** Semana ISO (a que contém a quinta-feira) — "Semana 40". */
function numeroDaSemana(inicioSegunda: string): number {
  const quinta = addDays(inicioSegunda, 3);
  const [ano] = partes(quinta);
  return Math.floor(diasEntre(`${ano}-01-01`, quinta) / 7) + 1;
}

export const dataCurta = (d: string) => {
  const [, mes, dia] = partes(d);
  return `${dia} ${MESES_CURTOS[mes - 1]}`;
};

export function rotuloDoPeriodo(p: Periodo): { titulo: string; sub: string } {
  const [ano, mes] = partes(p.inicio);
  switch (p.escala) {
    case 'semana':
      return { titulo: `Semana ${numeroDaSemana(p.inicio)}`, sub: `${dataCurta(p.inicio)} – ${dataCurta(p.fim)}` };
    case 'mes':
      return { titulo: MESES[mes - 1].replace(/^./, c => c.toUpperCase()), sub: String(ano) };
    case 'semestre':
      return { titulo: `${mes === 1 ? '1º' : '2º'} semestre`, sub: `${ano} · ${mes === 1 ? 'jan – jun' : 'jul – dez'}` };
    case 'ano':
      return { titulo: String(ano), sub: 'jan – dez' };
  }
}

// ── Itens ─────────────────────────────────────────────────────────────────────

export function itemAtingido(item: CicloItem): boolean {
  if (item.tipo === 'meta') return !!item.feito;
  if (item.atual === undefined || item.alvo === undefined) return false;
  return item.sentido === 'menos' ? item.atual <= item.alvo : item.atual >= item.alvo;
}

/** Progresso visual de 0 a 1. Indicador "no máximo" só mostra cheio ou vazio — não há "caminho". */
export function progressoDoItem(item: CicloItem): number {
  if (item.tipo === 'meta') return item.feito ? 1 : 0;
  if (item.atual === undefined || !item.alvo) return itemAtingido(item) ? 1 : 0;
  if (item.sentido === 'menos') return itemAtingido(item) ? 1 : 0;
  return Math.min(1, Math.max(0, item.atual / item.alvo));
}

export function placarDoCiclo(ciclo: Ciclo | undefined): { atingidos: number; total: number } {
  const itens = ciclo?.itens ?? [];
  return { atingidos: itens.filter(itemAtingido).length, total: itens.length };
}

// ── Momento do ciclo ──────────────────────────────────────────────────────────

export type MomentoCiclo =
  | 'futuro'      // ainda não começou
  | 'sem_plano'   // começou e não tem linha de chegada nem itens
  | 'em_curso'
  | 'meio'        // passou do meio e o ponto de redirecionamento não foi feito
  | 'fechar'      // perto do fim — hora de revisar
  | 'em_aberto'   // terminou sem ser fechado
  | 'fechado';

export function momentoDoCiclo(p: Periodo, ciclo: Ciclo | undefined, hoje: string): MomentoCiclo {
  if (ciclo?.fechadoEm) return 'fechado';
  if (hoje > p.fim) return 'em_aberto';
  const temPlano = !!ciclo && (!!ciclo.foco?.trim() || ciclo.itens.length > 0);
  if (hoje < p.inicio) return 'futuro';
  if (!temPlano) return 'sem_plano';
  if (diasRestantes(p, hoje) <= ESCALAS[p.escala].diasParaFechar) return 'fechar';
  if (hoje >= meioDoPeriodo(p) && !ciclo?.meioEm) return 'meio';
  return 'em_curso';
}

export const MOMENTO_LABEL: Record<MomentoCiclo, string> = {
  futuro: 'ainda não começou',
  sem_plano: 'sem linha de chegada',
  em_curso: 'em curso',
  meio: 'hora do ponto do meio',
  fechar: 'hora de fechar',
  em_aberto: 'terminou em aberto',
  fechado: 'fechado',
};

export const hojeStr = () => toDateStr(new Date());
