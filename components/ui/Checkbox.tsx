import React from 'react';
import { IcCheck } from './icons';

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  size?: number;
}

export const Checkbox = ({ checked, onChange, size = 18 }: CheckboxProps) => (
  <button
    onClick={() => onChange?.(!checked)}
    style={{
      width: size,
      height: size,
      borderRadius: 3,
      border: checked ? 'none' : '1.5px solid var(--ink-fade)',
      background: checked ? 'var(--ink)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.15s ease',
      cursor: 'pointer',
    }}
    aria-checked={checked}
    role="checkbox"
  >
    {checked && <IcCheck size={size * 0.65} stroke="white" sw={2.5} />}
  </button>
);
