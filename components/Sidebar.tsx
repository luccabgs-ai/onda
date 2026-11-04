'use client';
import React from 'react';
import { Hanko } from './ui/Hanko';
import { IcSun, IcMoon, IcCompass, IcKanban, IcCalendar2, IcHabito, IcTimer, IcTarget, IcFlag } from './ui/icons';

interface NavItem {
  id: string;
  label: string;
  jp: string;
  icon: React.ComponentType<{ size?: number; stroke?: string; sw?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'hoje', label: 'Hoje', jp: '今日', icon: IcSun },
  { id: 'areas', label: 'Áreas', jp: '領域', icon: IcCompass },
  { id: 'objetivos', label: 'Objetivos', jp: '目標', icon: IcTarget },
  { id: 'organizacao', label: 'Organização', jp: '節目', icon: IcFlag },
  { id: 'projetos', label: 'Projetos', jp: '企画', icon: IcKanban },
  { id: 'calendario', label: 'Calendário', jp: '暦', icon: IcCalendar2 },
  { id: 'habitos', label: 'Hábitos', jp: '習慣', icon: IcHabito },
  { id: 'cronometros', label: 'Cronômetros', jp: '集中', icon: IcTimer },
];

interface SidebarProps {
  active: string;
  onChange: (id: string) => void;
  didCheckIn: boolean;
  isNight: boolean;
  onToggleNight: () => void;
}

const WaveSVG = () => (
  <svg
    viewBox="0 0 240 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      opacity: 0.06,
      pointerEvents: 'none',
    }}
  >
    <path
      d="M-20 80 C20 60, 60 100, 100 75 C140 50, 180 90, 220 70 C240 62, 250 68, 260 65"
      stroke="var(--ink)"
      strokeWidth="2.5"
      fill="none"
    />
    <path
      d="M-20 95 C20 75, 60 115, 100 90 C140 65, 180 105, 220 85 C240 77, 250 83, 260 80"
      stroke="var(--ink)"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M-20 110 C20 90, 60 130, 100 105 C140 80, 180 120, 220 100 C240 92, 250 98, 260 95"
      stroke="var(--ink)"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

export default function Sidebar({ active, onChange, didCheckIn, isNight, onToggleNight }: SidebarProps) {
  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--card-border)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Hanko size={36} label="波" />
        <div>
          <div className="serif" style={{ fontSize: 18, color: 'var(--ink)', lineHeight: 1.1 }}>
            Onda
          </div>
          <div style={{
            fontSize: 9,
            letterSpacing: '0.12em',
            color: 'var(--char-mute)',
            textTransform: 'uppercase',
            marginTop: 1,
          }}>
            Organização da Vida
          </div>
        </div>
      </div>

      {/* Brush divider */}
      <div className="brush-divider" style={{ margin: '0 20px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px 0' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                marginBottom: 2,
                background: isActive ? 'rgba(27,54,93,0.08)' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--char-soft)',
                fontWeight: isActive ? 500 : 400,
                fontSize: 13.5,
                position: 'relative',
                transition: 'background 0.15s, color 0.15s',
                textAlign: 'left',
              }}
            >
              {isActive && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: 6,
                  bottom: 6,
                  width: 2.5,
                  background: 'var(--ink)',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
              <Icon
                size={16}
                stroke={isActive ? 'var(--ink)' : 'var(--char-mute)'}
                sw={isActive ? 2 : 1.5}
              />
              <span style={{ flex: 1 }}>{item.label}</span>
              <span
                className="jp"
                style={{
                  fontSize: 11,
                  color: 'var(--char-mute)',
                  opacity: 0.7,
                }}
              >
                {item.jp}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer: user profile */}
      <div
        style={{
          padding: '16px 20px 28px',
          borderTop: '1px solid rgba(27,54,93,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--ink-soft) 0%, var(--ink) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          L
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--char)' }}>Lucca</div>
          <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>
            {didCheckIn ? '✓ check-in feito' : 'sem check-in hoje'}
          </div>
        </div>

        <button
          onClick={onToggleNight}
          title={isNight ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '1px solid var(--card-border)',
            background: 'var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {isNight
            ? <IcSun size={14} stroke="var(--char-soft)" />
            : <IcMoon size={14} stroke="var(--char-soft)" />}
        </button>
      </div>

      <WaveSVG />
    </aside>
  );
}
