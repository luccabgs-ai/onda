'use client';
import React, { useState } from 'react';
import { Meta, Objetivo } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useObjetivosStore } from '@/lib/objetivosStore';
import { useHabitsStore } from '@/lib/habitsStore';
import { valorAtualDeMeta, progressoDeMeta, metaConcluida, diasRestantes, progressoDoObjetivo } from '@/lib/metas';
import { Card } from '@/components/ui/Card';
import { IcTarget, IcEdit, IcTrash, IcCheck } from '@/components/ui/icons';
import ObjetivoFormModal from './ObjetivoFormModal';
import MetaFormModal from './MetaFormModal';

interface Props {
  objetivosStore: ReturnType<typeof useObjetivosStore>;
  habitsStore: ReturnType<typeof useHabitsStore>;
}

function MetaRow({
  meta, habitos, onEdit, onDelete, onAjustarManual,
}: {
  meta: Meta;
  habitos: ReturnType<typeof useHabitsStore>['habitos'];
  onEdit: () => void;
  onDelete: () => void;
  onAjustarManual: (delta: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const valorAtual = valorAtualDeMeta(meta, habitos);
  const progresso = progressoDeMeta(meta, habitos);
  const concluida = metaConcluida(meta, habitos);
  const habito = meta.rastreio === 'habito' ? habitos.find(h => h.id === meta.habitoId) : undefined;
  const restantes = meta.prazo ? diasRestantes(meta.prazo) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      style={{ padding: '12px 0', borderBottom: '1px solid rgba(27,54,93,0.06)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {concluida && <IcCheck size={13} stroke="var(--moss)" sw={2.5} />}
            <span style={{ fontSize: 13.5, fontWeight: 500, color: concluida ? 'var(--char-mute)' : 'var(--char)', textDecoration: concluida ? 'line-through' : 'none' }}>
              {meta.titulo}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--char-mute)' }}>
              {valorAtual}/{meta.valorAlvo} {meta.unidade}
            </span>
            {meta.rastreio === 'manual' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => onAjustarManual(-1)}
                  style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid rgba(27,54,93,0.22)', background: 'rgba(27,54,93,0.04)', color: 'var(--ink)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  −
                </button>
                <button
                  onClick={() => onAjustarManual(1)}
                  style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid rgba(27,54,93,0.22)', background: 'rgba(27,54,93,0.04)', color: 'var(--ink)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  +
                </button>
              </div>
            )}
            {habito && (
              <span style={{ fontSize: 10.5, color: 'var(--char-mute)', fontStyle: 'italic' }}>
                · via hábito &ldquo;{habito.acao}&rdquo;
              </span>
            )}
            {restantes !== null && (
              <span style={{ fontSize: 10.5, color: restantes < 0 ? 'var(--hanko)' : 'var(--char-mute)' }}>
                · {restantes < 0 ? `${Math.abs(restantes)}d atrasada` : restantes === 0 ? 'prazo é hoje' : `${restantes}d restantes`}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {hovered && (
            confirmDelete ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--hanko)' }}>apagar?</span>
                <button onClick={onDelete} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--hanko)', padding: '2px 5px' }}>sim</button>
                <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 10.5, color: 'var(--char-mute)', padding: '2px 5px' }}>não</button>
              </div>
            ) : (
              <>
                <button onClick={onEdit} title="editar" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--char-mute)' }}>
                  <IcEdit size={12} stroke="var(--char-mute)" />
                </button>
                <button onClick={() => setConfirmDelete(true)} title="apagar" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hanko)' }}>
                  <IcTrash size={12} stroke="var(--hanko)" />
                </button>
              </>
            )
          )}
        </div>
      </div>

      <div style={{ height: 4, borderRadius: 2, background: 'rgba(27,54,93,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progresso * 100}%`,
          background: concluida ? 'var(--moss)' : 'var(--ink)',
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

function ObjetivoCard({
  objetivo, metas, habitos, onEdit, onDelete, onNovaMeta, onEditMeta, onDeleteMeta, onAjustarManual,
}: {
  objetivo: Objetivo;
  metas: Meta[];
  habitos: ReturnType<typeof useHabitsStore>['habitos'];
  onEdit: () => void;
  onDelete: () => void;
  onNovaMeta: () => void;
  onEditMeta: (m: Meta) => void;
  onDeleteMeta: (id: string) => void;
  onAjustarManual: (id: string, delta: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const area = AREAS.find(a => a.id === objetivo.areaId);
  const color = area?.color ?? 'var(--ink)';
  const habitosVinculados = habitos.filter(h => objetivo.habitoIds.includes(h.id));
  const { concluidas, total } = progressoDoObjetivo(metas, habitos);

  return (
    <Card style={{ padding: 0, overflow: 'hidden', borderLeft: `3px solid ${color}` }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="serif" style={{ fontSize: 17, color: 'var(--ink)', fontWeight: 500, fontStyle: 'italic' }}>
              {objetivo.titulo}
            </span>
            {area && (
              <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, background: `${color}18`, color, fontWeight: 500 }}>
                {area.name}
              </span>
            )}
          </div>
          {objetivo.descricao && (
            <p style={{ fontSize: 12, color: 'var(--char-soft)', margin: '4px 0 0', lineHeight: 1.5 }}>{objetivo.descricao}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {habitosVinculados.map(h => (
              <span key={h.id} style={{ fontSize: 10.5, color: 'var(--char-mute)' }}>· {h.acao}</span>
            ))}
            {total > 0 && (
              <span style={{ fontSize: 11, color: 'var(--char-mute)', marginLeft: habitosVinculados.length > 0 ? 4 : 0 }}>
                {concluidas}/{total} metas concluídas
              </span>
            )}
          </div>
        </div>

        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10.5, color: 'var(--hanko)' }}>apagar objetivo e metas?</span>
              <button onClick={onDelete} style={{ fontSize: 11, fontWeight: 600, color: 'var(--hanko)', padding: '2px 6px' }}>sim</button>
              <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 11, color: 'var(--char-mute)', padding: '2px 6px' }}>não</button>
            </div>
          ) : (
            <>
              <button onClick={onEdit} title="editar" style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--char-mute)' }}>
                <IcEdit size={13} stroke="var(--char-mute)" />
              </button>
              <button onClick={() => setConfirmDelete(true)} title="apagar" style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hanko)' }}>
                <IcTrash size={13} stroke="var(--hanko)" />
              </button>
            </>
          )}
        </div>

        <span style={{ fontSize: 13, color: 'var(--char-mute)', flexShrink: 0 }}>{expanded ? '▾' : '▸'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 22px 18px', borderTop: '1px solid var(--card-border)' }}>
          <div style={{ paddingTop: 10 }}>
            {metas.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--char-mute)', fontStyle: 'italic', margin: '8px 0' }}>
                nenhuma meta ainda
              </p>
            ) : (
              metas.map(m => (
                <MetaRow
                  key={m.id}
                  meta={m}
                  habitos={habitos}
                  onEdit={() => onEditMeta(m)}
                  onDelete={() => onDeleteMeta(m.id)}
                  onAjustarManual={delta => onAjustarManual(m.id, delta)}
                />
              ))
            )}
          </div>
          <button
            onClick={onNovaMeta}
            style={{ marginTop: 10, fontSize: 12.5, color: 'var(--ink)', padding: '6px 0', fontWeight: 500 }}
          >
            + nova meta
          </button>
        </div>
      )}
    </Card>
  );
}

