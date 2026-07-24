import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if ('titulo' in body) patch.titulo = body.titulo;
  if ('unidade' in body) patch.unidade = body.unidade ?? null;
  if ('valorAlvo' in body) patch.valor_alvo = body.valorAlvo;
  if ('rastreio' in body) patch.rastreio = body.rastreio;
  if ('habitoId' in body) patch.habito_id = body.habitoId ?? null;
  if ('valorManual' in body) patch.valor_manual = body.valorManual ?? null;
  if ('prazo' in body) patch.prazo = body.prazo ?? null;
  patch.atualizado_em = new Date().toISOString();

  const { error } = await db.from('metas').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await db.from('metas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
