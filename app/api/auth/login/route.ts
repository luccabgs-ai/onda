import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';

// Freio contra quem tenta adivinhar a senha: toda senha errada espera um pouco antes de
// responder, e muitas erradas seguidas do mesmo IP travam o login por um tempo. Fica em
// memória da instância — não é à prova de tudo, mas torna o chute em massa lento demais.
const ESPERA_SENHA_ERRADA_MS = 1000;
const MAX_FALHAS = 5;
const JANELA_MS = 15 * 60 * 1000;
const falhasPorIp = new Map<string, { falhas: number; desde: number }>();

function ipDe(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'desconhecido';
}

function bloqueado(ip: string, agora: number): boolean {
  const registro = falhasPorIp.get(ip);
  if (!registro) return false;
  if (agora - registro.desde > JANELA_MS) {
    falhasPorIp.delete(ip);
    return false;
  }
  return registro.falhas >= MAX_FALHAS;
}

function contarFalha(ip: string, agora: number) {
  const registro = falhasPorIp.get(ip);
  if (!registro || agora - registro.desde > JANELA_MS) falhasPorIp.set(ip, { falhas: 1, desde: agora });
  else registro.falhas++;
}

const sha256 = (texto: string) => createHash('sha256').update(texto).digest();

export async function POST(request: Request) {
  const senha = process.env.APP_PASSWORD;
  if (!senha) {
    return NextResponse.json({ error: 'APP_PASSWORD não configurada no ambiente' }, { status: 500 });
  }

  const ip = ipDe(request);
  if (bloqueado(ip, Date.now())) {
    return NextResponse.json({ error: 'muitas tentativas — espere alguns minutos' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.senha !== 'string') {
    return NextResponse.json({ error: 'senha ausente' }, { status: 400 });
  }
  // Compara os hashes (mesmo tamanho) em tempo constante, pra a resposta não vazar quanto da senha bateu.
  if (!timingSafeEqual(sha256(body.senha), sha256(senha))) {
    contarFalha(ip, Date.now());
    await new Promise(r => setTimeout(r, ESPERA_SENHA_ERRADA_MS));
    return NextResponse.json({ error: 'senha incorreta' }, { status: 401 });
  }

  falhasPorIp.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('onda-auth', sha256(senha).toString('hex'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180, // meio ano — depois disso pede a senha de novo
  });
  return res;
}
