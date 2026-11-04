'use client';
import React, { useState } from 'react';
import { AREAS } from '@/lib/data';
import { PrioridadeRitual, Task, Project } from '@/lib/types';
import { useHabitsStore } from '@/lib/habitsStore';
import { useProjectsStore } from '@/lib/projectsStore';
import { useObjetivosStore } from '@/lib/objetivosStore';
import { useCalendarStore } from '@/lib/calendarStore';
import { useRituaisStore } from '@/lib/rituaisStore';
import { formatarMinutos } from '@/lib/focoStore';
import { computeNutridoMap, ordenarHabitosDoDia, votouHoje, estaAgendadoEm, toDateStr, LIMIAR_AREA_NEGLIGENCIADA } from '@/lib/nutricao';
import { computePrioridadesDoDia, PrioridadeItem } from '@/lib/prioridades';
import { montarAreasVista } from '@/lib/areasStats';
import { progressoDeMeta, progressoDoObjetivo } from '@/lib/metas';

import { Bussola } from './Bussola';
import { EnergyScale } from './EnergyScale';
import { Hanko } from '@/components/ui/Hanko';
import { AreaBadge } from '@/components/ui/AreaBadge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card } from '@/components/ui/Card';
import { IcCheck, IcEdit, IcCalendar2, IcAlert } from '@/components/ui/icons';
import PrioridadeSlotEditor from '@/components/ritual/PrioridadeSlotEditor';
import RitualForm, { RitualRespostas } from '@/components/ritual/RitualForm';

type HabitsStore = ReturnType<typeof useHabitsStore>;

interface HojeScreenProps {
  dataExtensa: string;
  hour: number;
  habitsStore: HabitsStore;
  projectsStore: ReturnType<typeof useProjectsStore>;
  objetivosStore: ReturnType<typeof useObjetivosStore>;
  calendarStore: ReturnType<typeof useCalendarStore>;
  rituaisStore: ReturnType<typeof useRituaisStore>;
  onIrParaObjetivos: () => void;
  onAbrirProjeto: (project: Project) => void;
  minutosFocoHoje?: number;   // tempo de foco gravado hoje pelo cronômetro
}

const PRIORITY_COLOR: Record<string, string> = {
  baixa: 'var(--moss)', media: '#B8860B', alta: 'var(--hanko)',
};
const PRIORITY_LABEL: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta',
};
const PRIORITY_ORDER: Record<string, number> = { alta: 0, media: 1, baixa: 2 };

function formatDueLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

interface ProjectTaskRowProps {
  task: Task;
  project?: Project;
  statusLabel?: string;
  statusColor?: string;
  onToggle: () => void;
  onOpen: () => void;
}

const ProjectTaskRow = ({ task, project, statusLabel, statusColor, onToggle, onOpen }: ProjectTaskRowProps) => {
  const feita = task.status === 'concluido';
  return (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 6,
    border: `1px solid ${feita ? 'rgba(27,54,93,0.06)' : 'rgba(27,54,93,0.1)'}`,
    borderLeft: `3px solid ${project?.color ?? 'var(--ink)'}`,
    background: feita ? 'rgba(27,54,93,0.04)' : 'rgba(255,255,255,0.6)',
    opacity: feita ? 0.75 : 1,
    transition: 'all 0.2s ease',
  }}>
    <Checkbox checked={feita} onChange={onToggle} />
    <button onClick={onOpen} style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
      <p style={{
        fontSize: 13,
        color: feita ? 'var(--char-mute)' : 'var(--char)',
        margin: '0 0 5px',
        lineHeight: 1.4,
        textDecoration: feita ? 'line-through' : 'none',
      }}>
        {task.title}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {project && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'var(--char-mute)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
            {project.title}
          </span>
        )}
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
          background: PRIORITY_COLOR[task.priority] + '18', color: PRIORITY_COLOR[task.priority],
        }}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        {statusLabel && (
          <span style={{ fontSize: 10, color: statusColor ?? 'var(--char-mute)', fontWeight: statusColor ? 600 : 400 }}>
            {statusLabel}
          </span>
        )}
      </div>
    </button>
  </div>
  );
};

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
  feito: boolean;          // o ritual correspondente (manhã ou noite) já foi registrado hoje?
  onAbrirRitual: () => void;
}

