import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CronometroFase, CronometroPreset } from '@/lib/types';

interface Row {
  id: string;
  nome: string;
  fases: CronometroFase[];
  area_id: string | null;
  pronto: boolean;
  criado_em: string;
  atualizado_em: string;
}

function rowToPreset(row: Row): CronometroPreset {
  return {
    id: row.id,
    nome: row.nome,
    fases: row.fases,
    areaId: row.area_id ?? undefined,
    pronto: row.pronto,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export async function GET() {
  const { data, error } = await db.from('cronometro_presets').select('*').order('criado_em');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as Row[]).map(rowToPreset));
}

export async function POST(request: NextRequest) {
  const body = await request.json() as CronometroPreset;
  const { error } = await db.from('cronometro_presets').upsert({
    id: body.id,
    nome: body.nome,
    fases: body.fases,
    area_id: body.areaId ?? null,
    pronto: body.pronto ?? false,
    criado_em: body.criadoEm,
    atualizado_em: body.atualizadoEm,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
