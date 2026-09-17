'use client';
import React from 'react';

const TRILHO = 'rgba(27,54,93,0.10)';

// Sem separador de milhar: "1.240" seria lido de volta como 1,24 ao editar o número.
export const formatarValor = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false });

/** Aceita vírgula ou ponto como separador decimal. Devolve NaN se não for número. */
export const lerValor = (texto: string) => parseFloat(texto.trim().replace(',', '.'));

/**
 * Linha de progresso de uma tarefa mensurável. Até 20 unidades inteiras vira segmentos —
 * um tracinho por artigo, capítulo... —; acima disso, ou com meta decimal, barra contínua.
 */
export function LinhaProgresso({ atual, alvo, cor, altura = 5 }: {
  atual: number;
  alvo: number;
  cor: string;
  altura?: number;
}) {
  const corPreenchida = atual >= alvo ? 'var(--moss)' : cor;

  if (Number.isInteger(alvo) && alvo <= 20) {
    return (
      <div style={{ display: 'flex', gap: altura > 5 ? 5 : 3 }}>
        {Array.from({ length: alvo }, (_, i) => (
          <span
            key={i}
            style={{
              flex: 1, height: altura, borderRadius: 2,
              background: i < Math.floor(atual) ? corPreenchida : TRILHO,
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ height: altura, borderRadius: 3, background: TRILHO, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 3, background: corPreenchida,
        width: `${Math.min(100, (atual / alvo) * 100)}%`,
        transition: 'width 0.25s ease',
      }} />
    </div>
  );
}

export function BotoesContador({ atual, alvo, onDefinir, grande = false }: {
  atual: number;
  alvo: number;
  onDefinir: (valor: number) => void;
  grande?: boolean;
}) {
  const estilo = (desabilitado: boolean): React.CSSProperties => ({
    width: grande ? 36 : 24,
    height: grande ? 32 : 22,
    borderRadius: 4,
    border: '1px solid rgba(27,54,93,0.18)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: grande ? 18 : 14, lineHeight: 1,
    color: 'var(--char-soft)',
    opacity: desabilitado ? 0.35 : 1,
    cursor: desabilitado ? 'default' : 'pointer',
  });

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        onClick={() => onDefinir(Math.max(0, Math.ceil(atual) - 1))}
        disabled={atual <= 0}
        aria-label="Diminuir"
        style={estilo(atual <= 0)}
      >
        −
      </button>
      <button
        onClick={() => onDefinir(Math.floor(atual) + 1)}
        disabled={atual >= alvo}
        aria-label="Aumentar"
        style={estilo(atual >= alvo)}
      >
        +
      </button>
    </div>
  );
}
