import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RitualRegistro } from '@/lib/types';

interface RitualRow {
  id: string;
  data: string;
  tipo: 'manha' | 'noite';
  energia: number;
  intencao: string | null;
  vitorias: string[] | null;
  funcionou: string | null;
  carrega: string | null;
  criado_em: string;
  atualizado_em: string;
}

function rowToRegistro(row: RitualRow): RitualRegistro {
  return {
    id: row.id,
    data: row.data,
    tipo: row.tipo,
    energia: row.energia,
    intencao: row.intencao ?? undefined,
    vitorias: row.vitorias ?? undefined,
    funcionou: row.funcionou ?? undefined,
    carrega: row.carrega ?? undefined,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export async function GET() {
  const { data, error } = await db.from('rituais').select('*').order('data', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as RitualRow[]).map(rowToRegistro));
}

export async function POST(request: NextRequest) {
  const body = await request.json() as RitualRegistro;
  const { error } = await db.from('rituais').upsert({
    id: body.id,
    data: body.data,
    tipo: body.tipo,
    energia: body.energia,
    intencao: body.intencao ?? null,
    vitorias: body.vitorias ?? null,
    funcionou: body.funcionou ?? null,
    carrega: body.carrega ?? null,
    criado_em: body.criadoEm,
    atualizado_em: body.atualizadoEm,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