export default function ObjetivosScreen({ objetivosStore, habitsStore }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingObjetivo, setEditingObjetivo] = useState<Objetivo | null>(null);
  const [metaModalFor, setMetaModalFor] = useState<Objetivo | null>(null);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);

  const { objetivos, createObjetivo, updateObjetivo, deleteObjetivo, createMeta, updateMeta, deleteMeta, ajustarValorManual, getMetasByObjetivo } = objetivosStore;
  const { habitos } = habitsStore;

  return (
    <div style={{ padding: '40px 56px 80px', maxWidth: 880, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 6 }}>
            a chegada, e o caminho quantificável até lá
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <h1 className="serif" style={{ fontSize: 40, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>Objetivos</h1>
            <span className="jp" style={{ fontSize: 22, color: 'var(--char-mute)', fontWeight: 400 }}>目標</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--char-soft)', maxWidth: 560, marginTop: 12, lineHeight: 1.65 }}>
            Um objetivo é geral — <em>quem você quer ser</em>. As metas dentro dele são específicas
            e mensuráveis, e podem se alimentar sozinhas dos votos de um hábito vinculado.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '9px 18px', background: 'var(--ink)', color: 'var(--washi)', borderRadius: 4, fontSize: 13, fontWeight: 500, flexShrink: 0 }}
        >
          + Novo objetivo
        </button>
      </div>

      {/* Lista */}
      {objetivos.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 12 }}>
          <IcTarget size={32} stroke="var(--char-mute)" sw={1} />
          <div style={{ fontSize: 15, color: 'var(--char-soft)', fontWeight: 500 }}>Nenhum objetivo ainda</div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ padding: '8px 18px', border: '1px solid rgba(27,54,93,0.20)', borderRadius: 4, fontSize: 13, color: 'var(--ink)', marginTop: 4 }}
          >
            Criar o primeiro objetivo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {objetivos.map(o => (
            <ObjetivoCard
              key={o.id}
              objetivo={o}
              metas={getMetasByObjetivo(o.id)}
              habitos={habitos}
              onEdit={() => setEditingObjetivo(o)}
              onDelete={() => deleteObjetivo(o.id)}
              onNovaMeta={() => setMetaModalFor(o)}
              onEditMeta={m => { setMetaModalFor(o); setEditingMeta(m); }}
              onDeleteMeta={id => deleteMeta(id)}
              onAjustarManual={(id, delta) => ajustarValorManual(id, delta)}
            />
          ))}
        </div>
      )}

      {/* Modais de objetivo */}
      {showCreate && (
        <ObjetivoFormModal
          habitos={habitos}
          onClose={() => setShowCreate(false)}
          onSave={data => { createObjetivo(data); setShowCreate(false); }}
        />
      )}
      {editingObjetivo && (
        <ObjetivoFormModal
          objetivo={editingObjetivo}
          habitos={habitos}
          onClose={() => setEditingObjetivo(null)}
          onSave={data => { updateObjetivo(editingObjetivo.id, data); setEditingObjetivo(null); }}
        />
      )}

      {/* Modal de meta */}
      {metaModalFor && (
        <MetaFormModal
          objetivo={metaModalFor}
          habitosVinculados={habitos.filter(h => metaModalFor.habitoIds.includes(h.id))}
          meta={editingMeta ?? undefined}
          onClose={() => { setMetaModalFor(null); setEditingMeta(null); }}
          onSave={data => {
            if (editingMeta) updateMeta(editingMeta.id, data);
            else createMeta(metaModalFor.id, data);
            setMetaModalFor(null);
            setEditingMeta(null);
          }}
        />
      )}
    </div>
  );
}
