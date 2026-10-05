import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Grava só os campos recebidos. Um ciclo só nasce quando algo é escrito nele, então o PATCH
 * também cria: se não existir linha com esse id, insere com a identidade (`escala`, `inicio`,
 * `fim`, que o cliente manda sempre) mais os campos recebidos. Assim não há corrida entre um
 * POST de criação e o PATCH seguinte chegando fora de ordem — toda gravação é do mesmo tipo.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const agora = new Date().toISOString();

  const patch: Record<string, unknown> = {};
  if ('foco' in body) patch.foco = body.foco ?? null;
  if ('itens' in body) patch.itens = body.itens ?? [];
  if ('meioNota' in body) patch.meio_nota = body.meioNota ?? null;
  if ('meioEm' in body) patch.meio_em = body.meioEm ?? null;
  if ('nota' in body) patch.nota = body.nota ?? null;
  if ('funcionou' in body) patch.funcionou = body.funcionou ?? null;
  if ('naoFuncionou' in body) patch.nao_funcionou = body.naoFuncionou ?? null;
  if ('levar' in body) patch.levar = body.levar ?? null;
  if ('fechadoEm' in body) patch.fechado_em = body.fechadoEm ?? null;
  patch.atualizado_em = agora;

  const atualizado = await db.from('ciclos').update(patch).eq('id', id).select('id');
  if (atualizado.error) return NextResponse.json({ error: atualizado.error.message }, { status: 500 });
  if (atualizado.data.length > 0) return NextResponse.json({ ok: true });

  if (!body.escala || !body.inicio || !body.fim) {
    return NextResponse.json({ error: 'ciclo novo precisa de escala, inicio e fim' }, { status: 400 });
  }
  const inserido = await db.from('ciclos').insert({
    itens: [],
    ...patch,
    id,
    escala: body.escala,
    inicio: body.inicio,
    fim: body.fim,
    criado_em: agora,
  });
  if (!inserido.error) return NextResponse.json({ ok: true }, { status: 201 });

  // Outra gravação criou a linha entre o update e o insert: agora é só atualizar.
  if (inserido.error.code === '23505') {
    const { error } = await db.from('ciclos').update(patch).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: inserido.error.message }, { status: 500 });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await db.from('ciclos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
