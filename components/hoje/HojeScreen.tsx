'use client';
import React, { useState } from 'react';
import { TodayData } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useHabitsStore } from '@/lib/habitsStore';
import { useProjectsStore } from '@/lib/projectsStore';
import { usePrioridadesStore } from '@/lib/prioridadesStore';
import { useObjetivosStore } from '@/lib/objetivosStore';
import { useCalendarStore } from '@/lib/calendarStore';
import { computeNutridoMap, votouHoje, estaAgendadoEm, toDateStr } from '@/lib/nutricao';
import { computePrioridadesDoDia, PrioridadeItem } from '@/lib/prioridades';
import { montarAreasVista } from '@/lib/areasStats';

import { Bussola } from './Bussola';
import { EnergyScale } from './EnergyScale';
import { Hanko } from '@/components/ui/Hanko';
import { AreaBadge } from '@/components/ui/AreaBadge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card } from '@/components/ui/Card';
import { IcCheck, IcEdit, IcTrash, IcCalendar2 } from '@/components/ui/icons';

type HabitsStore = ReturnType<typeof useHabitsStore>;

interface HojeScreenProps {
  today: TodayData;
  didCheckIn: boolean;
  hour: number;
  habitsStore: HabitsStore;
  projectsStore: ReturnType<typeof useProjectsStore>;
  prioridadesStore: ReturnType<typeof usePrioridadesStore>;
  objetivosStore: ReturnType<typeof useObjetivosStore>;
  calendarStore: ReturnType<typeof useCalendarStore>;
}

const SectionTitle = ({
  kicker,
  title,
  jp,
}: {
  kicker?: string;
  title: string;
  jp?: string;
}) => (
  <div style={{ marginBottom: 16 }}>
    {kicker && (
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--char-mute)',
        marginBottom: 4,
      }}>
        {kicker}
      </div>
    )}
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span className="serif" style={{ fontSize: 20, color: 'var(--ink)', lineHeight: 1 }}>
        {title}
      </span>
      {jp && (
        <span className="jp" style={{ fontSize: 13, color: 'var(--char-mute)', opacity: 0.7 }}>
          {jp}
        </span>
      )}
    </div>
  </div>
);

const NightWaveBg = () => (
  <svg
    viewBox="0 0 400 120"
    preserveAspectRatio="none"
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0.06,
      pointerEvents: 'none',
    }}
  >
    <path d="M0 60 C60 40, 120 80, 180 55 C240 30, 300 70, 360 50 C380 44, 390 48, 400 46" stroke="var(--ink)" strokeWidth="2" fill="none" />
    <path d="M0 75 C60 55, 120 95, 180 70 C240 45, 300 85, 360 65 C380 59, 390 63, 400 61" stroke="var(--ink)" strokeWidth="1.5" fill="none" />
    <path d="M0 90 C60 70, 120 110, 180 85 C240 60, 300 100, 360 80 C380 74, 390 78, 400 76" stroke="var(--ink)" strokeWidth="1" fill="none" />
  </svg>
);

interface CheckInCardProps {
  isEvening: boolean;
}

const CheckInCard = ({ isEvening }: CheckInCardProps) => {
  const [reflection, setReflection] = useState('');

  if (isEvening) {
    return (
      <Card style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <NightWaveBg />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 6 }}>
            CHECK-OUT · 振り返り
          </div>
          <div className="serif" style={{ fontSize: 17, color: 'var(--ink)', marginBottom: 12, fontStyle: 'italic' }}>
            Como foi hoje?
          </div>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Uma palavra, uma frase... o que ficou do dia."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(27,54,93,0.12)',
              borderRadius: 5,
              padding: '10px 12px',
              fontSize: 13,
              color: 'var(--char)',
              resize: 'none',
              minHeight: 72,
              lineHeight: 1.6,
            }}
          />
          <button
            style={{
              marginTop: 10,
              padding: '8px 16px',
              background: 'var(--ink)',
              color: 'var(--washi)',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
            }}
          >
            Registrar reflexão
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: '20px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 6 }}>
        RITUAL · 朝の儀式
      </div>
      <div className="serif" style={{ fontSize: 17, color: 'var(--ink)', marginBottom: 8, fontStyle: 'italic' }}>
        Bom dia, Lucca.
      </div>
      <p style={{ fontSize: 13, color: 'var(--char-soft)', lineHeight: 1.6, marginBottom: 14 }}>
        Antes de começar, defina sua intenção para hoje.
      </p>
      <input
        type="text"
        placeholder="Minha intenção para hoje é..."
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(27,54,93,0.12)',
          borderRadius: 5,
          padding: '9px 12px',
          fontSize: 13,
          color: 'var(--char)',
        }}
      />
    </Card>
  );
};

