'use client';
import React from 'react';

interface WaveIconProps {
  level: number;
  active: boolean;
}

const WaveIcon = ({ level, active }: WaveIconProps) => {
  const color = active ? 'var(--washi)' : 'var(--ink)';
  const size = 22;

  // Each level shows increasingly complex wave paths
  const waves: string[] = [];
  for (let i = 0; i < level; i++) {
    const yBase = 14 - (level - 1) * 3 + i * 5;
    waves.push(`M2 ${yBase} C5 ${yBase - 2}, 8 ${yBase + 2}, 11 ${yBase} S17 ${yBase - 2}, 20 ${yBase}`);
  }

  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      {waves.map((d, idx) => (
        <path
          key={idx}
          d={d}
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
          opacity={1 - idx * 0.05}
        />
      ))}
    </svg>
  );
};

interface EnergyScaleProps {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}

export const EnergyScale = ({ value, onChange, readOnly = false }: EnergyScaleProps) => {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((level) => {
        const isActive = level <= value;
        return (
          <button
            key={level}
            onClick={() => !readOnly && onChange?.(level)}
            disabled={readOnly}
            title={`Energia ${level}`}
            style={{
              width: 34,
              height: 30,
              borderRadius: 5,
              border: isActive ? 'none' : '1.5px solid rgba(27,54,93,0.3)',
              background: isActive ? 'var(--ink)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: readOnly ? 'default' : 'pointer',
              transition: 'all 0.15s ease',
              padding: 0,
            }}
          >
            <WaveIcon level={level} active={isActive} />
          </button>
        );
      })}
    </div>
  );
};
