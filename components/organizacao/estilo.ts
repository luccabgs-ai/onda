import React from 'react';

/** Tinta com transparência que acompanha o tema (a `--ink` muda de cor à noite). */
export const tinta = (pct: number) => `color-mix(in srgb, var(--ink) ${pct}%, transparent)`;

export const campoStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--card-bg)',
  border: `1px solid ${tinta(16)}`,
  borderRadius: 4,
  fontSize: 13.5,
  color: 'var(--char)',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  resize: 'vertical',
  lineHeight: 1.55,
};

export const kickerStyle: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--char-mute)',
};

export const tituloCardStyle: React.CSSProperties = {
  fontSize: 19,
  color: 'var(--ink)',
  fontWeight: 500,
  margin: '2px 0 0',
};

export const botaoPrimario: React.CSSProperties = {
  padding: '8px 16px',
  background: 'var(--ink)',
  color: 'var(--washi)',
  borderRadius: 4,
  fontSize: 12.5,
  fontWeight: 500,
};

export const botaoSecundario: React.CSSProperties = {
  padding: '7px 14px',
  border: `1px solid ${tinta(22)}`,
  borderRadius: 4,
  fontSize: 12.5,
  color: 'var(--ink)',
};

export const botaoLink: React.CSSProperties = {
  fontSize: 12.5,
  color: 'var(--ink)',
  padding: '6px 0',
  fontWeight: 500,
};