interface StreakCardProps {
  habitos: ReturnType<typeof useHabitsStore>['habitos'];
}

/** Versão compacta, alinhada à direita — mora no cabeçalho, do lado da Intenção do Dia. */
const StreakSummaryInline = ({ habitos }: StreakCardProps) => {
  const total = habitos.length;
  const votados = habitos.filter(h => votouHoje(h)).length;
  const pct = total > 0 ? Math.round((votados / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>
        Votos de hoje
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)', fontFamily: 'Cormorant Garamond, serif' }}>
          {votados}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--char-mute)' }}>
          / {total} {total === 0 ? 'agendados' : 'hábitos'}
        </span>
      </div>
      {total > 0 && (
        <div style={{ width: 110, height: 4, borderRadius: 2, background: 'rgba(27,54,93,0.1)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--ink)',
            borderRadius: 2,
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}
    </div>
  );
};

export default function HojeScreen({ today, didCheckIn, hour, habitsStore, projectsStore, prioridadesStore, objetivosStore, calendarStore }: HojeScreenProps) {
  const [hoveredHabitoId, setHoveredHabitoId] = useState<string | null>(null);
  const [addingPrioridade, setAddingPrioridade] = useState(false);
  const [novaPrioridade, setNovaPrioridade] = useState('');
  const [novaPrioridadeArea, setNovaPrioridadeArea] = useState<string | undefined>(undefined);
  const [editingManualId, setEditingManualId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editArea, setEditArea] = useState<string | undefined>(undefined);
  const [hoveredPrioridadeId, setHoveredPrioridadeId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { habitos, votar } = habitsStore;
  const { projects, tasks, moveTask } = projectsStore;
  const { manuais, addManual, toggleManual, updateManual, removeManual } = prioridadesStore;
  const { events } = calendarStore;
  const hojeStr = toDateStr(new Date());
  const habitosHoje = habitos.filter(h => estaAgendadoEm(h, hojeStr));

  const isEvening = hour >= 20;
  const greeting = isEvening ? 'boa noite,' : 'bom dia,';

  const nutridoMap = computeNutridoMap(habitos, AREAS);
  const areasVista = montarAreasVista(AREAS, habitos, projects, tasks, objetivosStore.objetivos, objetivosStore.metas);
  const neglectedAreaVista = areasVista.find(a => a.nutrido < 0.25);

  const prioridadeItems = computePrioridadesDoDia({
    tasks, projects, habitos, manuais, events, nutridoMap, hoje: hojeStr,
  });

  const togglePrioridadeItem = (item: PrioridadeItem) => {
    if (item.kind === 'manual') toggleManual(item.id);
    else if (item.kind === 'task') moveTask(item.taskId, 'concluido');
    else if (item.kind === 'habito') votar(item.habitoId);
  };

  const submitNovaPrioridade = () => {
    const text = novaPrioridade.trim();
    if (!text) return;
    addManual({ text, areaId: novaPrioridadeArea, data: hojeStr });
    setNovaPrioridade('');
    setNovaPrioridadeArea(undefined);
    setAddingPrioridade(false);
  };

  const startEditManual = (item: Extract<PrioridadeItem, { kind: 'manual' }>) => {
    setEditingManualId(item.id);
    setEditText(item.text);
    setEditArea(item.areaId);
  };

  const cancelEditManual = () => {
    setEditingManualId(null);
    setEditText('');
    setEditArea(undefined);
  };

  const saveEditManual = () => {
    const text = editText.trim();
    if (!text || !editingManualId) return;
    updateManual(editingManualId, { text, areaId: editArea });
    cancelEditManual();
  };

  const areaColor = (areaId: string) => AREAS.find(a => a.id === areaId)?.color ?? 'var(--ink)';

  return (
    <div style={{ padding: '40px 48px 80px', maxWidth: 1180, margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--char-mute)',
          marginBottom: 8,
        }}>
          {today.dataExtensa}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
          <h1 className="serif" style={{
            fontSize: 38,
            fontWeight: 500,
            color: 'var(--ink)',
            margin: 0,
            lineHeight: 1.05,
          }}>
            {greeting}{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--ink-soft)' }}>Lucca.</em>
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>
              Energia
            </div>
            <EnergyScale value={today.energia} readOnly />
          </div>
        </div>
      </div>

      {/* ── INTENTION BAR + VOTOS DE HOJE ── */}
      {(didCheckIn || habitos.length > 0) && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 24,
        }}>
          {didCheckIn ? (
            <div style={{ paddingLeft: 16, borderLeft: '2.5px solid var(--ink)' }}>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-soft)',
                marginBottom: 4,
              }}>
                Intenção do Dia
              </div>
              <p className="serif" style={{
                fontSize: 17,
                fontStyle: 'italic',
                color: 'var(--char)',
                margin: 0,
                lineHeight: 1.5,
              }}>
                &ldquo;{today.intencao}&rdquo;
              </p>
            </div>
          ) : <div />}

          {habitos.length > 0 && <StreakSummaryInline habitos={habitosHoje} />}
        </div>
      )}

      {/* Brush divider */}
      <div className="brush-divider" style={{ marginBottom: 32 }} />

      {/* ── HÁBITOS DE HOJE — primeira coisa visível, gesto mínimo de voto ── */}
      <Card style={{ padding: '22px 24px', marginBottom: 36 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--char-mute)', marginRight: 4 }}>
              Rotina
            </div>
            <span className="serif" style={{ fontSize: 20, color: 'var(--ink)', lineHeight: 1 }}>Hábitos de hoje</span>
            <span className="jp" style={{ fontSize: 13, color: 'var(--char-mute)', opacity: 0.7 }}>習慣</span>
          </div>
          {habitos.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--char-mute)', margin: '4px 0 0' }}>
              toque num hábito para registrar o voto de hoje
            </p>
          )}
        </div>

        {habitos.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
            nenhum voto criado ainda — vá na aba Hábitos pra começar
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {[...habitos]
              .sort((a, b) => Number(estaAgendadoEm(b, hojeStr)) - Number(estaAgendadoEm(a, hojeStr)))
              .map((h) => {
                const color = areaColor(h.areaId);
                const votado = votouHoje(h);
                const agendado = estaAgendadoEm(h, hojeStr);
                const isHovered = hoveredHabitoId === h.id;
                return (
                  <div key={h.id} style={{ position: 'relative' }}>
                    <button
                      onClick={() => votar(h.id)}
                      onMouseEnter={() => setHoveredHabitoId(h.id)}
                      onMouseLeave={() => setHoveredHabitoId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: agendado ? 8 : 6,
                        padding: agendado ? '10px 18px' : '7px 13px',
                        borderRadius: 24,
                        border: !agendado
                          ? `1px dashed ${votado ? color + '50' : 'rgba(27,54,93,0.18)'}`
                          : votado ? 'none' : `1.5px solid ${color}60`,
                        background: !agendado
                          ? (votado ? `${color}10` : 'transparent')
                          : votado ? color : `${color}14`,
                        color: !agendado
                          ? (votado ? color : 'var(--char-mute)')
                          : votado ? 'white' : color,
                        fontSize: agendado ? 14 : 12.5,
                        fontWeight: agendado ? 500 : 400,
                        opacity: agendado ? 1 : 0.75,
                        cursor: 'pointer',
                        transform: isHovered ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)',
                        boxShadow: isHovered && agendado
                          ? `0 6px 16px -4px ${color}50`
                          : agendado ? '0 1px 2px rgba(27,54,93,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{
                        width: agendado ? 18 : 14, height: agendado ? 18 : 14, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: votado
                          ? `1.5px solid ${agendado ? 'rgba(255,255,255,0.7)' : color + '80'}`
                          : `1.5px solid ${agendado ? color + '80' : 'rgba(27,54,93,0.25)'}`,
                        background: votado ? (agendado ? 'rgba(255,255,255,0.15)' : 'transparent') : 'transparent',
                      }}>
                        {votado && <IcCheck size={agendado ? 11 : 9} stroke={agendado ? 'white' : color} sw={agendado ? 3 : 2.5} />}
                      </span>
                      <span>{h.acao}</span>
                    </button>

                    {isHovered && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--ink-deep)',
                        color: 'var(--washi)',
                        borderRadius: 6,
                        padding: '10px 14px',
                        fontSize: 11.5,
                        lineHeight: 1.7,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 10px 24px -8px rgba(20,38,74,0.45)',
                        zIndex: 10,
                        pointerEvents: 'none',
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{h.identidade}</div>
                        <div>tempo: {h.metaAtual}</div>
                        {h.horario && <div>horário: {h.horario}</div>}
                        {h.local && <div>local: {h.local}</div>}
                        <div>
                          âncora: {
                            h.ancoraTipo === 'ritual_manha' ? 'ritual da manhã' :
                            h.ancoraTipo === 'ritual_noite' ? 'ritual da noite' :
                            h.ancoraTipo === 'habito' ? `depois de ${habitos.find(x => x.id === h.ancoraHabitoId)?.acao ?? 'hábito removido'}` :
                            h.ancoraTipo === 'outro' ? h.ancoraTexto :
                            'sem âncora'
                          }
                        </div>
                        {!agendado && (
                          <div style={{ marginTop: 4, fontStyle: 'italic', opacity: 0.8 }}>
                            não agendado hoje — mas pode votar assim mesmo
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* ── 2-COLUMN GRID: Bussola + (AI nudge + Prioridades) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 28, marginBottom: 36, alignItems: 'start' }}>

        {/* LEFT: Bussola */}
        <div>
          <SectionTitle kicker="Visão Geral" title="Bússola" jp="羅針盤" />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Bussola size={340} nutridoMap={nutridoMap} />
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--char-soft)', lineHeight: 1.65, marginTop: 12, textAlign: 'center' }}>
            Cada eixo representa uma área da vida. O polígono mostra quanto cada área está sendo nutrida.
          </p>
        </div>

        {/* RIGHT: AI nudge + Prioridades */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* AI Nudge card */}
          {neglectedAreaVista && (
            <div style={{
              border: '1.5px solid rgba(197,72,58,0.35)',
              borderRadius: 6,
              padding: '16px 18px',
              background: 'rgba(197,72,58,0.04)',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <Hanko size={32} label="話" />
                <div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--hanko)',
                    marginBottom: 3,
                  }}>
                    Uma Observação
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--char-mute)' }}>Onda · Análise de padrões</div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--char)', lineHeight: 1.65, margin: 0 }}>
                <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{neglectedAreaVista.name}</strong> está sendo negligenciada — última atividade <em>{neglectedAreaVista.ultima}</em>, nutrido em apenas{' '}
                <strong style={{ color: 'var(--hanko)' }}>{Math.round(neglectedAreaVista.nutrido * 100)}%</strong>.{' '}
                {neglectedAreaVista.temObjetivo
                  ? <>Seu objetivo aqui é <strong>&ldquo;{neglectedAreaVista.objetivoTexto}&rdquo;</strong> — que tal dar um passo hoje?</>
                  : neglectedAreaVista.objetivoTexto}
              </p>
            </div>
          )}

          {/* Prioridades */}
          <div>
            <SectionTitle kicker="Foco" title="Prioridades" jp="今日" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prioridadeItems.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
                  nada puxando a atenção agora — dia livre
                </p>
              )}
              {prioridadeItems.map((item, idx) => {
                if (item.kind === 'manual' && editingManualId === item.id) {
                  return (
                    <div key={item.id} style={{
                      padding: '12px 14px', borderRadius: 6,
                      border: '1px solid rgba(27,54,93,0.15)', background: 'rgba(255,255,255,0.7)',
                      display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <input
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEditManual(); if (e.key === 'Escape') cancelEditManual(); }}
                        style={{
                          width: '100%', border: 'none', background: 'transparent',
                          fontSize: 13.5, color: 'var(--char)', fontFamily: 'inherit',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {AREAS.map(a => {
                          const active = editArea === a.id;
                          return (
                            <button
                              key={a.id}
                              onClick={() => setEditArea(active ? undefined : a.id)}
                              title={a.name}
                              style={{
                                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                background: a.color,
                                border: active ? '2px solid var(--char)' : '2px solid transparent',
                                opacity: active ? 1 : 0.45,
                                cursor: 'pointer', transition: 'all 0.12s',
                              }}
                            />
                          );
                        })}
                        <div style={{ flex: 1 }} />
                        <button onClick={cancelEditManual} style={{ fontSize: 12, color: 'var(--char-mute)', padding: '5px 8px' }}>
                          cancelar
                        </button>
                        <button
                          disabled={!editText.trim()}
                          onClick={saveEditManual}
                          style={{
                            padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 4,
                            background: editText.trim() ? 'var(--ink)' : 'rgba(27,54,93,0.2)',
                            color: 'var(--washi)',
                            cursor: editText.trim() ? 'pointer' : 'default',
                          }}
                        >
                          salvar
                        </button>
                      </div>
                    </div>
                  );
                }

                const isManual = item.kind === 'manual';
                const showActions = isManual && hoveredPrioridadeId === item.id;
                const confirmingDelete = isManual && confirmDeleteId === item.id;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => isManual && setHoveredPrioridadeId(item.id)}
                    onMouseLeave={() => setHoveredPrioridadeId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '13px 14px',
                      background: item.done ? 'rgba(27,54,93,0.04)' : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${item.done ? 'rgba(27,54,93,0.08)' : 'rgba(27,54,93,0.1)'}`,
                      borderLeft: `3px solid ${areaColor(item.areaId ?? '')}`,
                      borderRadius: 6,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {item.kind === 'evento' ? (
                      <div style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IcCalendar2 size={15} stroke="var(--char-mute)" />
                      </div>
                    ) : (
                      <Checkbox checked={item.done} onChange={() => togglePrioridadeItem(item)} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13.5,
                        color: item.done ? 'var(--char-mute)' : 'var(--char)',
                        textDecoration: item.done ? 'line-through' : 'none',
                        margin: '0 0 6px',
                        lineHeight: 1.5,
                      }}>
                        {item.text}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {item.areaId && <AreaBadge areaId={item.areaId} small />}
                        <span style={{ fontSize: 10, color: 'var(--char-mute)', fontStyle: 'italic' }}>
                          {item.kind === 'task' ? 'de Projetos'
                            : item.kind === 'habito' ? 'hábito do dia'
                            : item.kind === 'evento' ? (item.time ? `evento às ${item.time}` : 'evento de hoje')
                            : 'adicionada por você'}
                        </span>
                      </div>
                    </div>

                    {confirmingDelete ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 10.5, color: 'var(--hanko)' }}>apagar?</span>
                        <button
                          onClick={() => { removeManual(item.id); setConfirmDeleteId(null); }}
                          style={{ fontSize: 11, fontWeight: 600, color: 'var(--hanko)', padding: '2px 6px' }}
                        >
                          sim
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={{ fontSize: 11, color: 'var(--char-mute)', padding: '2px 6px' }}
                        >
                          não
                        </button>
                      </div>
                    ) : showActions ? (
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        <button
                          onClick={() => startEditManual(item)}
                          title="editar"
                          style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--char-mute)' }}
                        >
                          <IcEdit size={13} stroke="var(--char-mute)" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          title="apagar"
                          style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hanko)' }}
                        >
                          <IcTrash size={13} stroke="var(--hanko)" />
                        </button>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--char-mute)',
                        opacity: 0.5,
                        paddingTop: 2,
                        fontFamily: 'Cormorant Garamond, serif',
                        minWidth: 16,
                        textAlign: 'right',
                      }}>
                        {idx + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add manual priority */}
            {addingPrioridade ? (
              <div style={{
                marginTop: 10, padding: '12px 14px', borderRadius: 6,
                border: '1px solid rgba(27,54,93,0.15)', background: 'rgba(255,255,255,0.6)',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <input
                  autoFocus
                  value={novaPrioridade}
                  onChange={e => setNovaPrioridade(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitNovaPrioridade(); if (e.key === 'Escape') setAddingPrioridade(false); }}
                  placeholder="o que precisa entrar na lista de hoje?"
                  style={{
                    width: '100%', border: 'none', background: 'transparent',
                    fontSize: 13.5, color: 'var(--char)', fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {AREAS.map(a => {
                    const active = novaPrioridadeArea === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setNovaPrioridadeArea(active ? undefined : a.id)}
                        title={a.name}
                        style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          background: a.color,
                          border: active ? '2px solid var(--char)' : '2px solid transparent',
                          opacity: active ? 1 : 0.45,
                          cursor: 'pointer', transition: 'all 0.12s',
                        }}
                      />
                    );
                  })}
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => setAddingPrioridade(false)}
                    style={{ fontSize: 12, color: 'var(--char-mute)', padding: '5px 8px' }}
                  >
                    cancelar
                  </button>
                  <button
                    disabled={!novaPrioridade.trim()}
                    onClick={submitNovaPrioridade}
                    style={{
                      padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 4,
                      background: novaPrioridade.trim() ? 'var(--ink)' : 'rgba(27,54,93,0.2)',
                      color: 'var(--washi)',
                      cursor: novaPrioridade.trim() ? 'pointer' : 'default',
                    }}
                  >
                    adicionar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingPrioridade(true)}
                style={{
                  marginTop: 10, fontSize: 12.5, color: 'var(--char-mute)',
                  padding: '6px 4px', textAlign: 'left',
                }}
              >
                + adicionar prioridade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Check-in/out card ── */}
      <div style={{ maxWidth: 480 }}>
        <SectionTitle
          kicker={isEvening ? 'Encerramento' : 'Abertura'}
          title={isEvening ? 'Reflexão' : 'Ritual'}
          jp={isEvening ? '振り返り' : '儀式'}
        />
        <CheckInCard isEvening={isEvening} />
      </div>
    </div>
  );
}
