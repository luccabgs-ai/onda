import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if ('nome' in body) patch.nome = body.nome;
  if ('fases' in body) patch.fases = body.fases;
  if ('areaId' in body) patch.area_id = body.areaId ?? null;
  if ('habitoId' in body) patch.habito_id = body.habitoId ?? null;
  patch.atualizado_em = new Date().toISOString();

  const { error } = await db.from('cronometro_presets').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await db.from('cronometro_presets').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
