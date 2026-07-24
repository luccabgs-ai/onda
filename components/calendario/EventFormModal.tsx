'use client';
import React, { useState } from 'react';
import { CalendarEvent, EventType } from '@/lib/types';
import { AREAS } from '@/lib/data';

interface Props {
  event?: CalendarEvent;
  initialDate?: string;
  onClose: () => void;
  onSave: (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.5)',
  border: '1px solid rgba(27,54,93,0.15)',
  borderRadius: 5,
  fontSize: 13,
  color: 'var(--char)',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const MANUAL_COLORS = ['#1B365D', '#3E6B94', '#6E7F5A', '#C5483A', '#D4B896', '#7E9CB8'];

const TYPE_LABELS: { value: EventType; label: string }[] = [
  { value: 'evento', label: 'Evento' },
  { value: 'comemoracao', label: 'Comemoração' },
  { value: 'lembrete', label: 'Lembrete' },
];

export default function EventFormModal({ event, initialDate, onClose, onSave }: Props) {
  const [title, setTitle] = useState(event?.title ?? '');
  const [type, setType] = useState<EventType>(event?.type ?? 'evento');
  const [date, setDate] = useState(event?.date ?? initialDate ?? '');
  const [time, setTime] = useState(event?.time ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [areaId, setAreaId] = useState(event?.areaId ?? '');
  const [manualColor, setManualColor] = useState(event?.color ?? '#1B365D');

  const selectedArea = AREAS.find(a => a.id === areaId);
  const effectiveColor = selectedArea ? selectedArea.color : manualColor;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      type,
      date,
      color: effectiveColor,
    };
    if (time && type !== 'comemoracao') data.time = time;
    if (location.trim()) data.location = location.trim();
    if (description.trim()) data.description = description.trim();
    if (areaId) data.areaId = areaId;
    if (event?.projectId) data.projectId = event.projectId;

    onSave(data);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,38,74,0.42)',
        backdropFilter: 'blur(3px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--washi)',
          border: '1px solid rgba(27,54,93,0.18)',
          borderRadius: 8,
          width: 'min(560px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '18px 20px',
          borderBottom: '1px solid rgba(27,54,93,0.10)',
          gap: 12,
        }}>
          <div style={{
            width: 4,
            height: 36,
            borderRadius: 2,
            background: effectiveColor,
            flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--char-mute)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
              {event ? 'editar evento' : 'novo evento'}
            </div>
            <div className="serif" style={{ fontSize: 18, color: 'var(--ink)', fontWeight: 500 }}>
              {event ? 'Editar evento' : 'Novo evento'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: 'var(--char-mute)',
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6 }}>
              Nome do evento *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nome do evento"
              required
              style={inputStyle}
            />
          </div>

          {/* Type chips */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>
              Tipo
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TYPE_LABELS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 500,
                    border: type === t.value ? 'none' : '1px solid rgba(27,54,93,0.20)',
                    background: type === t.value ? 'var(--ink)' : 'transparent',
                    color: type === t.value ? 'white' : 'var(--char-soft)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Time row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6 }}>
                Data *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            {type !== 'comemoracao' && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Horário
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6 }}>
              Local
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Local ou link"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6 }}>
              Descrição
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Area */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6 }}>
              Área
            </label>
            <select
              value={areaId}
              onChange={e => setAreaId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— Nenhuma área —</option>
              {AREAS.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>

          {/* Color (only when no area selected) */}
          {!areaId && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>
                Cor
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {MANUAL_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setManualColor(c)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: c,
                      border: manualColor === c ? '3px solid var(--char)' : '2px solid transparent',
                      outline: manualColor === c ? `2px solid ${c}` : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid rgba(27,54,93,0.08)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                fontSize: 13,
                color: 'var(--char-soft)',
                borderRadius: 4,
              }}
            >
              cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 20px',
                background: 'var(--ink)',
                color: 'white',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
