import { NextResponse } from 'next/server';
import { enviarParaTodos, pushConfigurado } from '@/lib/push';

/** Botão "mandar um teste" do app — fica atrás da senha, como as outras rotas. */
export async function POST() {
  if (!pushConfigurado) return NextResponse.json({ error: 'notificações não configuradas no servidor' }, { status: 503 });
  try {
    const r = await enviarParaTodos({ titulo: 'Onda', corpo: 'Notificações funcionando. Até daqui a pouco.', tag: 'teste' });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
