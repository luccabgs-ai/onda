import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** Guarda (ou renova) a inscrição de um aparelho pra receber notificações. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (typeof endpoint !== 'string' || typeof p256dh !== 'string' || typeof auth !== 'string') {
    return NextResponse.json({ error: 'inscrição inválida' }, { status: 400 });
  }
  const { error } = await db.from('push_inscricoes').upsert({
    endpoint, p256dh, auth,
    aparelho: typeof body.aparelho === 'string' ? body.aparelho.slice(0, 200) : null,
    criado_em: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Desliga as notificações de um aparelho. */
export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body?.endpoint !== 'string') return NextResponse.json({ error: 'endpoint ausente' }, { status: 400 });
  const { error } = await db.from('push_inscricoes').delete().eq('endpoint', body.endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
