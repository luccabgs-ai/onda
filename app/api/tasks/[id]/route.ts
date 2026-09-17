import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if ('title' in body) patch.title = body.title;
  if ('description' in body) patch.description = body.description ?? null;
  if ('dueDate' in body) patch.due_date = body.dueDate ?? null;
  if ('priority' in body) patch.priority = body.priority;
  if ('checklist' in body) patch.checklist = body.checklist;
  if ('valorAlvo' in body) patch.valor_alvo = body.valorAlvo ?? null;
  if ('valorAtual' in body) patch.valor_atual = body.valorAtual ?? 0;
  if ('unidade' in body) patch.unidade = body.unidade ?? null;
  if ('status' in body) patch.status = body.status;
  if ('order' in body) patch.sort_order = body.order;
  patch.updated_at = new Date().toISOString();

  const { error } = await db.from('tasks').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await db.from('tasks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
