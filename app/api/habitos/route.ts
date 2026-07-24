import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AncoraTipo, Habito } from '@/lib/types';

interface Row {
  id: string;
  identidade: string;
  area_id: string;
  acao: string;
  meta_atual: string;
  meta_original: string;
  ancora_tipo: string;
  ancora_habito_id: string | null;
  ancora_texto: string | null;
  dias_semana: number[];
  horario: string | null;
  local: string | null;
  votos: Record<string, boolean>;
  encolhimento_dismissado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

function rowToHabito(row: Row): Habito {
  return {
    id: row.id,
    identidade: row.identidade,
    areaId: row.area_id,
    acao: row.acao,
    metaAtual: row.meta_atual,
    metaOriginal: row.meta_original,
    ancoraTipo: row.ancora_tipo as AncoraTipo,
    ancoraHabitoId: row.ancora_habito_id ?? undefined,
    ancoraTexto: row.ancora_texto ?? undefined,
    diasSemana: row.dias_semana,
    horario: row.horario ?? undefined,
    local: row.local ?? undefined,
    votos: row.votos,
    encolhimentoDismissadoEm: row.encolhimento_dismissado_em ?? undefined,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export async function GET() {
  const { data, error } = await db.from('habitos').select('*').order('criado_em');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as Row[]).map(rowToHabito));
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Habito;
  const { error } = await db.from('habitos').upsert({
    id: body.id,
    identidade: body.identidade,
    area_id: body.areaId,
    acao: body.acao,
    meta_atual: body.metaAtual,
    meta_original: body.metaOriginal,
    ancora_tipo: body.ancoraTipo,
    ancora_habito_id: body.ancoraHabitoId ?? null,
    ancora_texto: body.ancoraTexto ?? null,
    dias_semana: body.diasSemana,
    horario: body.horario ?? null,
    local: body.local ?? null,
    votos: body.votos,
    encolhimento_dismissado_em: body.encolhimentoDismissadoEm ?? null,
    criado_em: body.criadoEm,
    atualizado_em: body.atualizadoEm,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
