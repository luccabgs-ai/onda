'use client';
import React, { useState } from 'react';
import { Habito } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useHabitsStore } from '@/lib/habitsStore';
import { faltasConsecutivas, votouHoje, deveOferecerEncolhimento, historicoGrid, descreverFrequencia, TODOS_OS_DIAS } from '@/lib/nutricao';
import { Card } from '@/components/ui/Card';
import { IcHabito, IcSun, IcMoon, IcCheck } from '@/components/ui/icons';
import HabitoFormModal from './HabitoFormModal';

interface HabitosScreenProps {
  store: ReturnType<typeof useHabitsStore>;
}

function HistoryField({ habito }: { habito: Habito }) {
  const grid = historicoGrid(habito, 30);
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {grid.map(({ date, voted, scheduled }) => (
        <div
          key={date}
          title={`${date}${scheduled ? '' : ' · sem voto esperado'}`}
          style={{
            width: 11, height: 11, borderRadius: 2,
            background: !scheduled
              ? 'rgba(27,54,93,0.03)'
              : voted ? 'var(--moss)' : 'rgba(27,54,93,0.12)',
          }}
        />
      ))}
    </div>
  );
}

function HabitoCard({
  habito,
  todosHabitos,
  expanded,
  onToggleExpand,
  onVotar,
  onEdit,
  onDelete,
  onAceitarEncolhimento,
  onDispensarEncolhimento,
}: {
  habito: Habito;
  todosHabitos: Habito[];
  expanded: boolean;
  onToggleExpand: () => void;
  onVotar: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAceitarEncolhimento: (novaMeta: string) => void;
  onDispensarEncolhimento: () => void;
}) {
  const [shrinkInput, setShrinkInput] = useState('');
  const area = AREAS.find(a => a.id === habito.areaId);
  const color = area?.color ?? 'var(--ink)';
  const faltas = faltasConsecutivas(habito);
  const votado = votouHoje(habito);
  const ofereceEncolhimento = deveOferecerEncolhimento(habito);

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* Collapsed header — always visible */}
      <div
        onClick={onToggleExpand}
        style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
      >
        <button
          onClick={e => { e.stopPropagation(); onVotar(); }}
          title={votado ? 'Desfazer voto de hoje' : 'Dar o voto de hoje'}
          style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: votado ? 'none' : `1.5px solid ${color}60`,
            background: votado ? color : 'transparent',
            transition: 'all 0.15s',
          }}
        >
          {votado && <IcCheck size={13} stroke="white" sw={2.5} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.3 }}>
            {habito.identidade}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--char-mute)' }}>{area?.name}</span>
            <span style={{ fontSize: 11, color: 'var(--char-mute)' }}>· {habito.acao} ({habito.metaAtual})</span>
            <span style={{ fontSize: 11, color: 'var(--char-mute)' }}>· {descreverFrequencia(habito.diasSemana ?? TODOS_OS_DIAS)}</span>
            {habito.horario && (
              <span style={{ fontSize: 11, color: 'var(--char-mute)' }}>· {habito.horario}</span>
            )}
            {habito.local && (
              <span style={{ fontSize: 11, color: 'var(--char-mute)' }}>· {habito.local}</span>
            )}
          </div>
        </div>

        {faltas === 2 && (
          <span style={{ fontSize: 11, color: 'var(--hanko)', fontStyle: 'italic', flexShrink: 0, maxWidth: 200, textAlign: 'right' }}>
            dois dias de distância
          </span>
        )}

        <span style={{ fontSize: 13, color: 'var(--char-mute)', flexShrink: 0 }}>{expanded ? '▾' : '▸'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 20px 22px', borderTop: '1px solid var(--card-border)' }}>
          {/* Nunca-duas-vezes status */}
          <div style={{ paddingTop: 16, marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--char-mute)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Como está indo
            </div>
            {faltas === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--char-soft)', lineHeight: 1.6, margin: 0 }}>
                {votado ? 'Voto dado hoje. A identidade segue se fortalecendo.' : 'Ainda dá tempo de votar hoje.'}
              </p>
            ) : faltas === 1 ? (
              <p style={{ fontSize: 13, color: 'var(--char-soft)', lineHeight: 1.6, margin: 0 }}>
                Um dia sem voto. Sem problema — isso não muda quem você é.
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--char)', lineHeight: 1.6, margin: 0 }}>
                {faltas} dias sem voto — bora não deixar virar {faltas + 1}? Você pode sempre voltar.
              </p>
            )}
          </div>

          {/* Encolhimento offer */}
          {ofereceEncolhimento && (
            <div style={{
              padding: '14px 16px', borderRadius: 6, marginBottom: 18,
              background: 'rgba(27,54,93,0.04)', border: '1px solid rgba(27,54,93,0.10)',
            }}>
              <p style={{ fontSize: 13, color: 'var(--char)', lineHeight: 1.6, margin: '0 0 10px' }}>
                Esse hábito tá pesado do jeito que está ({habito.metaAtual}). E se encolher um pouco, só pra manter o voto vivo?
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={shrinkInput}
                  onChange={e => setShrinkInput(e.target.value)}
                  placeholder="nova meta, ex: 5 minutos"
                  style={{
                    flex: 1, padding: '8px 12px', fontSize: 13,
                    border: '1px solid rgba(27,54,93,0.15)', borderRadius: 4,
                    background: 'rgba(255,255,255,0.6)', color: 'var(--char)',
                  }}
                />
                <button
                  disabled={!shrinkInput.trim()}
                  onClick={() => { onAceitarEncolhimento(shrinkInput.trim()); setShrinkInput(''); }}
                  style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, color: 'white', background: 'var(--ink)', borderRadius: 4 }}
                >
                  Encolher
                </button>
                <button onClick={onDispensarEncolhimento} style={{ padding: '8px 10px', fontSize: 12, color: 'var(--char-mute)' }}>
                  agora não
                </button>
              </div>
            </div>
          )}

          {/* Ancora */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--char-mute)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Âncora
            </div>
            {habito.ancoraTipo === 'ritual_manha' || habito.ancoraTipo === 'ritual_noite' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--char)' }}>
                {habito.ancoraTipo === 'ritual_manha' ? <IcSun size={14} stroke="var(--ink)" /> : <IcMoon size={14} stroke="var(--ink)" />}
                Depois do Ritual da {habito.ancoraTipo === 'ritual_manha' ? 'manhã' : 'noite'}, eu faço <strong>{habito.acao}</strong>.
              </div>
            ) : habito.ancoraTipo === 'habito' ? (
              <p style={{ fontSize: 13, color: 'var(--char)', margin: 0 }}>
                Depois de <strong>{todosHabitos.find(h => h.id === habito.ancoraHabitoId)?.acao ?? 'um hábito removido'}</strong>, eu faço <strong>{habito.acao}</strong>.
              </p>
            ) : habito.ancoraTipo === 'outro' ? (
              <p style={{ fontSize: 13, color: 'var(--char)', margin: 0 }}>
                {habito.ancoraTexto}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
                sem âncora ainda — pode editar pra pendurar em algum momento
              </p>
            )}
          </div>

          {/* History field */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--char-mute)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              Campo dos últimos 30 dias
            </div>
            <HistoryField habito={habito} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onEdit} style={{ padding: '7px 14px', fontSize: 12, border: '1px solid rgba(27,54,93,0.15)', borderRadius: 4, color: 'var(--char-soft)' }}>
              Editar
            </button>
            <button onClick={onDelete} style={{ padding: '7px 14px', fontSize: 12, border: '1px solid rgba(197,72,58,0.25)', borderRadius: 4, color: 'var(--hanko)' }}>
              Excluir
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function HabitosScreen({ store }: HabitosScreenProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Habito | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div style={{ padding: '40px 56px 80px', maxWidth: 880, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 6 }}>
            votos para quem você quer ser
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <h1 className="serif" style={{ fontSize: 40, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>Hábitos</h1>
            <span className="jp" style={{ fontSize: 22, color: 'var(--char-mute)', fontWeight: 400 }}>習慣</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--char-soft)', maxWidth: 560, marginTop: 12, lineHeight: 1.65 }}>
            Um hábito aqui não é uma tarefa que se repete — é um voto para uma identidade.
            A ação do dia é só a evidência. <em>Cada voto nutre uma Área da Bússola.</em>
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '9px 18px', background: 'var(--ink)', color: 'var(--washi)', borderRadius: 4, fontSize: 13, fontWeight: 500, flexShrink: 0 }}
        >
          + Novo hábito
        </button>
      </div>

      {/* Empty state */}
      {store.habitos.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 12 }}>
          <IcHabito size={36} stroke="var(--char-mute)" sw={1} />
          <div style={{ fontSize: 15, color: 'var(--char-soft)', fontWeight: 500 }}>Nenhum voto ainda</div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ padding: '8px 18px', border: '1px solid rgba(27,54,93,0.20)', borderRadius: 4, fontSize: 13, color: 'var(--ink)', marginTop: 4 }}
          >
            Criar o primeiro hábito
          </button>
        </div>
      )}

      {/* List */}
      {store.habitos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {store.habitos.map(h => (
            <HabitoCard
              key={h.id}
              habito={h}
              todosHabitos={store.habitos}
              expanded={expandedId === h.id}
              onToggleExpand={() => setExpandedId(prev => prev === h.id ? null : h.id)}
              onVotar={() => store.votar(h.id)}
              onEdit={() => setEditing(h)}
              onDelete={() => setConfirmDeleteId(h.id)}
              onAceitarEncolhimento={novaMeta => store.aceitarEncolhimento(h.id, novaMeta)}
              onDispensarEncolhimento={() => store.dispensarEncolhimento(h.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <HabitoFormModal
          habitosExistentes={store.habitos}
          onClose={() => setShowCreate(false)}
          onSave={data => { store.createHabito(data); setShowCreate(false); }}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <HabitoFormModal
          habito={editing}
          habitosExistentes={store.habitos}
          onClose={() => setEditing(null)}
          onSave={data => { store.updateHabito(editing.id, data); setEditing(null); }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (() => {
        const h = store.habitos.find(x => x.id === confirmDeleteId);
        return (
          <div
            onClick={() => setConfirmDeleteId(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,38,74,0.35)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--washi)', border: '1px solid rgba(27,54,93,0.18)', borderRadius: 8, width: 'min(380px, 90%)', padding: 24 }}>
              <div className="serif" style={{ fontSize: 18, color: 'var(--ink)', marginBottom: 8, fontWeight: 500 }}>Excluir hábito?</div>
              <p style={{ fontSize: 13, color: 'var(--char-soft)', lineHeight: 1.6, margin: '0 0 20px' }}>
                O voto <strong style={{ color: 'var(--char)' }}>{h?.identidade}</strong> e todo o histórico de votos serão removidos.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setConfirmDeleteId(null)} style={{ padding: '8px 16px', fontSize: 13, color: 'var(--char-mute)', borderRadius: 4 }}>Cancelar</button>
                <button
                  onClick={() => { store.deleteHabito(confirmDeleteId); setConfirmDeleteId(null); setExpandedId(null); }}
                  style={{ padding: '8px 18px', background: 'var(--hanko)', color: 'white', borderRadius: 4, fontSize: 13, fontWeight: 500 }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
