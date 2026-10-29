import React from 'react';
import { createPortal } from 'react-dom';
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

/**
 * Desenha uma janela (ritual, tarefa) direto no <body>, fora da área que rola do app. No
 * Safari do iPhone, uma janela fixa desenhada dentro de um container com rolagem pode ser
 * recortada nas bordas dele — o rodapé com o botão sumia atrás da barra de abas.
 */
export function ForaDoApp({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}

/**
 * Folha que sobe do rodapé (escolher vitória, criar bloco…). Vai pro <body> via ForaDoApp.
 * Campos de texto ficam no topo da folha: o teclado do iPhone cobre a parte de baixo.
 */
export function Folha({ titulo, sobre, onFechar, children }: {
  titulo: string;
  sobre?: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <ForaDoApp>
      <div
        onClick={onFechar}
        style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(20,38,74,0.45)', display: 'flex', alignItems: 'flex-end' }}
      >
        <div
          role="dialog"
          aria-label={titulo}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxHeight: '86dvh', overflowY: 'auto', background: 'var(--washi)', borderRadius: '18px 18px 0 0',
            padding: '10px max(18px, env(safe-area-inset-left)) calc(env(safe-area-inset-bottom) + 22px)',
          }}
        >
          <div style={{ width: 38, height: 4, borderRadius: 2, background: tinta(20), margin: '0 auto 12px' }} />
          {sobre && <div style={kicker}>{sobre}</div>}
          <h3 className="serif" style={{ fontSize: 22, color: 'var(--ink)', margin: '2px 0 10px', fontWeight: 500 }}>{titulo}</h3>
          {children}
        </div>
      </div>
    </ForaDoApp>
  );
}

/** Linha tocável dentro de uma folha (tarefa, bloco, hábito…). */
export function OpcaoFolha({ cor, texto, detalhe, ativo = false, onClick }: {
  cor?: string;
  texto: string;
  detalhe?: string;
  ativo?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 46, padding: '10px 12px', borderRadius: 10, textAlign: 'left',
      border: '1px solid var(--card-border)', background: 'var(--card-bg)', fontSize: 14, color: 'var(--char)',
      boxShadow: ativo ? 'inset 0 0 0 1.5px var(--ink)' : 'none',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: cor ?? 'var(--char-mute)', flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>{texto}</span>
      {detalhe && <span style={{ fontSize: 11, color: 'var(--char-mute)', whiteSpace: 'nowrap', flexShrink: 0 }}>{detalhe}</span>}
    </button>
  );
}

export function Energia({ valor, onEscolher }: { valor: number | null; onEscolher: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onEscolher(n)} style={{
          flex: 1, height: 44, borderRadius: 10, fontSize: 15, fontWeight: 600,
          border: `1.5px solid ${valor === n ? 'var(--ink)' : tinta(18)}`,
          background: valor === n ? 'var(--ink)' : 'transparent', color: valor === n ? 'var(--washi)' : 'var(--char-soft)',
        }}>{n}</button>
      ))}
    </div>
  );
}
