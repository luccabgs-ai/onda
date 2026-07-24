import React from 'react';
import { AREAS } from '@/lib/data';

interface AreaBadgeProps {
  areaId: string;
  small?: boolean;
}

export const AreaBadge = ({ areaId, small = false }: AreaBadgeProps) => {
  const area = AREAS.find(a => a.id === areaId);
  if (!area) return null;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 20,
      fontSize: small ? 10 : 11,
      fontWeight: 500,
      letterSpacing: '0.03em',
      background: `${area.color}18`,
      color: area.color,
      border: `1px solid ${area.color}30`,
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
    }}>
      <span style={{
        width: small ? 5 : 6,
        height: small ? 5 : 6,
        borderRadius: '50%',
        background: area.color,
        flexShrink: 0,
        display: 'inline-block',
      }} />
      {area.name}
    </span>
  );
};
