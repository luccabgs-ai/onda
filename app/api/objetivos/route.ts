import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Meta, MetaRastreio, Objetivo, ObjetivoStatus } from '@/lib/types';

interface ObjetivoRow {
  id: string;
  titulo: string;
  descricao: string | null;
  area_id: string | null;
  habito_ids: string[];
  status: ObjetivoStatus;
  criado_em: string;
  atualizado_em: string;
}

interface MetaRow {
  id: string;
  objetivo_id: string;
  titulo: string;
  unidade: string | null;
  valor_alvo: number;
  rastreio: MetaRastreio;
  habito_id: string | null;
  valor_manual: number | null;
  prazo: string | null;
  criado_em: string;
  atualizado_em: string;
}

function rowToObjetivo(row: ObjetivoRow): Objetivo {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao ?? undefined,
    areaId: row.area_id ?? undefined,
    habitoIds: row.habito_ids,
    status: row.status,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

function rowToMeta(row: MetaRow): Meta {
  return {
    id: row.id,
    objetivoId: row.objetivo_id,
    titulo: row.titulo,
    unidade: row.unidade ?? undefined,
    valorAlvo: row.valor_alvo,
    rastreio: row.rastreio,
    habitoId: row.habito_id ?? undefined,
    valorManual: row.valor_manual ?? undefined,
    prazo: row.prazo ?? undefined,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export async function GET() {
  const [objetivosRes, metasRes] = await Promise.all([
    db.from('objetivos').select('*').order('criado_em'),
    db.from('metas').select('*').order('criado_em'),
  ]);
  if (objetivosRes.error) return NextResponse.json({ error: objetivosRes.error.message }, { status: 500 });
  if (metasRes.error) return NextResponse.json({ error: metasRes.error.message }, { status: 500 });

  return NextResponse.json({
    objetivos: (objetivosRes.data as ObjetivoRow[]).map(rowToObjetivo),
    metas: (metasRes.data as MetaRow[]).map(rowToMeta),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Objetivo;
  const { error } = await db.from('objetivos').upsert({
    id: body.id,
    titulo: body.titulo,
    descricao: body.descricao ?? null,
    area_id: body.areaId ?? null,
    habito_ids: body.habitoIds,
    status: body.status,
    criado_em: body.criadoEm,
    atualizado_em: body.atualizadoEm,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
