import React from 'react';
import { AREAS } from '@/lib/data';

interface BussolaProps {
  size?: number;
  nutridoMap?: Record<string, number>;
}

export const Bussola = ({ size = 340, nutridoMap }: BussolaProps) => {
  const cx = size / 2;
  const cy = size / 2;
  const Rmax = size * 0.36;
  const Rmin = size * 0.08;

  const nutridoDe = (areaId: string, fallback: number) => nutridoMap?.[areaId] ?? fallback;

  const polar = (angle: number, r: number): [number, number] => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
  };

  const rings = [0.25, 0.5, 0.75, 1.0];

  // Build the polygon for nutrido values
  const polygonPoints = AREAS.map((area) => {
    const r = Rmin + (Rmax - Rmin) * nutridoDe(area.id, area.nutrido);
    const [x, y] = polar(area.angle, r);
    return `${x},${y}`;
  }).join(' ');

  // Label radius
  const Rlabel = Rmax + 24;
  const RlabelFar = Rmax + 38;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="bussolaFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--ink-soft)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--ink)" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--washi)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--washi-warm)" stopOpacity="0.7" />
        </radialGradient>
      </defs>

      {/* Concentric rings */}
      {rings.map((r, i) => {
        const radius = Rmin + (Rmax - Rmin) * r;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(27,54,93,0.1)"
            strokeWidth={i === rings.length - 1 ? 1 : 0.8}
            strokeDasharray={i === rings.length - 1 ? 'none' : '3,4'}
          />
        );
      })}

      {/* Spokes */}
      {AREAS.map((area) => {
        const [x, y] = polar(area.angle, Rmax);
        return (
          <line
            key={area.id}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(27,54,93,0.1)"
            strokeWidth={0.8}
          />
        );
      })}

      {/* Filled polygon */}
      <polygon
        points={polygonPoints}
        fill="url(#bussolaFill)"
        stroke="var(--ink)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        opacity={0.88}
      />

      {/* Node pegs */}
      {AREAS.map((area) => {
        const r = Rmin + (Rmax - Rmin) * nutridoDe(area.id, area.nutrido);
        const [x, y] = polar(area.angle, r);
        return (
          <g key={area.id}>
            <circle cx={x} cy={y} r={7} fill="white" stroke="rgba(27,54,93,0.15)" strokeWidth={1} />
            <circle cx={x} cy={y} r={4} fill={area.color} />
          </g>
        );
      })}

      {/* Labels */}
      {AREAS.map((area) => {
        const [lx, ly] = polar(area.angle, Rlabel);
        const [fx, fy] = polar(area.angle, RlabelFar);
        const anchor = lx < cx - 10 ? 'end' : lx > cx + 10 ? 'start' : 'middle';

        return (
          <g key={`label-${area.id}`}>
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              fontSize={9}
              fontFamily="Noto Serif JP, serif"
              fill="var(--char-mute)"
              dominantBaseline="middle"
            >
              {area.kanji}
            </text>
            <text
              x={fx}
              y={fy}
              textAnchor={anchor}
              fontSize={8.5}
              fontFamily="Inter, sans-serif"
              fill="var(--char-soft)"
              dominantBaseline="middle"
            >
              {area.name}
            </text>
          </g>
        );
      })}

      {/* Center circle */}
      <circle cx={cx} cy={cy} r={Rmin - 2} fill="url(#centerGlow)" stroke="rgba(27,54,93,0.15)" strokeWidth={1} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontFamily="Noto Serif JP, serif"
        fill="var(--ink)"
        fontWeight={500}
      >
        心
      </text>
    </svg>
  );
};
