import { Area, Habito, Meta, Objetivo, Project, Task } from './types';
import { computeNutridoMap, toDateStr } from './nutricao';
import { progressoDeMeta, metaConcluida, valorAtualDeMeta } from './metas';

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const formatarDataCurta = (dataStr: string) => {
  const d = new Date(dataStr + 'T12:00:00');
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
};

/** Sequência de dias seguidos com pelo menos um voto de hábito nessa área (hoje conta se já votou; senão começa de ontem). */
function streakDiasArea(areaId: string, habitos: Habito[], hoje: string = toDateStr(new Date())): number {
  const habitosDaArea = habitos.filter(h => h.areaId === areaId);
  if (habitosDaArea.length === 0) return 0;

  let cursor = hoje;
  if (!habitosDaArea.some(h => h.votos[cursor])) cursor = addDays(cursor, -1);

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (!habitosDaArea.some(h => h.votos[cursor])) break;
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Instante mais recente de qualquer atividade ligada à área: voto de hábito, ou task/projeto atualizado. */
function ultimaAtividadeArea(areaId: string, habitos: Habito[], projects: Project[], tasks: Task[]): number | null {
  const momentos: number[] = [];

  for (const h of habitos.filter(h => h.areaId === areaId)) {
    for (const data of Object.keys(h.votos)) {
      if (h.votos[data]) momentos.push(new Date(data + 'T12:00:00').getTime());
    }
  }

  const projetosDaArea = projects.filter(p => p.areaId === areaId);
  for (const p of projetosDaArea) momentos.push(new Date(p.updatedAt).getTime());

  const idsProjetos = new Set(projetosDaArea.map(p => p.id));
  for (const t of tasks.filter(t => idsProjetos.has(t.projectId))) momentos.push(new Date(t.updatedAt).getTime());

  return momentos.length > 0 ? Math.max(...momentos) : null;
}

function formatarRelativo(momento: number | null): string {
  if (momento === null) return 'sem atividade ainda';
  const diffMin = Math.round((Date.now() - momento) / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffDias = Math.round(diffH / 24);
  if (diffDias === 1) return 'ontem';
  return `há ${diffDias} dias`;
}

function objetivoInfoDaArea(areaId: string, objetivos: Objetivo[]): { texto: string; temObjetivo: boolean } {
  const ativos = objetivos.filter(o => o.areaId === areaId && o.status === 'ativo');
  if (ativos.length === 0) return { texto: 'Nenhum objetivo definido ainda — crie um na aba Objetivos.', temObjetivo: false };
  const extras = ativos.length > 1 ? ` (+${ativos.length - 1} outro${ativos.length > 2 ? 's' : ''})` : '';
  return { texto: ativos[0].titulo + extras, temObjetivo: true };
}

function resumoProjeto(project: Project, tasks: Task[]) {
  const tasksDoProjeto = tasks.filter(t => t.projectId === project.id);
  const total = tasksDoProjeto.length;
  const concluidas = tasksDoProjeto.filter(t => t.status === 'concluido').length;
  const progress = total > 0 ? concluidas / total : 0;
  const status =
    total === 0 ? 'sem tarefas ainda' :
    concluidas === total ? 'concluído' :
    tasksDoProjeto.some(t => t.status === 'em_andamento') ? 'em andamento' :
    'não iniciado';
  const proximoPrazo = tasksDoProjeto
    .filter(t => t.dueDate && t.status !== 'concluido')
    .map(t => t.dueDate!)
    .sort()[0];

  return { name: project.title, status, due: proximoPrazo ? formatarDataCurta(proximoPrazo) : '', progress };
}

export interface AreaVista {
  id: string;
  name: string;
  sub: string;
  kanji: string;
  color: string;
  nutrido: number;
  habitosCount: number;
  projetosCount: number;
  ultima: string;
  objetivoTexto: string;
  temObjetivo: boolean;
  streakDias: number;
  projetosDetalhe: { name: string; status: string; due: string; progress: number }[];
  metasDetalhe: { titulo: string; unidade?: string; valorAtual: number; valorAlvo: number; progresso: number; concluida: boolean }[];
}

export function montarAreasVista(
  areas: Area[],
  habitos: Habito[],
  projects: Project[],
  tasks: Task[],
  objetivos: Objetivo[],
  metas: Meta[],
): AreaVista[] {
  const nutridoMap = computeNutridoMap(habitos, areas);

  return areas.map(area => {
    const projetosDaArea = projects.filter(p => p.areaId === area.id);
    const objetivoIds = objetivos.filter(o => o.areaId === area.id).map(o => o.id);
    const metasDaArea = metas.filter(m => objetivoIds.includes(m.objetivoId));
    const objetivoInfo = objetivoInfoDaArea(area.id, objetivos);

    return {
      id: area.id,
      name: area.name,
      sub: area.sub,
      kanji: area.kanji,
      color: area.color,
      nutrido: nutridoMap[area.id] ?? area.nutrido,
      habitosCount: habitos.filter(h => h.areaId === area.id).length,
      projetosCount: projetosDaArea.length,
      ultima: formatarRelativo(ultimaAtividadeArea(area.id, habitos, projects, tasks)),
      objetivoTexto: objetivoInfo.texto,
      temObjetivo: objetivoInfo.temObjetivo,
      streakDias: streakDiasArea(area.id, habitos),
      projetosDetalhe: projetosDaArea.map(p => resumoProjeto(p, tasks)),
      metasDetalhe: metasDaArea.map(m => ({
        titulo: m.titulo,
        unidade: m.unidade,
        valorAtual: valorAtualDeMeta(m, habitos),
        valorAlvo: m.valorAlvo,
        progresso: progressoDeMeta(m, habitos),
        concluida: metaConcluida(m, habitos),
      })),
    };
  });
}
