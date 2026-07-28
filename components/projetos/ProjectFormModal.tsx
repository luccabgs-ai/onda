'use client';
import React, { useState } from 'react';
import { Project } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { IcClose } from '@/components/ui/icons';

const PRESET_COLORS = ['#1B365D', '#3E6B94', '#6E7F5A', '#C5483A', '#D4B896', '#7E9CB8', '#5A7390', '#8A7560'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,253,247,0.7)',
  border: '1px solid rgba(27,54,93,0.15)',
  borderRadius: 4,
  fontSize: 14,
  color: 'var(--char)',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

interface ProjectFormModalProps {
  project?: Project;
  onClose: () => void;
  onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function ProjectFormModal({ project, onClose, onSave }: ProjectFormModalProps) {
  const [title, setTitle] = useState(project?.title ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [color, setColor] = useState(project?.color ?? PRESET_COLORS[0]);
  const [areaId, setAreaId] = useState(project?.areaId ?? '');
  const [dueDate, setDueDate] = useState(project?.dueDate ?? '');

  const isEdit = !!project;
  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      color,
      areaId: areaId || undefined,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,38,74,0.42)',
        backdropFilter: 'blur(3px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--washi)',
          border: '1px solid rgba(27,54,93,0.18)',
          borderRadius: 8,
          width: 'min(480px, 100%)',
          boxShadow: '0 20px 60px -15px rgba(20,38,74,0.40)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(27,54,93,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(245,239,224,0.5)',
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--char-mute)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {isEdit ? 'editar projeto' : 'novo projeto'}
            </div>
            <h3 className="serif" style={{ fontSize: 18, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
              {isEdit ? project.title : 'Criar Projeto'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              border: '1px solid rgba(27,54,93,0.10)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--char-soft)',
            }}
          >
            <IcClose size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Título *
            </label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nome do projeto…"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Descrição
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Breve descrição do projeto…"
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          {/* Area */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Área da vida
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button
                onClick={() => setAreaId('')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                  border: !areaId ? 'none' : '1px solid rgba(27,54,93,0.18)',
                  background: !areaId ? 'var(--ink)' : 'transparent',
                  color: !areaId ? 'white' : 'var(--char-soft)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                Nenhuma
              </button>
              {AREAS.map(area => {
                const active = areaId === area.id;
                return (
                  <button
                    key={area.id}
                    onClick={() => setAreaId(area.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      border: active ? 'none' : '1px solid rgba(27,54,93,0.18)',
                      background: active ? area.color : 'transparent',
                      color: active ? 'white' : 'var(--char-soft)',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: active ? 'rgba(255,255,255,0.8)' : area.color,
                      flexShrink: 0,
                    }} />
                    {area.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Prazo
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ ...inputStyle, padding: '8px 12px' }}
            />
          </div>

          {/* Color */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Cor
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: c,
                    border: 'none',
                    cursor: 'pointer',
                    outline: color === c ? `3px solid white` : 'none',
                    boxShadow: color === c ? `0 0 0 5px ${c}` : `0 1px 3px rgba(0,0,0,0.20)`,
                    transition: 'box-shadow 0.15s',
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(27,54,93,0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              color: 'var(--char-mute)',
              borderRadius: 4,
              border: '1px solid rgba(27,54,93,0.12)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: '8px 18px',
              background: canSave ? 'var(--ink)' : 'rgba(27,54,93,0.25)',
              color: 'var(--washi)',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 500,
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {isEdit ? 'Salvar' : 'Criar Projeto'}
          </button>
        </div>
      </div>
    </div>
  );
}