const CheckInCard = ({ isEvening, feito, onAbrirRitual }: CheckInCardProps) => (
  <Card style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
    {isEvening && <NightWaveBg />}
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 6 }}>
        {isEvening ? 'CHECK-OUT · 振り返り' : 'RITUAL · 朝の儀式'}
      </div>
      <div className="serif" style={{ fontSize: 17, color: 'var(--ink)', marginBottom: 8, fontStyle: 'italic' }}>
        {isEvening ? 'Como foi hoje?' : 'Bom dia, Lucca.'}
      </div>
      {feito ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--moss)' }}>
          <IcCheck size={15} stroke="var(--moss)" sw={2} />
          {isEvening ? 'check-out feito — descanse.' : 'check-in feito — sua intenção guia o dia.'}
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: 'var(--char-soft)', lineHeight: 1.6, marginBottom: 14 }}>
            {isEvening
              ? 'Três perguntas rápidas pra fechar o dia com consciência.'
              : 'Três perguntas rápidas pra entrar no dia com clareza.'}
          </p>
          <button
            onClick={onAbrirRitual}
            style={{
              padding: '8px 16px',
              background: 'var(--ink)',
              color: 'var(--washi)',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
            }}
          >
            {isEvening ? 'Fazer o check-out noturno' : 'Fazer o check-in matinal'}
          </button>
        </>
      )}
    </div>
  </Card>
);

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

