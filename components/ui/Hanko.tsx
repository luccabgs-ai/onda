import React from 'react';

export const Hanko = ({ size = 36, label = '波' }: { size?: number; label?: string }) => (
  <div style={{
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    fontSize: size * 0.42,
    fontWeight: 600,
    background: 'var(--hanko)',
    color: 'var(--washi)',
    fontFamily: 'Noto Serif JP, serif',
    transform: 'rotate(-2deg)',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15), 0 0 0 1px rgba(197,72,58,0.15)',
    letterSpacing: '0.04em',
    flexShrink: 0,
  }}>
    {label}
  </div>
);
