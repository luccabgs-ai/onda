'use client';
import React, { useState } from 'react';
import { useHabitsStore } from '@/lib/habitsStore';
import { habitosPendentesDeOntem, toDateStr, addDays } from '@/lib/nutricao';
import { AreaBadge } from '@/components/ui/AreaBadge';
import { Checkbox } from '@/components/ui/Checkbox';
import { IcClose, IcHabito } from '@/components/ui/icons';

const STORAGE_KEY = 'onda-revisao-ontem-vista';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function formatarData(dataStr: string): string {
  const d = new Date(dataStr + 'T12:00:00');
  return `${d.getDate()} de ${MESES[d.getMonth()]}`;
}

interface Props {
  habitsStore: ReturnType<typeof useHabitsStore>;
}

/**
 * Ao abrir o app, se existirem hábitos agendados ontem que ficaram sem voto, oferece marcar
 * os que de fato foram feitos mas esqueceram de registrar. Uma vez dispensado (com ou sem
 * marcar nada), não aparece de novo até o dia seguinte — guardado em localStorage porque é
 * só um lembrete de UI, não um dado que precisa sincronizar entre dispositivos.
 */
export default function RevisaoHabitosModal({ habitsStore }: Props) {
  const { habitos, completarHabito } = habitsStore;
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [dispensadoNaSessao, setDispensadoNaSessao] = useState(false);

  const hoje = toDateStr(new Date());
  const ontem = addDays(hoje, -1);
  const pendentes = habitosPendentesDeOntem(habitos, hoje);

  // Lido uma única vez, no primeiro render — dispensar de novo (setDispensadoNaSessao) já
  // cobre o resto da sessão, então não precisa reler o localStorage depois disso.
  const [jaRevisadoAntes] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === ontem
  );

  const visivel = habitsStore.loaded && !dispensadoNaSessao && !jaRevisadoAntes && pendentes.length > 0;

  const dispensar = () => {
    localStorage.setItem(STORAGE_KEY, ontem);
    setDispensadoNaSessao(true);
  };

  const confirmar = () => {
    selecionados.forEach(id => completarHabito(id, ontem));
    dispensar();
  };

  const toggle = (id: string) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  };

  if (!visivel) return null;

  return (
    <div
      onClick={dispensar}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,38,74,0.42)',
        backdropFilter: 'blur(3px)',
        zIndex: 70,
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
          width: 'min(440px, 100%)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px -20px rgba(20,38,74,0.45)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(27,54,93,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: 'rgba(245,239,224,0.5)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <IcHabito size={18} stroke="var(--ink)" sw={1.5} />
            <div>
              <div style={{ fontSize: 10, color: 'var(--char-mute)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 3 }}>
                ficou algo pra trás?
              </div>
              <h3 className="serif" style={{ fontSize: 18, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
                Hábitos de {formatarData(ontem)}
              </h3>
            </div>
          </div>
          <button onClick={dispensar} style={{ width: 26, height: 26, borderRadius: 4, border: '1px solid rgba(27,54,93,0.10)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--char-soft)', flexShrink: 0 }}>
            <IcClose size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 24px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: 12.5, color: 'var(--char-soft)', margin: '0 0 14px', lineHeight: 1.55 }}>
            Esses ficaram sem voto ontem. Marca os que você de fato fez e esqueceu de registrar.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendentes.map(h => {
              const marcado = selecionados.has(h.id);
              return (
                <button
                  key={h.id}
                  onClick={() => toggle(h.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 6, textAlign: 'left',
                    border: `1px solid ${marcado ? 'rgba(27,54,93,0.25)' : 'rgba(27,54,93,0.10)'}`,
                    background: marcado ? 'rgba(27,54,93,0.05)' : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.12s',
                  }}
                >
                  <Checkbox checked={marcado} onChange={() => toggle(h.id)} />
                  <span style={{ flex: 1, fontSize: 13.5, color: 'var(--char)' }}>{h.acao}</span>
                  <AreaBadge areaId={h.areaId} small />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(27,54,93,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button onClick={dispensar} style={{ padding: '8px 16px', fontSize: 13, color: 'var(--char-mute)', borderRadius: 4, border: '1px solid rgba(27,54,93,0.12)' }}>
            Pular
          </button>
          <button
            onClick={confirmar}
            disabled={selecionados.size === 0}
            style={{
              padding: '8px 18px',
              background: selecionados.size > 0 ? 'var(--ink)' : 'rgba(27,54,93,0.25)',
              color: 'var(--washi)', borderRadius: 4, fontSize: 13, fontWeight: 500,
              cursor: selecionados.size > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {selecionados.size > 0 ? `Marcar ${selecionados.size}` : 'Marcar selecionados'}
          </button>
        </div>
      </div>
    </div>
  );
}
