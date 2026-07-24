import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Task } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json() as Task;
  const { error } = await db.from('tasks').upsert({
    id: body.id,
    project_id: body.projectId,
    title: body.title,
    description: body.description ?? null,
    due_date: body.dueDate ?? null,
    priority: body.priority,
    checklist: body.checklist,
    status: body.status,
    sort_order: body.order,
    created_at: body.createdAt,
    updated_at: body.updatedAt,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
