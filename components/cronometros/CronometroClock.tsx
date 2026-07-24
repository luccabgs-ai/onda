import React from 'react';

interface CronometroClockProps {
  size?: number;
  progresso: number;   // 0..1 — fração da fase atual já decorrida
  tempoLabel: string;  // 'MM:SS'
  faseLabel: string;   // 'Foco' / 'Descanso' / 'Concluído'
  faseJp?: string;
  color?: string;
  paused?: boolean;
}

export const CronometroClock = ({
  size = 320,
  progresso,
  tempoLabel,
  faseLabel,
  faseJp,
  color = 'var(--ink)',
  paused = false,
}: CronometroClockProps) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const restante = Math.max(0, 1 - progresso);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="cronoCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--washi)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--washi-warm)" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {/* Trilha de fundo */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(27,54,93,0.09)" strokeWidth={size * 0.035} />

      {/* Anel de progresso — depleta conforme o tempo passa */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.035}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - restante)}
        transform={`rotate(-90 ${cx} ${cy})`}
        opacity={paused ? 0.45 : 1}
        style={{ transition: 'stroke-dashoffset 0.25s linear, opacity 0.2s' }}
      />

      {/* Centro */}
      <circle cx={cx} cy={cy} r={r - size * 0.06} fill="url(#cronoCenter)" stroke="rgba(27,54,93,0.12)" strokeWidth={1} />

      <text
        x={cx}
        y={cy - size * 0.03}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.135}
        fontFamily="Cormorant Garamond, serif"
        fontWeight={500}
        fill="var(--ink)"
      >
        {tempoLabel}
      </text>

      {faseJp && (
        <text
          x={cx}
          y={cy + size * 0.11}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.045}
          fontFamily="Noto Serif JP, serif"
          fill="var(--char-mute)"
          opacity={0.6}
        >
          {faseJp}
        </text>
      )}

      <text
        x={cx}
        y={cy + size * 0.185}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.036}
        fontFamily="Inter, sans-serif"
        fontWeight={600}
        letterSpacing={size * 0.003}
        fill={color}
      >
        {(paused ? 'pausado' : faseLabel).toUpperCase()}
      </text>
    </svg>
  );
};
