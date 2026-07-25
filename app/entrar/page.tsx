'use client';
import { useState } from 'react';
import { Hanko } from '@/components/ui/Hanko';

export default function EntrarPage() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    if (!senha.trim() || enviando) return;
    setEnviando(true);
    setErro(false);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      });
      if (r.ok) {
        window.location.href = '/';
        return;
      }
      setErro(true);
    } catch {
      setErro(true);
    }
    setEnviando(false);
  };

  return (
    <div className="washi-bg" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <Hanko size={48} label="波" />
      <h1 className="serif" style={{ fontSize: 32, color: 'var(--ink)', margin: '18px 0 4px', fontWeight: 500 }}>
        Onda
      </h1>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--char-mute)',
        marginBottom: 32,
      }}>
        Organização da Vida
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
        <input
          type="password"
          autoFocus
          value={senha}
          placeholder="senha"
          onChange={e => { setSenha(e.target.value); setErro(false); }}
          onKeyDown={e => { if (e.key === 'Enter') entrar(); }}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 6,
            border: `1px solid ${erro ? 'var(--hanko)' : 'rgba(27,54,93,0.2)'}`,
            background: 'rgba(255,255,255,0.7)',
            fontSize: 14,
            color: 'var(--char)',
            fontFamily: 'inherit',
            textAlign: 'center',
          }}
        />
        <button
          onClick={entrar}
          disabled={!senha.trim() || enviando}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 6,
            background: senha.trim() && !enviando ? 'var(--ink)' : 'rgba(27,54,93,0.25)',
            color: 'var(--washi)',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: senha.trim() && !enviando ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          {enviando ? 'entrando…' : 'Entrar'}
        </button>
        {erro && (
          <div style={{ fontSize: 12, color: 'var(--hanko)', textAlign: 'center' }}>
            senha incorreta
          </div>
        )}
      </div>
    </div>
  );
}
