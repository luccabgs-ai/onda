import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if ('title' in body) patch.title = body.title;
  if ('description' in body) patch.description = body.description ?? null;
  if ('color' in body) patch.color = body.color;
  if ('areaId' in body) patch.area_id = body.areaId ?? null;
  patch.updated_at = new Date().toISOString();

  const { error } = await db.from('projects').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Apagar o projeto também apaga as tasks dele (ON DELETE CASCADE no banco). */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await db.from('projects').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
