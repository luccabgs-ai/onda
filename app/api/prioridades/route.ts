import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PrioridadeManual } from '@/lib/types';

interface Row {
  id: string;
  text: string;
  area_id: string | null;
  done: boolean;
  data: string;
  created_at: string;
}

function rowToPrioridade(row: Row): PrioridadeManual {
  return {
    id: row.id,
    text: row.text,
    areaId: row.area_id ?? undefined,
    done: row.done,
    data: row.data,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const { data, error } = await db.from('prioridades_manuais').select('*').order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as Row[]).map(rowToPrioridade));
}

export async function POST(request: NextRequest) {
  const body = await request.json() as PrioridadeManual;
  const { error } = await db.from('prioridades_manuais').upsert({
    id: body.id,
    text: body.text,
    area_id: body.areaId ?? null,
    done: body.done,
    data: body.data,
    created_at: body.createdAt,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
