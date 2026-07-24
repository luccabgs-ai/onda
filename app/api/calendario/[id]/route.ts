import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if ('title' in body) patch.title = body.title;
  if ('date' in body) patch.date = body.date;
  if ('endDate' in body) patch.end_date = body.endDate ?? null;
  if ('type' in body) patch.type = body.type;
  if ('areaId' in body) patch.area_id = body.areaId ?? null;
  if ('projectId' in body) patch.project_id = body.projectId ?? null;
  if ('description' in body) patch.description = body.description ?? null;
  if ('location' in body) patch.location = body.location ?? null;
  if ('time' in body) patch.time = body.time ?? null;
  if ('color' in body) patch.color = body.color ?? null;
  patch.updated_at = new Date().toISOString();

  const { error } = await db.from('calendar_events').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await db.from('calendar_events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
