'use client';
import React, { useState } from 'react';
import { CalendarEvent, Habito, PrioridadeOrigem, PrioridadeRitual, Project, Task } from '@/lib/types';
import { estaAgendadoEm } from '@/lib/nutricao';

const TABS: { id: PrioridadeOrigem; label: string }[] = [
  { id: 'manual', label: 'Escrever' },
  { id: 'evento', label: 'Evento' },
  { id: 'task', label: 'Tarefa' },
  { id: 'habito', label: 'Hábito' },
];

const pickerButtonStyle = (ativo: boolean): React.CSSProperties => ({
  textAlign: 'left',
  padding: '7px 10px',
  borderRadius: 4,
  fontSize: 12.5,
  color: 'var(--char)',
  background: ativo ? 'rgba(27,54,93,0.09)' : 'transparent',
  fontWeight: ativo ? 500 : 400,
});

interface PrioridadeSlotEditorProps {
  value: PrioridadeRitual;
  onChange: (v: PrioridadeRitual) => void;
  hoje: string;
  eventos: CalendarEvent[];
  tasks: Task[];
  projects: Project[];
  habitos: Habito[];
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Editor de uma das 3 prioridades do dia: escrever manualmente, ou escolher um evento do
 * calendário, uma tarefa aberta de um projeto, ou um hábito agendado hoje. Usado tanto dentro
 * do passo "3 prioridades" do ritual da manhã quanto na edição inline da tela Hoje.
 */
export default function PrioridadeSlotEditor({
  value, onChange, hoje, eventos, tasks, projects, habitos, placeholder, autoFocus,
}: PrioridadeSlotEditorProps) {
  const [tab, setTab] = useState<PrioridadeOrigem>(value.origem);

  const eventosHoje = eventos.filter(e => e.date <= hoje && (e.endDate ?? e.date) >= hoje);
  const tasksAbertas = tasks.filter(t => t.status !== 'concluido');
  const habitosHoje = habitos.filter(h => estaAgendadoEm(h, hoje));

  const nomeDoProjeto = (projectId: string) => projects.find(p => p.id === projectId)?.title ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '4px 11px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 500,
              background: tab === t.id ? 'var(--ink)' : 'transparent',
              color: tab === t.id ? 'var(--washi)' : 'var(--char-soft)',
              border: tab === t.id ? 'none' : '1px solid rgba(27,54,93,0.18)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'manual' && (
        <input
          autoFocus={autoFocus}
          value={value.origem === 'manual' ? value.texto ?? '' : ''}
          onChange={e => onChange({ origem: 'manual', texto: e.target.value, done: value.done })}
          placeholder={placeholder ?? 'o que precisa entrar na lista de hoje?'}
          style={{
            width: '100%', border: 'none', borderBottom: '1px solid rgba(27,54,93,0.15)', background: 'transparent',
            fontSize: 13.5, color: 'var(--char)', fontFamily: 'inherit', padding: '6px 2px',
          }}
        />
      )}

      {tab === 'evento' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 160, overflowY: 'auto' }}>
          {eventosHoje.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--char-mute)', fontStyle: 'italic', margin: '4px 2px' }}>nenhum evento hoje</p>
          )}
          {eventosHoje.map(e => (
            <button key={e.id} onClick={() => onChange({ origem: 'evento', eventoId: e.id })} style={pickerButtonStyle(value.eventoId === e.id)}>
              {e.time ? `${e.time} · ` : ''}{e.title}
            </button>
          ))}
        </div>
      )}

      {tab === 'task' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 160, overflowY: 'auto' }}>
          {tasksAbertas.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--char-mute)', fontStyle: 'italic', margin: '4px 2px' }}>nenhuma tarefa aberta</p>
          )}
          {tasksAbertas.map(t => (
            <button key={t.id} onClick={() => onChange({ origem: 'task', taskId: t.id })} style={pickerButtonStyle(value.taskId === t.id)}>
              {t.title}
              <span style={{ color: 'var(--char-mute)', fontSize: 11 }}> · {nomeDoProjeto(t.projectId)}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'habito' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 160, overflowY: 'auto' }}>
          {habitosHoje.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--char-mute)', fontStyle: 'italic', margin: '4px 2px' }}>nenhum hábito agendado hoje</p>
          )}
          {habitosHoje.map(h => (
            <button key={h.id} onClick={() => onChange({ origem: 'habito', habitoId: h.id })} style={pickerButtonStyle(value.habitoId === h.id)}>
              {h.acao}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
