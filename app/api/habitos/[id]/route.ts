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

/**
 * Apagar um hábito limpa as referências que vivem em jsonb (sem FK pra proteger):
 * âncoras de outros hábitos, habito_ids dos objetivos, e metas que o rastreavam —
 * essas viram manuais com o valor congelado, pra não perder o progresso.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agora = new Date().toISOString();

  // Lê os votos antes de apagar — são eles que congelam o valor das metas rastreadas.
  const habitoRes = await db.from('habitos').select('votos').eq('id', id).maybeSingle();
  if (habitoRes.error) return NextResponse.json({ error: habitoRes.error.message }, { status: 500 });
  const votos: Record<string, boolean> = habitoRes.data?.votos ?? {};

  const ancoras = await db.from('habitos')
    .update({ ancora_tipo: 'nenhuma', ancora_habito_id: null, atualizado_em: agora })
    .eq('ancora_habito_id', id);
  if (ancoras.error) return NextResponse.json({ error: ancoras.error.message }, { status: 500 });

  // Poucas linhas por tabela (uso pessoal) — filtrar os jsonb no JS é mais simples e robusto
  // que operadores de containment.
  const objs = await db.from('objetivos').select('id, habito_ids');
  if (objs.error) return NextResponse.json({ error: objs.error.message }, { status: 500 });
  for (const o of objs.data ?? []) {
    const ids = Array.isArray(o.habito_ids) ? o.habito_ids as string[] : [];
    if (!ids.includes(id)) continue;
    const up = await db.from('objetivos')
      .update({ habito_ids: ids.filter(h => h !== id), atualizado_em: agora })
      .eq('id', o.id);
    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });
  }

  const metas = await db.from('metas').select('id, criado_em, prazo').eq('habito_id', id).eq('rastreio', 'habito');
  if (metas.error) return NextResponse.json({ error: metas.error.message }, { status: 500 });
  for (const m of metas.data ?? []) {
    // Mesma regra do valorAtualDeMeta: votos desde a criação da meta, até o prazo se houver.
    const desde = (m.criado_em as string).slice(0, 10);
    const valor = Object.keys(votos).filter(d => votos[d] && d >= desde && (!m.prazo || d <= m.prazo)).length;
    const up = await db.from('metas')
      .update({ rastreio: 'manual', valor_manual: valor, habito_id: null, atualizado_em: agora })
      .eq('id', m.id);
    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });
  }

  const { error } = await db.from('habitos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
