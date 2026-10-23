import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PrioridadeRitual } from '@/lib/types';
import { enviarParaTodos, hojeNoBrasil, pushConfigurado, Notificacao } from '@/lib/push';

/**
 * Chamada pelo agendador da Vercel (vercel.json → crons) três vezes por dia. A mensagem olha o
 * que já aconteceu hoje: quem já abriu o dia não recebe o lembrete da manhã, quem já fechou não
 * recebe o da noite. Fora do proxy de senha — autentica pelo CRON_SECRET que a Vercel envia.
 */
type Momento = 'manha' | 'meio' | 'noite';

async function vitoriasFeitas(vitorias: PrioridadeRitual[], hoje: string): Promise<{ feitas: number; total: number }> {
  const preenchidas = vitorias.filter(v =>
    (v.origem === 'manual' && v.texto?.trim()) || v.taskId || v.habitoId || v.eventoId);
  const taskIds = preenchidas.filter(v => v.origem === 'task' && v.taskId).map(v => v.taskId!);
  const habitoIds = preenchidas.filter(v => v.origem === 'habito' && v.habitoId).map(v => v.habitoId!);
  const [tasks, habitos] = await Promise.all([
    taskIds.length ? db.from('tasks').select('id, status').in('id', taskIds) : Promise.resolve({ data: [] }),
    habitoIds.length ? db.from('habitos').select('id, votos').in('id', habitoIds) : Promise.resolve({ data: [] }),
  ]);
  const statusDe = new Map((tasks.data ?? []).map((t: { id: string; status: string }) => [t.id, t.status]));
  const votosDe = new Map((habitos.data ?? []).map((h: { id: string; votos: Record<string, boolean> }) => [h.id, h.votos]));
  const feitas = preenchidas.filter(v => {
    if (v.origem === 'manual') return !!v.done;
    if (v.origem === 'task') return statusDe.get(v.taskId!) === 'concluido';
    if (v.origem === 'habito') return !!votosDe.get(v.habitoId!)?.[hoje];
    return false; // evento ainda não "aconteceu" no meio do dia
  }).length;
  return { feitas, total: preenchidas.length };
}

async function montar(momento: Momento, hoje: string): Promise<Notificacao | null> {
  const { data, error } = await db.from('rituais').select('tipo, vitorias').eq('data', hoje);
  if (error) throw new Error(error.message);
  const manha = data?.find(r => r.tipo === 'manha');
  const noite = data?.find(r => r.tipo === 'noite');

  if (momento === 'manha') {
    if (manha) return null;
    return { titulo: 'Bom dia', corpo: 'Abra o dia: como você acordou e as 3 vitórias de hoje.', tag: 'manha' };
  }
  if (momento === 'meio') {
    if (!manha) return { titulo: 'Meio do dia', corpo: 'O dia ainda não foi aberto. Dá tempo de escolher o que faz ele valer.', tag: 'meio' };
    const { feitas, total } = await vitoriasFeitas((manha.vitorias ?? []) as PrioridadeRitual[], hoje);
    return {
      titulo: 'Meio do dia',
      corpo: total > 0 ? `${feitas} de ${total} vitórias até agora. Ainda faz sentido o que sobrou?` : 'Pausa rápida: o resto do dia ainda faz sentido?',
      tag: 'meio',
    };
  }
  if (noite) return null;
  return { titulo: 'Fechar o dia', corpo: 'Dois minutos: como foi e o que fica pra amanhã.', tag: 'noite' };
}

export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 });
  }
  const momento = request.nextUrl.searchParams.get('momento') as Momento | null;
  if (momento !== 'manha' && momento !== 'meio' && momento !== 'noite') {
    return NextResponse.json({ error: 'momento inválido' }, { status: 400 });
  }
  if (!pushConfigurado) return NextResponse.json({ error: 'notificações não configuradas' }, { status: 503 });

  try {
    const n = await montar(momento, hojeNoBrasil());
    if (!n) return NextResponse.json({ ok: true, pulado: 'já feito hoje' });
    return NextResponse.json({ ok: true, ...(await enviarParaTodos(n)) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
