import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if ('nota' in body) patch.nota = body.nota ?? null;
  if ('minutos' in body) patch.minutos = body.minutos;
  if ('taskId' in body) patch.task_id = body.taskId ?? null;
  if ('rotulo' in body) patch.rotulo = body.rotulo ?? null;
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });

  const { error } = await db.from('sessoes_foco').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await db.from('sessoes_foco').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
