import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Meta } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json() as Meta;
  const { error } = await db.from('metas').upsert({
    id: body.id,
    objetivo_id: body.objetivoId,
    titulo: body.titulo,
    unidade: body.unidade ?? null,
    valor_alvo: body.valorAlvo,
    rastreio: body.rastreio,
    habito_id: body.habitoId ?? null,
    valor_manual: body.valorManual ?? null,
    prazo: body.prazo ?? null,
    criado_em: body.criadoEm,
    atualizado_em: body.atualizadoEm,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
