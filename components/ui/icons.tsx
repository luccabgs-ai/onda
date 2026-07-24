import React from 'react';

interface IconProps {
  size?: number;
  stroke?: string;
  sw?: number;
}

export const IcSun = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3.5" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
    <line x1="19.78" y1="4.22" x2="17.66" y2="6.34" />
    <line x1="6.34" y1="17.66" x2="4.22" y2="19.78" />
  </svg>
);

export const IcMoon = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </svg>
);

export const IcCompass = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </svg>
);

export const IcLeaf = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20s1-9 8-13c4-2 8-1 8-1s1 4-1 8c-4 7-13 8-13 8z" />
    <path d="M4 20l8-8" />
  </svg>
);

export const IcChat = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h16v11H8l-4 4z" />
  </svg>
);

export const IcCheck = ({ size = 16, stroke = 'currentColor', sw = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12.5l5 5 11-11" />
  </svg>
);

export const IcArrowR = ({ size = 16, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const IcHabito = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12a8 8 0 0 1 14-5.3" />
    <path d="M20 12a8 8 0 0 1-14 5.3" />
    <path d="M16 4.5v2.7h-2.7" />
    <path d="M8 19.5v-2.7h2.7" />
  </svg>
);

export const IcFlame = ({ size = 14, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-5 0 2 1 3 3 3 0-3-1-4 0-7z" />
  </svg>
);

export const IcEdit = ({ size = 16, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

export const IcTrash = ({ size = 16, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const IcClose = ({ size = 16, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IcSend = ({ size = 16, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const IcBriefcase = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="12.01" />
  </svg>
);

export const IcBook = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h8a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H2z" />
    <path d="M22 4h-8a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h8z" />
  </svg>
);

export const IcHeart = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const IcUsers = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const IcCoin = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9.5a2.5 2.5 0 0 0-5 0c0 1.5 1 2 2.5 2.5S15 13 15 14.5a2.5 2.5 0 0 1-5 0" />
    <line x1="12" y1="7" x2="12" y2="8.5" />
    <line x1="12" y1="15.5" x2="12" y2="17" />
  </svg>
);

export const IcPalette = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2v-.5c0-.6.4-1 1-1h2c2.8 0 3-2.2 3-4C20 7.6 16.4 2 12 2z" />
    <circle cx="8" cy="9" r="1" fill={stroke} stroke="none" />
    <circle cx="12" cy="7" r="1" fill={stroke} stroke="none" />
    <circle cx="16" cy="9" r="1" fill={stroke} stroke="none" />
    <circle cx="8" cy="14" r="1" fill={stroke} stroke="none" />
  </svg>
);

export const IcLotus = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V12" />
    <path d="M12 12C12 12 8 8 4 9c0 4 3 8 8 8" />
    <path d="M12 12C12 12 16 8 20 9c0 4-3 8-8 8" />
    <path d="M12 12C12 12 10 6 12 3c2 3 0 9 0 9" />
    <path d="M12 12C12 12 6 11 5 8c3-2 7 0 7 4" />
    <path d="M12 12C12 12 18 11 19 8c-3-2-7 0-7 4" />
  </svg>
);

export const IcKanban = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="18" rx="1" />
    <rect x="10" y="3" width="5" height="12" rx="1" />
    <rect x="17" y="3" width="4" height="8" rx="1" />
  </svg>
);

export const IcCalendar2 = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const IcTimer = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l3 2" />
    <path d="M9 2h6" />
    <path d="M18.5 5.5l1 1" />
  </svg>
);

export const IcTarget = ({ size = 20, stroke = 'currentColor', sw = 1.5 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" fill={stroke} stroke="none" />
  </svg>
);

export const AREA_ICONS: Record<string, React.ComponentType<IconProps>> = {
  profissional: IcBriefcase,
  faculdade: IcBook,
  saude: IcHeart,
  social: IcUsers,
  financas: IcCoin,
  hobbies: IcPalette,
  desenvolvimento: IcLotus,
};
