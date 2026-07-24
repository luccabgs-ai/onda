import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if ('titulo' in body) patch.titulo = body.titulo;
  if ('descricao' in body) patch.descricao = body.descricao ?? null;
  if ('areaId' in body) patch.area_id = body.areaId ?? null;
  if ('habitoIds' in body) patch.habito_ids = body.habitoIds;
  if ('status' in body) patch.status = body.status;
  patch.atualizado_em = new Date().toISOString();

  const { error } = await db.from('objetivos').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Apagar o objetivo também apaga as metas dele (ON DELETE CASCADE no banco). */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await db.from('objetivos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
