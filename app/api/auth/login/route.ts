import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function POST(request: Request) {
  const senha = process.env.APP_PASSWORD;
  if (!senha) {
    return NextResponse.json({ error: 'APP_PASSWORD não configurada no ambiente' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.senha !== 'string') {
    return NextResponse.json({ error: 'senha ausente' }, { status: 400 });
  }
  if (body.senha !== senha) {
    return NextResponse.json({ error: 'senha incorreta' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('onda-auth', createHash('sha256').update(senha).digest('hex'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180, // meio ano — depois disso pede a senha de novo
  });
  return res;
}
