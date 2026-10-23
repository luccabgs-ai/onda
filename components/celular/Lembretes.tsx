'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { cartao, kicker, botaoCheio, botaoContorno } from './ui';

/**
 * Instalar o app e ligar os lembretes (7h, 12h e 21h). No iPhone, notificação só funciona com o
 * Onda instalado na tela inicial — por isso o cartão primeiro ensina a instalar.
 */
const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function chaveEmBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const bruto = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(bruto.length));
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}

type Estado = 'carregando' | 'desligado' | 'ligado' | 'bloqueado';

export default function Lembretes() {
  // Só roda no navegador (o app de celular nunca é renderizado no servidor), então dá pra ler
  // navigator direto no inicializador.
  const [suporta] = useState(() => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);
  const [instalado] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const [iphone] = useState(() => /iPhone|iPad|iPod/.test(navigator.userAgent));
  const [estado, setEstado] = useState<Estado>('carregando');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (!suporta) return;
    let cancelado = false;
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => {
        if (cancelado) return;
        if (Notification.permission === 'denied') setEstado('bloqueado');
        else setEstado(sub ? 'ligado' : 'desligado');
      })
      .catch(() => { if (!cancelado) setEstado('desligado'); });
    return () => { cancelado = true; };
  }, [suporta]);

  const ligar = async () => {
    if (!CHAVE_PUBLICA) return;
    setOcupado(true);
    setAviso(null);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') { setEstado(permissao === 'denied' ? 'bloqueado' : 'desligado'); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveEmBytes(CHAVE_PUBLICA) });
      const r = await fetch('/api/notificacoes/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sub.toJSON(), aparelho: navigator.userAgent }),
      });
      if (!r.ok) throw new Error();
      setEstado('ligado');
    } catch {
      setAviso('Não consegui ligar agora. Tente de novo em instantes.');
    } finally {
      setOcupado(false);
    }
  };

  const desligar = async () => {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/notificacoes/inscricao', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEstado('desligado');
    } finally {
      setOcupado(false);
    }
  };

  const testar = async () => {
    setAviso(null);
    const r = await fetch('/api/notificacoes/teste', { method: 'POST' }).catch(() => null);
    setAviso(r?.ok ? 'Teste enviado. Deve chegar em alguns segundos.' : 'O teste não saiu. Confira se o servidor tem as chaves configuradas.');
  };

  const texto = (t: string) => <p style={{ fontSize: 13.5, color: 'var(--char-soft)', margin: '4px 0 12px', lineHeight: 1.5 }}>{t}</p>;

  let corpo: ReactNode;
  if (iphone && !instalado) {
    corpo = <>
      {texto('Pra receber os lembretes de manhã, meio-dia e noite, instale o Onda na tela inicial. No iPhone, a notificação só funciona assim.')}
      <ol style={{ fontSize: 13.5, color: 'var(--char)', margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
        <li>Toque em <strong>Compartilhar</strong> (o quadrado com a seta) no Safari</li>
        <li>Escolha <strong>Adicionar à Tela de Início</strong></li>
        <li>Abra o Onda pelo ícone novo e volte aqui</li>
      </ol>
    </>;
  } else if (!suporta) {
    corpo = texto('Este navegador não recebe notificações. Abra o Onda pelo Chrome (Android) ou instale na tela inicial (iPhone).');
  } else if (!CHAVE_PUBLICA) {
    corpo = texto('As notificações ainda não foram configuradas no servidor.');
  } else if (estado === 'bloqueado') {
    corpo = texto('As notificações do Onda estão bloqueadas. Libere em Ajustes › Notificações › Onda e volte aqui.');
  } else if (estado === 'ligado') {
    corpo = <>
      {texto('Ligados: perto das 7h, das 12h e das 21h. Se você já abriu ou fechou o dia, o lembrete daquela hora não vem.')}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={testar} style={botaoContorno}>Mandar um teste</button>
        <button onClick={desligar} disabled={ocupado} style={{ ...botaoContorno, color: 'var(--char-mute)' }}>Desligar</button>
      </div>
    </>;
  } else {
    corpo = <>
      {texto(`Um toque perto das 7h pra abrir o dia, das 12h pra ajustar e das 21h pra fechar.${!instalado ? ' Dica: instale o Onda pelo menu do navegador (Instalar app) pra ele abrir como aplicativo.' : ''}`)}
      <button onClick={ligar} disabled={ocupado || estado === 'carregando'} style={{ ...botaoCheio, opacity: ocupado ? 0.6 : 1 }}>
        {ocupado ? 'Ligando…' : 'Ligar os lembretes'}
      </button>
    </>;
  }

  return (
    <div style={{ ...cartao, marginTop: 22 }}>
      <div style={kicker}>lembretes</div>
      {corpo}
      {aviso && <p style={{ fontSize: 12.5, color: 'var(--char-soft)', margin: '10px 0 0' }}>{aviso}</p>}
    </div>
  );
}
