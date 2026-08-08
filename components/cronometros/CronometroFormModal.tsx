'use client';
import React, { useState } from 'react';
import { CronometroFase, CronometroPreset, Habito } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { duracaoTotalMin } from '@/lib/cronometrosStore';
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

type Modo = 'bloco' | 'pomodoro';

function montarFases(modo: Modo, blocoMin: number, rounds: number, focoMin: number, descansoMin: number): CronometroFase[] {
  if (modo === 'bloco') return [{ tipo: 'foco', minutos: blocoMin }];
  const fases: CronometroFase[] = [];
  for (let i = 0; i < rounds; i++) {
    fases.push({ tipo: 'foco', minutos: focoMin });
    if (i < rounds - 1) fases.push({ tipo: 'descanso', minutos: descansoMin });
  }
  return fases;
}

function formatarDuracao(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

interface CronometroFormModalProps {
  preset?: CronometroPreset;
  habitos: Habito[];
  onClose: () => void;
  onSave: (data: { nome: string; fases: CronometroFase[]; areaId?: string; habitoId?: string }) => void;
}

export default function CronometroFormModal({ preset, habitos, onClose, onSave }: CronometroFormModalProps) {
  const isEdit = !!preset;
  const presetEraPomodoro = preset ? preset.fases.length > 1 : false;

  const [nome, setNome] = useState(preset?.nome ?? '');
  const [modo, setModo] = useState<Modo>(presetEraPomodoro ? 'pomodoro' : 'bloco');
  const [blocoMin, setBlocoMin] = useState(preset && !presetEraPomodoro ? preset.fases[0].minutos : 30);
  const [rounds, setRounds] = useState(presetEraPomodoro ? Math.ceil(preset!.fases.length / 2) : 2);
  const [focoMin, setFocoMin] = useState(presetEraPomodoro ? preset!.fases[0].minutos : 25);
  const [descansoMin, setDescansoMin] = useState(presetEraPomodoro ? (preset!.fases[1]?.minutos ?? 5) : 10);
  const [areaId, setAreaId] = useState(preset?.areaId ?? '');
  const [habitoId, setHabitoId] = useState(preset?.habitoId ?? '');

  const canSave = nome.trim().length > 0 && (modo === 'bloco' ? blocoMin > 0 : rounds > 0 && focoMin > 0 && descansoMin >= 0);
  const fasesPreview = montarFases(modo, blocoMin, rounds, focoMin, descansoMin);
  const totalMin = duracaoTotalMin(fasesPreview);

  const handleSave = () => {
    if (!canSave) return;
    onSave({ nome: nome.trim(), fases: fasesPreview, areaId: areaId || undefined, habitoId: habitoId || undefined });
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
          boxShadow: '0 20px 60px -15px rgba(20,38,74,0.40)',
          overflow: 'hidden',
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
              {isEdit ? 'editar cronômetro' : 'novo cronômetro'}
            </div>
            <h3 className="serif" style={{ fontSize: 18, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
              {isEdit ? preset.nome : 'Criar cronômetro'}
            </h3>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid rgba(27,54,93,0.10)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--char-soft)' }}>
            <IcClose size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Nome */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Nome *
            </label>
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="ex: Estudo de espanhol"
              style={inputStyle}
            />
          </div>

          {/* Modo */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Formato
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setModo('bloco')}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 6, textAlign: 'left',
                  border: modo === 'bloco' ? '1.5px solid var(--ink)' : '1px solid rgba(27,54,93,0.15)',
                  background: modo === 'bloco' ? 'rgba(27,54,93,0.05)' : 'transparent',
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--char)', fontWeight: 500 }}>Bloco único</div>
                <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>um período corrido, sem pausas</div>
              </button>
              <button
                onClick={() => setModo('pomodoro')}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 6, textAlign: 'left',
                  border: modo === 'pomodoro' ? '1.5px solid var(--ink)' : '1px solid rgba(27,54,93,0.15)',
                  background: modo === 'pomodoro' ? 'rgba(27,54,93,0.05)' : 'transparent',
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--char)', fontWeight: 500 }}>Pomodoro</div>
                <div style={{ fontSize: 11, color: 'var(--char-mute)' }}>rodadas de foco com descanso entre elas</div>
              </button>
            </div>
          </div>

          {/* Campos do modo */}
          {modo === 'bloco' ? (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Duração (minutos)
              </label>
              <input
                type="number"
                min={1}
                value={blocoMin}
                onChange={e => setBlocoMin(Math.max(1, Number(e.target.value)))}
                style={inputStyle}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Rodadas
                </label>
                <input
                  type="number"
                  min={1}
                  value={rounds}
                  onChange={e => setRounds(Math.max(1, Number(e.target.value)))}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Foco (min)
                </label>
                <input
                  type="number"
                  min={1}
                  value={focoMin}
                  onChange={e => setFocoMin(Math.max(1, Number(e.target.value)))}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Descanso (min)
                </label>
                <input
                  type="number"
                  min={0}
                  value={descansoMin}
                  onChange={e => setDescansoMin(Math.max(0, Number(e.target.value)))}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Preview */}
          <div style={{
            padding: '10px 14px', borderRadius: 6,
            background: 'rgba(27,54,93,0.04)', border: '1px solid rgba(27,54,93,0.08)',
            fontSize: 12.5, color: 'var(--char-soft)',
          }}>
            {modo === 'bloco'
              ? `${formatarDuracao(totalMin)} de foco corrido`
              : `${rounds}× ${focoMin}min de foco${rounds > 1 ? `, ${rounds - 1}× ${descansoMin}min de descanso` : ''} · total ${formatarDuracao(totalMin)}`}
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

          {/* Hábito vinculado */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Concluir hábito ao terminar — opcional
            </label>
            {habitos.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
                nenhum hábito criado ainda
              </p>
            ) : (
              <select
                value={habitoId}
                onChange={e => setHabitoId(e.target.value)}
                style={{ ...inputStyle, padding: '10px 12px' }}
              >
                <option value="">Nenhum</option>
                {habitos.map(h => (
                  <option key={h.id} value={h.id}>{h.acao}</option>
                ))}
              </select>
            )}
            {habitoId && (
              <p style={{ fontSize: 11.5, color: 'var(--char-mute)', margin: '6px 0 0', lineHeight: 1.5 }}>
                quando essa sessão terminar, &ldquo;{habitos.find(h => h.id === habitoId)?.acao}&rdquo; é marcado como feito hoje automaticamente.
              </p>
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
            {isEdit ? 'Salvar' : 'Criar cronômetro'}
          </button>
        </div>
      </div>
    </div>
  );
}
