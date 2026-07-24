import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if ('identidade' in body) patch.identidade = body.identidade;
  if ('areaId' in body) patch.area_id = body.areaId;
  if ('acao' in body) patch.acao = body.acao;
  if ('metaAtual' in body) patch.meta_atual = body.metaAtual;
  if ('metaOriginal' in body) patch.meta_original = body.metaOriginal;
  if ('ancoraTipo' in body) patch.ancora_tipo = body.ancoraTipo;
  if ('ancoraHabitoId' in body) patch.ancora_habito_id = body.ancoraHabitoId ?? null;
  if ('ancoraTexto' in body) patch.ancora_texto = body.ancoraTexto ?? null;
  if ('diasSemana' in body) patch.dias_semana = body.diasSemana;
  if ('horario' in body) patch.horario = body.horario ?? null;
  if ('local' in body) patch.local = body.local ?? null;
  if ('votos' in body) patch.votos = body.votos;
  if ('encolhimentoDismissadoEm' in body) patch.encolhimento_dismissado_em = body.encolhimentoDismissadoEm ?? null;
  patch.atualizado_em = new Date().toISOString();

  const { error } = await db.from('habitos').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await db.from('habitos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
