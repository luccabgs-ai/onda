'use client';
import React, { useState } from 'react';
import { Habito, Objetivo } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { IcClose } from '@/components/ui/icons';

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

interface ObjetivoFormModalProps {
  objetivo?: Objetivo;
  habitos: Habito[];
  onClose: () => void;
  onSave: (data: { titulo: string; descricao?: string; areaId?: string; habitoIds: string[] }) => void;
}

export default function ObjetivoFormModal({ objetivo, habitos, onClose, onSave }: ObjetivoFormModalProps) {
  const isEdit = !!objetivo;
  const [titulo, setTitulo] = useState(objetivo?.titulo ?? '');
  const [descricao, setDescricao] = useState(objetivo?.descricao ?? '');
  const [areaId, setAreaId] = useState(objetivo?.areaId ?? '');
  const [habitoIds, setHabitoIds] = useState<string[]>(objetivo?.habitoIds ?? []);

  const canSave = titulo.trim().length > 0;

  const toggleHabito = (id: string) => {
    setHabitoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({ titulo: titulo.trim(), descricao: descricao.trim() || undefined, areaId: areaId || undefined, habitoIds });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,38,74,0.42)',
        backdropFilter: 'blur(3px)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px -15px rgba(20,38,74,0.40)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(27,54,93,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(245,239,224,0.5)',
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--char-mute)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {isEdit ? 'editar objetivo' : 'novo objetivo'}
            </div>
            <h3 className="serif" style={{ fontSize: 18, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
              {isEdit ? objetivo.titulo : 'Criar objetivo'}
            </h3>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid rgba(27,54,93,0.10)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--char-soft)' }}>
            <IcClose size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Título *
            </label>
            <input
              autoFocus
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="ex: Ser um corredor de longa distância"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Descrição — opcional
            </label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="por que esse objetivo importa pra você…"
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          {/* Area */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Área da vida — opcional
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button
                onClick={() => setAreaId('')}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                  border: !areaId ? 'none' : '1px solid rgba(27,54,93,0.18)',
                  background: !areaId ? 'var(--ink)' : 'transparent',
                  color: !areaId ? 'white' : 'var(--char-soft)',
                  cursor: 'pointer', transition: 'all 0.12s',
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
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                      border: active ? 'none' : '1px solid rgba(27,54,93,0.18)',
                      background: active ? area.color : 'transparent',
                      color: active ? 'white' : 'var(--char-soft)',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.8)' : area.color, flexShrink: 0 }} />
                    {area.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hábitos vinculados */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Hábitos vinculados — opcional
            </label>
            <p style={{ fontSize: 11.5, color: 'var(--char-mute)', margin: '0 0 10px', lineHeight: 1.5 }}>
              Pode escolher mais de um. Só hábitos vinculados aqui podem alimentar o progresso automático de uma Meta.
            </p>
            {habitos.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
                nenhum hábito criado ainda
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {habitos.map(h => {
                  const active = habitoIds.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleHabito(h.id)}
                      style={{
                        padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                        border: active ? 'none' : '1px solid rgba(27,54,93,0.18)',
                        background: active ? 'var(--ink)' : 'transparent',
                        color: active ? 'white' : 'var(--char-soft)',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}
                    >
                      {h.acao}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(27,54,93,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, color: 'var(--char-mute)', borderRadius: 4, border: '1px solid rgba(27,54,93,0.12)' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: '8px 18px',
              background: canSave ? 'var(--ink)' : 'rgba(27,54,93,0.25)',
              color: 'var(--washi)', borderRadius: 4, fontSize: 13, fontWeight: 500,
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {isEdit ? 'Salvar' : 'Criar objetivo'}
          </button>
        </div>
      </div>
    </div>
  );
}
