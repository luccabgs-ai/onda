import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SessaoFoco } from '@/lib/types';

interface Row {
  id: string;
  inicio: string;
  fim: string;
  minutos: number;
  task_id: string | null;
  task_titulo: string | null;
  project_id: string | null;
  area_id: string | null;
  rotulo: string | null;
  preset_id: string | null;
  nota: string | null;
  criado_em: string;
}

function rowToSessao(row: Row): SessaoFoco {
  return {
    id: row.id,
    inicio: row.inicio,
    fim: row.fim,
    minutos: row.minutos,
    taskId: row.task_id ?? undefined,
    taskTitulo: row.task_titulo ?? undefined,
    projectId: row.project_id ?? undefined,
    areaId: row.area_id ?? undefined,
    rotulo: row.rotulo ?? undefined,
    presetId: row.preset_id ?? undefined,
    nota: row.nota ?? undefined,
    criadoEm: row.criado_em,
  };
}

export async function GET() {
  const { data, error } = await db.from('sessoes_foco').select('*').order('inicio');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as Row[]).map(rowToSessao));
}

/** upsert: o mesmo bloco gravado duas vezes (duas abas abertas) vira uma linha só. */
export async function POST(request: NextRequest) {
  const body = await request.json() as SessaoFoco;
  const { error } = await db.from('sessoes_foco').upsert({
    id: body.id,
    inicio: body.inicio,
    fim: body.fim,
    minutos: body.minutos,
    task_id: body.taskId ?? null,
    task_titulo: body.taskTitulo ?? null,
    project_id: body.projectId ?? null,
    area_id: body.areaId ?? null,
    rotulo: body.rotulo ?? null,
    preset_id: body.presetId ?? null,
    nota: body.nota ?? null,
    criado_em: body.criadoEm,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
