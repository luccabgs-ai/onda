'use client';
import React, { useState } from 'react';
import { Habito, Meta, Objetivo, Project, Task } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { AreaVista, montarAreasVista } from '@/lib/areasStats';
import { LIMIAR_AREA_NEGLIGENCIADA } from '@/lib/nutricao';
import { AREA_ICONS, IcClose } from '@/components/ui/icons';
import { Card } from '@/components/ui/Card';

interface Props {
  habitos: Habito[];
  projects: Project[];
  tasks: Task[];
  objetivos: Objetivo[];
  metas: Meta[];
}

// ── Arc progress circle ──────────────────────────────────────────────────────
const ArcProgress = ({ value, color }: { value: number; color: string }) => {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = circ * value;
  const pct = Math.round(value * 100);
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(27,54,93,0.10)" strokeWidth="2.5" />
      <circle
        cx="24" cy="24" r={r} fill="none"
        stroke={color} strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 24 24)"
      />
      <text
        x="24" y="28"
        textAnchor="middle"
        fontSize="11"
        fill={color}
        fontWeight="600"
        fontFamily="Inter, sans-serif"
      >
        {pct}
      </text>
    </svg>
  );
};

// ── Single area card ─────────────────────────────────────────────────────────
const AreaCard = ({ area, onOpen }: { area: AreaVista; onOpen: (a: AreaVista) => void }) => {
  const Icon = AREA_ICONS[area.id];
  const isNeglected = area.nutrido < LIMIAR_AREA_NEGLIGENCIADA;
  const [hovered, setHovered] = useState(false);

  return (
    <Card
      onClick={() => onOpen(area)}
      style={{
        padding: '24px',
        minHeight: 200,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(.2,.7,.2,1), box-shadow 0.3s',
        boxShadow: hovered ? '0 6px 24px rgba(27,54,93,0.10)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Kanji watermark */}
      <span
        className="jp"
        style={{
          position: 'absolute',
          right: 12,
          top: 2,
          fontSize: 88,
          color: area.color,
          opacity: 0.06,
          fontWeight: 500,
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {area.kanji}
      </span>

      {/* Icon + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 5,
          background: `${area.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {Icon && <Icon size={18} stroke={area.color} sw={1.5} />}
        </div>
        <div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1, fontWeight: 500 }}>
            {area.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--char-mute)', marginTop: 3 }}>
            {area.sub}
          </div>
        </div>
      </div>

      {/* Objective */}
      <p style={{
        fontSize: 13,
        color: 'var(--char-soft)',
        lineHeight: 1.6,
        margin: '0 0 20px',
        minHeight: 56,
      }}>
        {area.objetivoTexto}
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <ArcProgress value={area.nutrido} color={area.color} />
        <div style={{ fontSize: 11, color: 'var(--char-mute)', lineHeight: 1.7 }}>
          <div>
            <span style={{ color: 'var(--char)', fontWeight: 500 }}>{area.habitosCount}</span> hábitos · <span style={{ color: 'var(--char)', fontWeight: 500 }}>{area.projetosCount}</span> projetos
          </div>
          <div>
            última atividade · <span style={{ color: isNeglected ? 'var(--hanko)' : 'var(--char)', fontWeight: isNeglected ? 500 : 400 }}>{area.ultima}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ── Detail modal ─────────────────────────────────────────────────────────────
const AreaDetail = ({ area, onClose }: { area: AreaVista; onClose: () => void }) => {
  const Icon = AREA_ICONS[area.id];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,38,74,0.42)',
        backdropFilter: 'blur(3px)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--washi)',
          border: '1px solid rgba(27,54,93,0.18)',
          borderRadius: 8,
          width: 'min(820px, 100%)',
          maxHeight: '88vh',
          overflow: 'auto',
          boxShadow: '0 30px 80px -20px rgba(20,38,74,0.45)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '28px 32px 22px',
          borderBottom: '1px solid rgba(27,54,93,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 18, right: 18,
              width: 30, height: 30, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--char-soft)',
              border: '1px solid rgba(27,54,93,0.10)',
              zIndex: 2,
            }}
          >
            <IcClose size={14} />
          </button>

          {/* Kanji watermark */}
          <span
            className="jp"
            style={{
              position: 'absolute', right: 56, top: -10,
              fontSize: 100, color: area.color, opacity: 0.07,
              lineHeight: 1, fontWeight: 500, pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {area.kanji}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 6,
              background: `${area.color}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {Icon && <Icon size={22} stroke={area.color} sw={1.4} />}
            </div>
            <div>
              <h2 className="serif" style={{ fontSize: 32, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
                {area.name}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--char-mute)', marginTop: 2 }}>{area.sub}</div>
            </div>
          </div>

          <p className="serif" style={{
            fontSize: 18, color: 'var(--char)',
            lineHeight: 1.5, marginTop: 18,
            fontStyle: 'italic',
            position: 'relative',
          }}>
            &ldquo;{area.objetivoTexto}&rdquo;
          </p>
        </div>

        {/* Body */}
        <div style={{
          padding: '24px 32px 32px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
        }}>
          {/* Projetos */}
          <div>
            <div style={{
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--char-mute)', marginBottom: 12,
            }}>
              Projetos
            </div>
            {area.projetosDetalhe.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {area.projetosDetalhe.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 14px',
                      border: '1px solid rgba(27,54,93,0.10)',
                      borderRadius: 5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontSize: 13, color: 'var(--char)', fontWeight: 500 }}>{p.name}</div>
                      {p.due && <div style={{ fontSize: 11, color: 'var(--char-mute)', flexShrink: 0 }}>{p.due}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--char-mute)', marginTop: 3, marginBottom: 8 }}>{p.status}</div>
                    <div style={{ height: 3, background: 'rgba(27,54,93,0.08)', borderRadius: 999 }}>
                      <div style={{
                        width: `${p.progress * 100}%`,
                        height: '100%',
                        background: area.color,
                        borderRadius: 999,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '14px 16px',
                border: '1px dashed rgba(27,54,93,0.15)',
                borderRadius: 5,
                fontSize: 12,
                color: 'var(--char-mute)',
                fontStyle: 'italic',
              }}>
                nenhum projeto ativo nessa área
              </div>
            )}
          </div>

          {/* Metas */}
          <div>
            <div style={{
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--char-mute)', marginBottom: 12,
            }}>
              Metas
            </div>
            {area.metasDetalhe.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {area.metasDetalhe.map((m, i) => (
                  <div key={i} style={{ paddingLeft: 12, borderLeft: `2px solid ${area.color}` }}>
                    <div style={{ fontSize: 13, color: 'var(--char)', marginBottom: 6, textDecoration: m.concluida ? 'line-through' : 'none' }}>
                      {m.titulo}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--char-mute)', marginBottom: 4 }}>
                      {m.valorAtual}/{m.valorAlvo} {m.unidade}
                    </div>
                    <div style={{ height: 3, background: 'rgba(27,54,93,0.08)', borderRadius: 999 }}>
                      <div style={{
                        width: `${m.progresso * 100}%`,
                        height: '100%',
                        background: m.concluida ? 'var(--moss)' : area.color,
                        borderRadius: 999,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '14px 16px',
                border: '1px dashed rgba(27,54,93,0.15)',
                borderRadius: 5,
                fontSize: 12,
                color: 'var(--char-mute)',
                fontStyle: 'italic',
              }}>
                nenhuma meta vinculada a essa área ainda
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 32px',
          borderTop: '1px solid rgba(27,54,93,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(245,239,224,0.4)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--char-mute)' }}>
            <span style={{ color: area.color, fontWeight: 600 }}>{Math.round(area.nutrido * 100)}%</span> nutrido essa semana · sequência de{' '}
            <span style={{ color: 'var(--hanko)', fontWeight: 500 }}>{area.streakDias}</span> dias
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AreasScreen({ habitos, projects, tasks, objetivos, metas }: Props) {
  const [openAreaId, setOpenAreaId] = useState<string | null>(null);

  const areasVista = montarAreasVista(AREAS, habitos, projects, tasks, objetivos, metas);
  const openArea = areasVista.find(a => a.id === openAreaId) ?? null;

  return (
    <div style={{ padding: '40px 56px 80px', maxWidth: 1180, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 34 }}>
        <div style={{
          fontSize: 10, fontWeight: 600,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--char-mute)', marginBottom: 6,
        }}>
          sete pilares
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h1 className="serif" style={{ fontSize: 40, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
            Áreas
          </h1>
          <span className="jp" style={{ fontSize: 22, color: 'var(--char-mute)', fontWeight: 400 }}>
            領域
          </span>
        </div>
        <p style={{
          fontSize: 14, color: 'var(--char-soft)',
          maxWidth: 580, marginTop: 12, lineHeight: 1.65,
        }}>
          Sua vida não cabe numa lista. Ela cabe em sete correntes que precisam, todas, de água.
          Aqui é onde você cuida de cada uma.
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {areasVista.map(area => (
          <AreaCard key={area.id} area={area} onOpen={a => setOpenAreaId(a.id)} />
        ))}
      </div>

      {/* Detail modal */}
      {openArea && <AreaDetail area={openArea} onClose={() => setOpenAreaId(null)} />}
    </div>
  );
}