export default function HojeScreen({ dataExtensa, hour, habitsStore, projectsStore, objetivosStore, calendarStore, rituaisStore, onIrParaObjetivos, onAbrirProjeto, minutosFocoHoje = 0 }: HojeScreenProps) {
  const [hoveredHabitoId, setHoveredHabitoId] = useState<string | null>(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [editingSlotDraft, setEditingSlotDraft] = useState<PrioridadeRitual | null>(null);
  const [hoveredPrioridadeId, setHoveredPrioridadeId] = useState<string | null>(null);
  // O ritual abre aqui mesmo, por cima da tela — não há mais página própria.
  const [ritualAberto, setRitualAberto] = useState<'morning' | 'evening' | null>(null);

  const { habitos, votar } = habitsStore;
  const { projects, tasks, moveTask } = projectsStore;
  const { events } = calendarStore;
  const hojeStr = toDateStr(new Date());
  const habitosHoje = habitos.filter(h => estaAgendadoEm(h, hojeStr));
  const registroManha = rituaisStore.registroDe(hojeStr, 'manha');
  const registroNoite = rituaisStore.registroDe(hojeStr, 'noite');
  const vitoriasHoje = registroManha?.vitorias ?? [];

  const isEvening = hour >= 20;
  const greeting = isEvening ? 'boa noite,' : 'bom dia,';

  const nutridoMap = computeNutridoMap(habitos, AREAS);
  const areasVista = montarAreasVista(AREAS, habitos, projects, tasks, objetivosStore.objetivos, objetivosStore.metas);
  const neglectedAreaVista = areasVista.find(a => a.nutrido < LIMIAR_AREA_NEGLIGENCIADA);

  const objetivosVisao = objetivosStore.objetivos
    .filter(o => o.status === 'ativo')
    .map(o => {
      const metasDoObjetivo = objetivosStore.metas.filter(m => m.objetivoId === o.id);
      const { concluidas, total } = progressoDoObjetivo(metasDoObjetivo, habitos);
      const progresso = total > 0
        ? metasDoObjetivo.reduce((soma, m) => soma + progressoDeMeta(m, habitos), 0) / total
        : 0;
      return { objetivo: o, concluidas, total, progresso };
    });

  // Uma tarefa concluída hoje mesmo continua na lista (marcada, riscada) em vez de sumir na
  // hora — só sai de fato amanhã. Evita o "pulo" de a lista encolher a cada toque.
  // updatedAt vem em UTC — comparar com slice(0,10) erra perto da meia-noite em fusos como o
  // nosso (UTC-3): convertendo pra Date primeiro, toDateStr já extrai a data no fuso local.
  const concluidaHoje = (t: Task) => t.status === 'concluido' && toDateStr(new Date(t.updatedAt)) === hojeStr;

  // Tarefas com prazo hoje ou vencido — "o que precisa da sua atenção agora".
  const atividadesProjetoHoje = [...tasks]
    .filter(t => !!t.dueDate && t.dueDate <= hojeStr && (t.status !== 'concluido' || concluidaHoje(t)))
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

  // Sugestões: o resto das tarefas em aberto, priorizando as mais urgentes e as mais antigas
  // (paradas há mais tempo) — um empurrão pros projetos que não têm prazo apertando hoje.
  const idsAtividadesHoje = new Set(atividadesProjetoHoje.map(t => t.id));
  const sugestoesProjeto = [...tasks]
    .filter(t => !idsAtividadesHoje.has(t.id) && (t.status !== 'concluido' || concluidaHoje(t)))
    .sort((a, b) => {
      const dif = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return dif !== 0 ? dif : a.createdAt.localeCompare(b.createdAt);
    })
    .slice(0, 3);

  const projectOf = (projectId: string) => projects.find(p => p.id === projectId);

  const prioridadeItems = computePrioridadesDoDia({
    tasks, projects, habitos, vitorias: vitoriasHoje, events, hoje: hojeStr,
  });

  const togglePrioridadeItem = (item: PrioridadeItem) => {
    if (item.kind === 'manual') {
      const novo = [...vitoriasHoje];
      novo[item.slotIndex] = { ...novo[item.slotIndex], done: !novo[item.slotIndex].done };
      rituaisStore.atualizarVitorias(hojeStr, novo);
    } else if (item.kind === 'task') {
      moveTask(item.taskId, 'concluido');
    } else if (item.kind === 'habito') {
      votar(item.habitoId);
    }
  };

  const startEditSlot = (slotIndex: number) => {
    setEditingSlotIndex(slotIndex);
    setEditingSlotDraft(vitoriasHoje[slotIndex] ?? { origem: 'manual', texto: '' });
  };

  const cancelEditSlot = () => {
    setEditingSlotIndex(null);
    setEditingSlotDraft(null);
  };

  const saveEditSlot = () => {
    if (editingSlotIndex === null || !editingSlotDraft) return;
    const novo = [...vitoriasHoje];
    novo[editingSlotIndex] = editingSlotDraft;
    rituaisStore.atualizarVitorias(hojeStr, novo);
    cancelEditSlot();
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
          {dataExtensa}
          {minutosFocoHoje > 0 && (
            <span style={{ textTransform: 'none', letterSpacing: '0.02em', fontWeight: 500, color: 'var(--char-soft)', marginLeft: 12 }}>
              ◷ foco hoje: <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{formatarMinutos(minutosFocoHoje)}</strong>
            </span>
          )}
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

          {registroManha && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>
                Energia
              </div>
              <EnergyScale value={registroManha.energia} readOnly />
            </div>
          )}
        </div>
      </div>

      {/* ── INTENTION BAR + VOTOS DE HOJE ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 20,
        marginBottom: 24,
      }}>
        {registroManha?.intencao ? (
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
              &ldquo;{registroManha.intencao}&rdquo;
            </p>
          </div>
        ) : (
          <button
            onClick={() => setRitualAberto('morning')}
            style={{ paddingLeft: 16, borderLeft: '2.5px solid rgba(27,54,93,0.25)', textAlign: 'left', cursor: 'pointer' }}
          >
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--char-mute)',
              marginBottom: 4,
            }}>
              Intenção do Dia
            </div>
            <p className="serif" style={{
              fontSize: 15,
              fontStyle: 'italic',
              color: 'var(--char-mute)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              sem intenção ainda — fazer o ritual da manhã →
            </p>
          </button>
        )}

        {habitos.length > 0 && <StreakSummaryInline habitos={habitosHoje} />}
      </div>

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
            {ordenarHabitosDoDia(habitos, hojeStr, nutridoMap)
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
                      {agendado && h.horario && (
                        <span style={{ fontSize: 11.5, fontWeight: 700, opacity: votado ? 0.85 : 0.7 }}>
                          {h.horario}
                        </span>
                      )}
                      {agendado && !h.horario && (nutridoMap[h.areaId] ?? 1) < LIMIAR_AREA_NEGLIGENCIADA && (
                        <span title="área em baixa" style={{ display: 'flex', alignItems: 'center', opacity: votado ? 0.6 : 1 }}>
                          <IcAlert size={17} stroke="var(--hanko)" sw={2.2} />
                        </span>
                      )}
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

            {!registroManha && (
              <div style={{
                padding: '14px 16px', borderRadius: 6, marginBottom: 12,
                border: '1px dashed rgba(27,54,93,0.2)', background: 'rgba(255,255,255,0.5)',
              }}>
                <p style={{ fontSize: 13, color: 'var(--char-soft)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  Suas 3 prioridades de hoje nascem no ritual da manhã.
                </p>
                <button
                  onClick={() => setRitualAberto('morning')}
                  style={{ padding: '7px 14px', background: 'var(--ink)', color: 'var(--washi)', borderRadius: 5, fontSize: 12, fontWeight: 500 }}
                >
                  Fazer o ritual da manhã
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prioridadeItems.length === 0 && registroManha && (
                <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
                  nada puxando a atenção agora — dia livre
                </p>
              )}
              {prioridadeItems.map((item, idx) => {
                const editavel = item.slotIndex !== undefined;

                if (editavel && editingSlotIndex === item.slotIndex && editingSlotDraft) {
                  const podeSalvar =
                    (editingSlotDraft.origem === 'manual' && !!editingSlotDraft.texto?.trim()) ||
                    (editingSlotDraft.origem === 'evento' && !!editingSlotDraft.eventoId) ||
                    (editingSlotDraft.origem === 'task' && !!editingSlotDraft.taskId) ||
                    (editingSlotDraft.origem === 'habito' && !!editingSlotDraft.habitoId);

                  return (
                    <div key={item.id} style={{
                      padding: '12px 14px', borderRadius: 6,
                      border: '1px solid rgba(27,54,93,0.15)', background: 'rgba(255,255,255,0.7)',
                    }}>
                      <PrioridadeSlotEditor
                        value={editingSlotDraft}
                        onChange={setEditingSlotDraft}
                        hoje={hojeStr}
                        eventos={events}
                        tasks={tasks}
                        projects={projects}
                        habitos={habitos}
                        autoFocus
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
                        <button onClick={cancelEditSlot} style={{ fontSize: 12, color: 'var(--char-mute)', padding: '5px 8px' }}>
                          cancelar
                        </button>
                        <button
                          disabled={!podeSalvar}
                          onClick={saveEditSlot}
                          style={{
                            padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 4,
                            background: podeSalvar ? 'var(--ink)' : 'rgba(27,54,93,0.2)',
                            color: 'var(--washi)',
                            cursor: podeSalvar ? 'pointer' : 'default',
                          }}
                        >
                          salvar
                        </button>
                      </div>
                    </div>
                  );
                }

                const showEditButton = editavel && hoveredPrioridadeId === item.id;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => editavel && setHoveredPrioridadeId(item.id)}
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
                            : 'prioridade do dia'}
                        </span>
                      </div>
                    </div>

                    {showEditButton ? (
                      <button
                        onClick={() => startEditSlot(item.slotIndex!)}
                        title="editar"
                        style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--char-mute)', flexShrink: 0 }}
                      >
                        <IcEdit size={13} stroke="var(--char-mute)" />
                      </button>
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
          </div>
        </div>
      </div>

      {/* ── PROJETOS — atividades com prazo hoje + sugestões pra avançar outros projetos ── */}
      <div style={{ marginBottom: 36 }}>
        <SectionTitle kicker="Trabalho" title="Projetos" jp="計画" />
        {projects.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
            nenhum projeto criado ainda — vá na aba Projetos pra começar
          </p>
        ) : atividadesProjetoHoje.length === 0 && sugestoesProjeto.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
            nada com prazo hoje e nenhuma tarefa em aberto — dia livre nos projetos
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: atividadesProjetoHoje.length > 0 && sugestoesProjeto.length > 0 ? '1fr 1fr' : '1fr',
            gap: 24,
          }}>
            {atividadesProjetoHoje.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 10 }}>
                  Hoje
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {atividadesProjetoHoje.map(t => {
                    const atrasada = t.dueDate! < hojeStr;
                    return (
                      <ProjectTaskRow
                        key={t.id}
                        task={t}
                        project={projectOf(t.projectId)}
                        statusLabel={t.status === 'concluido' ? 'concluída' : (atrasada ? 'atrasada' : 'hoje')}
                        statusColor={t.status === 'concluido' ? 'var(--moss)' : (atrasada ? 'var(--hanko)' : undefined)}
                        onToggle={() => moveTask(t.id, t.status === 'concluido' ? 'a_fazer' : 'concluido')}
                        onOpen={() => { const p = projectOf(t.projectId); if (p) onAbrirProjeto(p); }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
            {sugestoesProjeto.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 10 }}>
                  Sugestões pra hoje
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sugestoesProjeto.map(t => (
                    <ProjectTaskRow
                      key={t.id}
                      task={t}
                      project={projectOf(t.projectId)}
                      statusLabel={t.status === 'concluido' ? 'concluída' : (t.dueDate ? `prazo ${formatDueLabel(t.dueDate)}` : undefined)}
                      statusColor={t.status === 'concluido' ? 'var(--moss)' : undefined}
                      onToggle={() => moveTask(t.id, t.status === 'concluido' ? 'a_fazer' : 'concluido')}
                      onOpen={() => { const p = projectOf(t.projectId); if (p) onAbrirProjeto(p); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── OBJETIVOS — progresso dos objetivos ativos ── */}
      <div style={{ marginBottom: 36 }}>
        <SectionTitle kicker="Direção" title="Objetivos" jp="目標" />
        {objetivosVisao.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
            nenhum objetivo ativo ainda — crie um na aba Objetivos pra acompanhar o progresso aqui
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {objetivosVisao.map(({ objetivo, concluidas, total, progresso }) => {
              const area = AREAS.find(a => a.id === objetivo.areaId);
              const color = area?.color ?? 'var(--ink)';
              const concluido = total > 0 && concluidas === total;
              return (
                <div
                  key={objetivo.id}
                  onClick={onIrParaObjetivos}
                  style={{
                    cursor: 'pointer',
                    padding: '14px 16px',
                    borderRadius: 6,
                    border: '1px solid rgba(27,54,93,0.1)',
                    borderLeft: `3px solid ${color}`,
                    background: 'rgba(255,255,255,0.6)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="serif" style={{ fontSize: 14.5, color: 'var(--ink)', fontWeight: 500, fontStyle: 'italic', flex: 1, minWidth: 0 }}>
                      {objetivo.titulo}
                    </span>
                    {area && <AreaBadge areaId={area.id} small />}
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(27,54,93,0.08)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{
                      height: '100%',
                      width: `${progresso * 100}%`,
                      background: concluido ? 'var(--moss)' : color,
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>
                    {total === 0 ? 'nenhuma meta ainda' : `${concluidas}/${total} metas concluídas`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Check-in/out card ── */}
      <div style={{ maxWidth: 480 }}>
        <SectionTitle
          kicker={isEvening ? 'Encerramento' : 'Abertura'}
          title={isEvening ? 'Reflexão' : 'Ritual'}
          jp={isEvening ? '振り返り' : '儀式'}
        />
        <CheckInCard
          isEvening={isEvening}
          feito={isEvening ? !!registroNoite : !!registroManha}
          onAbrirRitual={() => setRitualAberto(isEvening ? 'evening' : 'morning')}
        />
      </div>

      {ritualAberto && (
        <RitualForm
          kind={ritualAberto}
          onClose={() => setRitualAberto(null)}
          onSubmit={(respostas: RitualRespostas) => {
            rituaisStore.salvarRitual({ data: hojeStr, tipo: ritualAberto === 'morning' ? 'manha' : 'noite', ...respostas });
            setRitualAberto(null);
          }}
          hoje={hojeStr}
          eventos={events}
          tasks={tasks}
          projects={projects}
          habitos={habitos}
        />
      )}
    </div>
  );
}
