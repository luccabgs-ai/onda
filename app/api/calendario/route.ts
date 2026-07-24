import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CalendarEvent, EventType } from '@/lib/types';

interface Row {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  type: EventType;
  area_id: string | null;
  project_id: string | null;
  description: string | null;
  location: string | null;
  time: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEvent(row: Row): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    endDate: row.end_date ?? undefined,
    type: row.type,
    areaId: row.area_id ?? undefined,
    projectId: row.project_id ?? undefined,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    time: row.time ?? undefined,
    color: row.color ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const { data, error } = await db.from('calendar_events').select('*').order('date');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as Row[]).map(rowToEvent));
}

export async function POST(request: NextRequest) {
  const body = await request.json() as CalendarEvent;
  const { error } = await db.from('calendar_events').upsert({
    id: body.id,
    title: body.title,
    date: body.date,
    end_date: body.endDate ?? null,
    type: body.type,
    area_id: body.areaId ?? null,
    project_id: body.projectId ?? null,
    description: body.description ?? null,
    location: body.location ?? null,
    time: body.time ?? null,
    color: body.color ?? null,
    created_at: body.createdAt,
    updated_at: body.updatedAt,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
