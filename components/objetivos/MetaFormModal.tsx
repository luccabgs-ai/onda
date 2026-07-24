'use client';
import React, { useState } from 'react';
import { Habito, Meta, MetaRastreio, Objetivo } from '@/lib/types';
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

interface MetaFormModalProps {
  objetivo: Objetivo;
  habitosVinculados: Habito[];
  meta?: Meta;
  onClose: () => void;
  onSave: (data: {
    titulo: string;
    unidade?: string;
    valorAlvo: number;
    rastreio: MetaRastreio;
    habitoId?: string;
    valorManual?: number;
    prazo?: string;
  }) => void;
}

export default function MetaFormModal({ objetivo, habitosVinculados, meta, onClose, onSave }: MetaFormModalProps) {
  const isEdit = !!meta;
  const [titulo, setTitulo] = useState(meta?.titulo ?? '');
  const [unidade, setUnidade] = useState(meta?.unidade ?? 'vezes');
  const [valorAlvo, setValorAlvo] = useState(meta?.valorAlvo ?? 10);
  const [rastreio, setRastreio] = useState<MetaRastreio>(meta?.rastreio ?? (habitosVinculados.length > 0 ? 'habito' : 'manual'));
  const [habitoId, setHabitoId] = useState<string | undefined>(meta?.habitoId ?? habitosVinculados[0]?.id);
  const [valorManualInicial, setValorManualInicial] = useState(meta?.valorManual ?? 0);
  const [prazo, setPrazo] = useState(meta?.prazo ?? '');

  const canSave = titulo.trim().length > 0 && valorAlvo > 0 && (rastreio === 'manual' || !!habitoId);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      titulo: titulo.trim(),
      unidade: unidade.trim() || undefined,
      valorAlvo,
      rastreio,
      habitoId: rastreio === 'habito' ? habitoId : undefined,
      valorManual: rastreio === 'manual' ? valorManualInicial : undefined,
      prazo: prazo || undefined,
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,38,74,0.42)',
        backdropFilter: 'blur(3px)',
        zIndex: 55,
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
          width: 'min(460px, 100%)',
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
              {objetivo.titulo}
            </div>
            <h3 className="serif" style={{ fontSize: 18, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
              {isEdit ? 'Editar meta' : 'Nova meta'}
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
              placeholder="ex: Correr 40x até o fim do ano"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Alvo
              </label>
              <input
                type="number"
                min={1}
                value={valorAlvo}
                onChange={e => setValorAlvo(Math.max(1, Number(e.target.value)))}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Unidade
              </label>
              <input
                value={unidade}
                onChange={e => setUnidade(e.target.value)}
                placeholder="vezes, km, kg…"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Prazo — opcional
            </label>
            <input
              type="date"
              value={prazo}
              onChange={e => setPrazo(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'light' }}
            />
          </div>

          {/* Rastreio */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Como o progresso é contado
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setRastreio('habito')}
                disabled={habitosVinculados.length === 0}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 6, textAlign: 'left',
                  border: rastreio === 'habito' ? '1.5px solid var(--ink)' : '1px solid rgba(27,54,93,0.15)',
                  background: rastreio === 'habito' ? 'rgba(27,54,93,0.05)' : 'transparent',
                  opacity: habitosVinculados.length === 0 ? 0.45 : 1,
                  cursor: habitosVinculados.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--char)', fontWeight: 500 }}>Por hábito</div>
                <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>
                  {habitosVinculados.length === 0 ? 'vincule um hábito ao objetivo primeiro' : 'conta os votos automaticamente'}
                </div>
              </button>
              <button
                onClick={() => setRastreio('manual')}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 6, textAlign: 'left',
                  border: rastreio === 'manual' ? '1.5px solid var(--ink)' : '1px solid rgba(27,54,93,0.15)',
                  background: rastreio === 'manual' ? 'rgba(27,54,93,0.05)' : 'transparent',
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--char)', fontWeight: 500 }}>Manual</div>
                <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>você mesmo atualiza o valor</div>
              </button>
            </div>

            {rastreio === 'habito' && habitosVinculados.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {habitosVinculados.map(h => {
                  const active = habitoId === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => setHabitoId(h.id)}
                      style={{
                        padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 500,
                        border: active ? 'none' : '1px solid rgba(27,54,93,0.18)',
                        background: active ? 'var(--ink)' : 'transparent',
                        color: active ? 'var(--washi)' : 'var(--char-soft)',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}
                    >
                      {h.acao}
                    </button>
                  );
                })}
              </div>
            )}

            {rastreio === 'manual' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)', marginBottom: 6 }}>
                  Valor inicial
                </label>
                <input
                  type="number"
                  min={0}
                  value={valorManualInicial}
                  onChange={e => setValorManualInicial(Math.max(0, Number(e.target.value)))}
                  style={{ ...inputStyle, maxWidth: 140 }}
                />
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
            {isEdit ? 'Salvar' : 'Criar meta'}
          </button>
        </div>
      </div>
    </div>
  );
}
