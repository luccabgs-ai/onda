import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'onda-auth';

// O cookie guarda o SHA-256 da senha (não a senha em si). Trocar a APP_PASSWORD
// invalida automaticamente todas as sessões abertas.
let hashCache: { senha: string; hash: string } | null = null;

async function sha256Hex(texto: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashDaSenha(senha: string): Promise<string> {
  if (hashCache?.senha !== senha) hashCache = { senha, hash: await sha256Hex(senha) };
  return hashCache.hash;
}

export default async function proxy(request: NextRequest) {
  const senha = process.env.APP_PASSWORD;

  // Sem senha configurada, bloqueia tudo (fail closed) em vez de servir o app aberto.
  if (!senha) {
    return new NextResponse('APP_PASSWORD não configurada no ambiente', { status: 500 });
  }

  const cookie = request.cookies.get(COOKIE)?.value;
  if (cookie === await hashDaSenha(senha)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'não autenticado' }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/entrar';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  // Tudo passa pela checagem, exceto a tela de senha, o endpoint de login, os assets do Next,
  // os arquivos do app instalável (o navegador os busca sem cookie) e o disparo agendado de
  // notificações, que se autentica com CRON_SECRET na própria rota.
  matcher: ['/((?!entrar|api/auth/login|api/notificacoes/enviar|_next/static|_next/image|favicon\\.ico|icon\\.svg|apple-icon\\.png|icone-192\\.png|icone-512\\.png|manifest\\.webmanifest|sw\\.js).*)'],
};
