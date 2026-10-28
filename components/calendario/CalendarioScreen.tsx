'use client';
import React, { useState } from 'react';
import { useCalendarStore } from '@/lib/calendarStore';
import { useProjectsStore } from '@/lib/projectsStore';
import { EventType, CalendarEvent, SessaoFoco } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { Card } from '@/components/ui/Card';
import { AreaBadge } from '@/components/ui/AreaBadge';
import EventFormModal from './EventFormModal';
import DiaView from './DiaView';

type CalStore = ReturnType<typeof useCalendarStore>;
type ProjStore = ReturnType<typeof useProjectsStore>;

interface Props {
  calendarStore: CalStore;
  projectsStore: ProjStore;
  sessoesFoco?: SessaoFoco[];                 // tempo de foco gravado (faixa "feito" da visão Dia)
  vitoriasTaskIds?: string[];                 // vitórias de hoje — sugestões pra encaixar
  sessaoRodando?: boolean;                    // já tem cronômetro rodando
  onComecarFoco?: (ev: CalendarEvent) => void; // "Começar foco agora" num bloco
}

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAY_PT = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

const getCalendarDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Date[] = [];
  // Days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }
  // Days to complete 6 weeks (42 cells)
  while (days.length < 42) {
    days.push(new Date(year, month + 1, days.length - firstDay - daysInMonth + 1));
  }
  return days;
};

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const TYPE_LABEL: Record<EventType, string> = {
  evento: 'Evento',
  comemoracao: 'Comemoração',
  lembrete: 'Lembrete',
  foco: 'Bloco de foco',
};

interface TaskItem {
  id: string;
  title: string;
  date: string;
  type: EventType;
  color: string;
  areaId?: string;
  isTask: boolean;
  taskDone: boolean;
}

