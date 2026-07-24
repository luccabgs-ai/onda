import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ChecklistItem, Priority, Project, Task, TaskStatus } from '@/lib/types';

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  color: string;
  area_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  checklist: ChecklistItem[];
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    color: row.color,
    areaId: row.area_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description ?? undefined,
    dueDate: row.due_date ?? undefined,
    priority: row.priority,
    checklist: row.checklist,
    status: row.status,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const [projectsRes, tasksRes] = await Promise.all([
    db.from('projects').select('*').order('created_at'),
    db.from('tasks').select('*').order('sort_order'),
  ]);
  if (projectsRes.error) return NextResponse.json({ error: projectsRes.error.message }, { status: 500 });
  if (tasksRes.error) return NextResponse.json({ error: tasksRes.error.message }, { status: 500 });

  return NextResponse.json({
    projects: (projectsRes.data as ProjectRow[]).map(rowToProject),
    tasks: (tasksRes.data as TaskRow[]).map(rowToTask),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Project;
  const { error } = await db.from('projects').upsert({
    id: body.id,
    title: body.title,
    description: body.description ?? null,
    color: body.color,
    area_id: body.areaId ?? null,
    created_at: body.createdAt,
    updated_at: body.updatedAt,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
