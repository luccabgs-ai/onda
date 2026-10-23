import React from 'react';
import { tinta } from '@/components/organizacao/estilo';

/** Peças visuais do app de celular — toque grande, texto legível, nada que dependa de hover. */

export const cartao: React.CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--card-border)',
  borderRadius: 12,
  padding: '14px 15px',
};

export const kicker: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--char-mute)',
};

export const botaoCheio: React.CSSProperties = {
  width: '100%',
  minHeight: 46,
  padding: '12px 16px',
  background: 'var(--ink)',
  color: 'var(--washi)',
  borderRadius: 10,
  fontSize: 14.5,
  fontWeight: 500,
};

export const botaoContorno: React.CSSProperties = {
  minHeight: 38,
  padding: '8px 14px',
  border: `1px solid ${tinta(22)}`,
  borderRadius: 10,
  fontSize: 13,
  color: 'var(--ink)',
};

export function Cabecalho({ sobre, titulo, direita }: { sobre: string; titulo: string; direita?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, margin: '4px 0 18px' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--char-mute)', letterSpacing: '0.02em' }}>{sobre}</div>
        <h1 className="serif" style={{ fontSize: 32, color: 'var(--ink)', margin: 0, fontWeight: 500, lineHeight: 1.05 }}>{titulo}</h1>
      </div>
      {direita}
    </div>
  );
}

export function Secao({ titulo, extra, children, primeira = false }: {
  titulo: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  primeira?: boolean;
}) {
  return (
    <section style={{ marginTop: primeira ? 0 : 22 }}>
      <div style={{ ...kicker, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 9 }}>
        <span>{titulo}</span>
        {extra && <span style={{ letterSpacing: '0.04em', textTransform: 'none', fontWeight: 500 }}>{extra}</span>}
      </div>
      {children}
    </section>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>{children}</p>;
}

/** Nota no rodapé de uma aba — o que ainda mora só no computador. */
export function NotaPc({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11.5, color: 'var(--char-mute)', margin: '22px 2px 0', lineHeight: 1.5 }}>{children}</p>;
}