export default function CalendarioScreen({ calendarStore, projectsStore, sessoesFoco = [], vitoriasTaskIds = [], sessaoRodando = false, onComecarFoco }: Props) {
  const today = new Date();
  const todayStr = toDateStr(today);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [filterArea, setFilterArea] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modo, setModo] = useState<'mes' | 'dia'>('mes');

  // Visão Dia anda de dia em dia — e mantém o mês do calendário acompanhando.
  const diaAberto = selectedDate ?? todayStr;
  const irParaDia = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    setSelectedDate(dateStr);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };
  const andarDia = (delta: number) => {
    const d = new Date(diaAberto + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    irParaDia(toDateStr(d));
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  // Build task events
  const taskEvents: TaskItem[] = projectsStore.tasks
    .filter(t => t.dueDate)
    .map(t => {
      const proj = projectsStore.projects.find(p => p.id === t.projectId);
      return {
        id: 'task-' + t.id,
        title: t.title,
        date: t.dueDate!,
        type: 'lembrete' as EventType,
        color: proj?.color ?? 'var(--ink)',
        areaId: proj?.areaId,
        isTask: true,
        taskDone: t.status === 'concluido',
      };
    });

  // Filter logic — a task não guarda areaId direto, herda do projeto (calculado acima).
  const filteredCalEvents = calendarStore.events.filter(e => !filterArea || e.areaId === filterArea);
  const filteredTaskEvents = taskEvents.filter(t => !filterArea || t.areaId === filterArea);

  const allFilteredItems = [
    ...filteredCalEvents.map(e => ({
      ...e,
      // Bloco de foco leva a cor do projeto da tarefa.
      color: e.type === 'foco' ? projectsStore.projects.find(p => p.id === e.projectId)?.color ?? 'var(--char-mute)' : e.color,
      isTask: false,
      taskDone: false,
    })),
    ...filteredTaskEvents,
  ];

  const getItemsForDate = (dateStr: string) => {
    return allFilteredItems.filter(e => {
      if ('endDate' in e && e.endDate) {
        return e.date <= dateStr && e.endDate >= dateStr;
      }
      return e.date === dateStr;
    });
  };

  const days = getCalendarDays(currentYear, currentMonth);

  // Selected day events
  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : [];
  const selectedCalEvents = selectedDate
    ? calendarStore.events.filter(e => {
        if (e.endDate) return e.date <= selectedDate && e.endDate >= selectedDate;
        return e.date === selectedDate;
      }).filter(e => !filterArea || e.areaId === filterArea)
    : [];

  const handleSave = (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEvent) {
      calendarStore.updateEvent(editingEvent.id, data);
      setEditingEvent(null);
    } else {
      calendarStore.createEvent(data);
    }
    setShowModal(false);
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    calendarStore.deleteEvent(id);
  };

  const formatSelectedDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const dow = WEEKDAY_PT[d.getDay()];
    const day = d.getDate();
    const month = MONTHS_PT[d.getMonth()].toLowerCase();
    return `${dow}, ${day} de ${month}`;
  };

  return (
    <div style={{ padding: '32px 48px 60px', maxWidth: 1200 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{
            fontSize: 10,
            color: 'var(--char-mute)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            seus compromissos
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 38,
              color: 'var(--ink)',
              margin: 0,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            Calendário
            <span className="jp" style={{ fontSize: 28, color: 'var(--char-mute)', fontWeight: 400, opacity: 0.65 }}>暦</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Mês | Dia */}
        <div style={{ display: 'inline-flex', border: '1px solid var(--card-border)', borderRadius: 16, overflow: 'hidden' }}>
          {(['mes', 'dia'] as const).map(m => (
            <button
              key={m}
              onClick={() => setModo(m)}
              style={{
                padding: '6px 14px', fontSize: 12.5, fontWeight: 500,
                background: modo === m ? 'var(--ink)' : 'var(--card-bg)',
                color: modo === m ? 'var(--washi)' : 'var(--char-soft)',
              }}
            >
              {m === 'mes' ? 'Mês' : 'Dia'}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditingEvent(null); setShowModal(true); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 18px',
            background: 'var(--ink)',
            color: 'white',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          + Evento
        </button>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4, marginBottom: 24 }}>
        <button
          onClick={() => setFilterArea(null)}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            border: !filterArea ? 'none' : '1px solid var(--card-border)',
            background: !filterArea ? 'var(--ink)' : 'var(--card-bg)',
            color: !filterArea ? 'white' : 'var(--char-soft)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Todos
        </button>
        {AREAS.map(area => {
          const active = filterArea === area.id;
          return (
            <button
              key={area.id}
              onClick={() => setFilterArea(active ? null : area.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                border: active ? 'none' : '1px solid var(--card-border)',
                background: active ? area.color : 'var(--card-bg)',
                color: active ? 'white' : 'var(--char-soft)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: active ? 'rgba(255,255,255,0.8)' : area.color,
                flexShrink: 0,
              }} />
              {area.name}
            </button>
          );
        })}
      </div>

      {modo === 'mes' ? (<>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={prevMonth}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: 'var(--char-soft)',
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)',
              cursor: 'pointer',
            }}
          >
            ‹
          </button>
          <button
            onClick={nextMonth}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: 'var(--char-soft)',
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)',
              cursor: 'pointer',
            }}
          >
            ›
          </button>
        </div>
        <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', fontWeight: 500 }}>
          {MONTHS_PT[currentMonth]} {currentYear}
        </div>
        <button
          onClick={goToday}
          style={{
            padding: '5px 14px',
            borderRadius: 4,
            fontSize: 12,
            color: 'var(--char-soft)',
            border: '1px solid var(--card-border)',
            background: 'var(--card-bg)',
            cursor: 'pointer',
          }}
        >
          Hoje
        </button>
      </div>

      {/* Calendar grid */}
      <div>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 1 }}>
          {DAYS_SHORT.map(d => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: 10,
                color: 'var(--char-mute)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '6px 0',
                fontWeight: 500,
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
          background: 'var(--card-border)',
          border: '1px solid var(--card-border)',
          borderRadius: 6,
          overflow: 'hidden',
        }}>
          {days.map((day, idx) => {
            const dateStr = toDateStr(day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const isPast = dateStr < todayStr;
            const items = getItemsForDate(dateStr);
            const visible = items.slice(0, 3);
            const extra = items.length - 3;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (isSelected) {
                    setEditingEvent(null);
                    setShowModal(true);
                  } else {
                    setSelectedDate(dateStr);
                  }
                }}
                style={{
                  background: isSelected
                    ? 'rgba(27,54,93,0.06)'
                    : isToday
                    ? 'rgba(27,54,93,0.07)'
                    : 'var(--card-bg)',
                  height: 110,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  position: 'relative',
                  opacity: isCurrentMonth ? 1 : 0.35,
                  boxShadow: isToday ? 'inset 0 0 0 2px var(--ink)' : 'none',
                  transition: 'background 0.1s',
                  overflow: 'hidden',
                }}
              >
                {/* Past day overlay — darkens already-passed days for quick scanning */}
                {isPast && !isSelected && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.05)',
                    pointerEvents: 'none',
                  }} />
                )}
                {isToday && (
                  <span style={{
                    position: 'absolute',
                    top: 6,
                    left: 8,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink)',
                  }}>
                    hoje
                  </span>
                )}
                {/* Day number */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: 4,
                }}>
                  <span style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: isToday ? 600 : 400,
                    background: isToday ? 'var(--ink)' : 'transparent',
                    color: isToday ? 'white' : isPast ? 'var(--char-mute)' : 'var(--char)',
                  }}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Event pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                  {visible.map(item => (
                    <div
                      key={item.id}
                      style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 3,
                        background: `${item.color}22`,
                        color: item.color,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        minWidth: 0,
                      }}
                      title={item.title}
                    >
                      {item.isTask ? '✓ ' : item.type === 'foco' ? '◷ ' : ''}{item.title}
                    </div>
                  ))}
                  {extra > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--char-mute)', paddingLeft: 4 }}>
                      +{extra} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events panel */}
      {selectedDate && (
        <div style={{ marginTop: 24 }}>
          <div
            className="serif"
            style={{
              fontSize: 18,
              color: 'var(--ink)',
              fontStyle: 'italic',
              marginBottom: 14,
              fontWeight: 500,
            }}
          >
            {formatSelectedDate(selectedDate)}
          </div>

          {selectedItems.length === 0 && (
            <div style={{ fontSize: 14, color: 'var(--char-mute)', fontStyle: 'italic' }}>
              Nenhum evento neste dia
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedCalEvents.map(event => (
              <Card
                key={event.id}
                style={{
                  padding: '14px 16px',
                  borderLeft: `3px solid ${event.color ?? 'var(--ink)'}`,
                  borderRadius: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title */}
                    <div style={{ fontSize: 14, color: 'var(--char)', fontWeight: 500, marginBottom: 6 }}>
                      {event.title}
                    </div>

                    {/* Type + time + location row */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: event.areaId ? 8 : 0 }}>
                      <span style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: `${event.color ?? '#1B365D'}18`,
                        color: event.color ?? 'var(--ink)',
                        fontWeight: 500,
                      }}>
                        {TYPE_LABEL[event.type]}
                      </span>
                      {event.time && (
                        <span style={{ fontSize: 12, color: 'var(--char-mute)' }}>
                          {event.time}
                        </span>
                      )}
                      {event.location && (
                        <span style={{ fontSize: 12, color: 'var(--char-soft)' }}>
                          · {event.location}
                        </span>
                      )}
                    </div>

                    {/* Area badge */}
                    {event.areaId && (
                      <AreaBadge areaId={event.areaId} small />
                    )}

                    {/* Description */}
                    {event.description && (
                      <div style={{ fontSize: 12, color: 'var(--char-soft)', marginTop: 6, lineHeight: 1.5 }}>
                        {event.description}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => handleEdit(event)}
                      title="Editar"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        color: 'var(--char-mute)',
                        border: '1px solid var(--card-border)',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      title="Excluir"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        color: 'var(--char-mute)',
                        border: '1px solid var(--card-border)',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Task items for the day */}
            {!filterArea && taskEvents.filter(t => t.date === selectedDate).map(task => (
              <Card
                key={task.id}
                style={{
                  padding: '14px 16px',
                  borderLeft: `3px solid ${task.color}`,
                  borderRadius: 6,
                  opacity: task.taskDone ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: task.color, fontWeight: 600, flexShrink: 0 }}>✓</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      color: 'var(--char)',
                      fontWeight: 500,
                      textDecoration: task.taskDone ? 'line-through' : 'none',
                    }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--char-mute)', marginTop: 2 }}>
                      Tarefa
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      </>) : (<>
      {/* Visão Dia: navegação de dia em dia + linha do tempo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {[-1, 1].map(delta => (
          <button
            key={delta}
            onClick={() => andarDia(delta)}
            aria-label={delta < 0 ? 'dia anterior' : 'próximo dia'}
            style={{
              width: 32, height: 32, borderRadius: '50%', fontSize: 18, color: 'var(--char-soft)',
              border: '1px solid var(--card-border)', background: 'var(--card-bg)', order: delta < 0 ? 0 : 2,
            }}
          >
            {delta < 0 ? '‹' : '›'}
          </button>
        ))}
        <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', fontWeight: 500, order: 1 }}>
          {formatSelectedDate(diaAberto)}
        </div>
        {diaAberto !== todayStr && (
          <button
            onClick={() => irParaDia(todayStr)}
            style={{ order: 3, padding: '5px 14px', borderRadius: 4, fontSize: 12, color: 'var(--char-soft)', border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}
          >
            Hoje
          </button>
        )}
      </div>
      <DiaView
        data={diaAberto}
        hoje={todayStr}
        eventos={filteredCalEvents}
        tasks={projectsStore.tasks}
        projects={projectsStore.projects}
        sessoesFoco={sessoesFoco}
        vitoriasTaskIds={vitoriasTaskIds}
        sessaoRodando={sessaoRodando}
        onCriar={calendarStore.createEvent}
        onAtualizar={calendarStore.updateEvent}
        onApagar={calendarStore.deleteEvent}
        onEditarEvento={handleEdit}
        onComecarFoco={ev => onComecarFoco?.(ev)}
      />

      </>)}

      {/* Modal */}
      {showModal && (
        <EventFormModal
          event={editingEvent ?? undefined}
          initialDate={selectedDate ?? undefined}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
