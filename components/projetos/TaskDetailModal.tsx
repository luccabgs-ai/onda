'use client';
import React, { useRef, useState } from 'react';
import { Task, Project, TaskStatus, ChecklistItem } from '@/lib/types';
import { IcClose } from '@/components/ui/icons';
import { Checkbox } from '@/components/ui/Checkbox';
import { LinhaProgresso, BotoesContador, formatarValor, lerValor } from './ProgressoTarefa';

const PRIORITY_LABEL: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
const PRIORITY_COLOR: Record<string, string> = { baixa: 'var(--moss)', media: '#B8860B', alta: 'var(--hanko)' };

const STATUS_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'a_fazer', label: 'A Fazer' },
  { id: 'em_andamento', label: 'Em Andamento' },
  { id: 'concluido', label: 'Concluído' },
];

function isPastDue(dueDate?: string): boolean {
  if (!dueDate) return false;
  // 'YYYY-MM-DD' sozinho é interpretado como meia-noite UTC — 21h da véspera no fuso do
  // Brasil. Fim do dia local é o mesmo critério usado no quadro do projeto (ProjectDetail).
  return new Date(dueDate + 'T23:59:59') < new Date();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

interface TaskDetailModalProps {
  task: Task;
  project: Project;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (status: TaskStatus) => void;
  onToggleChecklist: (itemId: string) => void;
  onReorderChecklist: (novaOrdem: ChecklistItem[]) => void;
  onDefinirContador: (valor: number) => void;
}

export default function TaskDetailModal({
  task,
  project,
  onClose,
  onEdit,
  onDelete,
  onMove,
  onToggleChecklist,
  onReorderChecklist,
  onDefinirContador,
}: TaskDetailModalProps) {
  const pastDue = isPastDue(task.dueDate);
  const alvo = task.valorAlvo;
  const atual = Math.min(task.valorAtual ?? 0, alvo ?? 0);
  const metaBatida = alvo !== undefined && atual >= alvo;
  // Texto sendo digitado no número grande; null = mostrando o valor salvo.
  const [rascunhoContador, setRascunhoContador] = useState<string | null>(null);
  const cancelouRascunho = useRef(false);

  const confirmarRascunho = () => {
    if (rascunhoContador === null) return;
    if (cancelouRascunho.current) {
      cancelouRascunho.current = false;
      setRascunhoContador(null);
      return;
    }
    const valor = lerValor(rascunhoContador);
    if (Number.isFinite(valor)) onDefinirContador(valor);
    setRascunhoContador(null);
  };
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragOverPos, setDragOverPos] = useState<'before' | 'after' | null>(null);

  const dropChecklist = () => {
    if (draggedIdx === null || dragOverIdx === null) return;
    let targetIdx = dragOverPos === 'after' ? dragOverIdx + 1 : dragOverIdx;
    if (targetIdx !== draggedIdx && targetIdx !== draggedIdx + 1) {
      const novaLista = [...task.checklist];
      const [movido] = novaLista.splice(draggedIdx, 1);
      if (draggedIdx < targetIdx) targetIdx -= 1;
      novaLista.splice(targetIdx, 0, movido);
      onReorderChecklist(novaLista);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
    setDragOverPos(null);
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
          width: 'min(540px, 100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px -15px rgba(20,38,74,0.40)',
          overflow: 'hidden',
        }}
      >
        {/* Color accent bar */}
        <div style={{ height: 4, background: project.color, flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(27,54,93,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--char-mute)', marginBottom: 4 }}>
              {project.title}
            </div>
            <h3 className="serif" style={{ fontSize: 20, color: 'var(--ink)', margin: 0, fontWeight: 500, lineHeight: 1.3 }}>
              {task.title}
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
              flexShrink: 0,
            }}
          >
            <IcClose size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', flex: 1 }}>
          {/* Priority + Due date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              background: PRIORITY_COLOR[task.priority] + '22',
              color: PRIORITY_COLOR[task.priority],
              border: `1px solid ${PRIORITY_COLOR[task.priority]}44`,
            }}>
              {PRIORITY_LABEL[task.priority]}
            </span>
            {task.dueDate && (
              <span style={{
                fontSize: 12,
                color: pastDue ? 'var(--hanko)' : 'var(--char-soft)',
                fontWeight: pastDue ? 500 : 400,
              }}>
                {pastDue ? 'Vencida — ' : 'Prazo: '}{formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p style={{ fontSize: 14, color: 'var(--char-soft)', margin: 0, lineHeight: 1.6 }}>
              {task.description}
            </p>
          )}

          {/* Progresso — só em tarefas mensuráveis */}
          {alvo !== undefined && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--char-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Progresso
              </div>
              <div style={{
                padding: 16, borderRadius: 6,
                border: '1px solid rgba(27,54,93,0.10)', background: 'rgba(255,255,255,0.5)',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <input
                      id="contador-tarefa"
                      aria-label="Quanto já foi feito"
                      title="clique pra digitar o valor"
                      inputMode="decimal"
                      value={rascunhoContador ?? formatarValor(atual)}
                      onFocus={e => { setRascunhoContador(formatarValor(atual)); e.currentTarget.select(); }}
                      onChange={e => setRascunhoContador(e.target.value)}
                      onBlur={confirmarRascunho}
                      onKeyDown={e => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') { cancelouRascunho.current = true; e.currentTarget.blur(); }
                      }}
                      className="serif"
                      style={{
                        width: `${Math.max(1, (rascunhoContador ?? formatarValor(atual)).length) * 0.62 + 0.3}em`,
                        fontSize: 42, lineHeight: 1, fontWeight: 600, color: 'var(--ink)',
                        background: 'transparent', border: 'none', padding: 0,
                        borderBottom: '1px dashed rgba(27,54,93,0.25)',
                        textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                      }}
                    />
                    <span className="serif" style={{ fontSize: 22, color: 'var(--char-mute)' }}>
                      / {formatarValor(alvo)}
                    </span>
                  </div>
                  <span style={{ fontSize: 12.5, color: 'var(--char-soft)', paddingBottom: 5 }}>
                    {task.unidade ? `${task.unidade} · ` : ''}
                    {metaBatida ? 'meta batida' : `faltam ${formatarValor(alvo - atual)}`}
                  </span>
                  <div style={{ marginLeft: 'auto' }}>
                    <BotoesContador atual={atual} alvo={alvo} onDefinir={onDefinirContador} grande />
                  </div>
                </div>
                <LinhaProgresso atual={atual} alvo={alvo} cor={project.color} altura={8} />
                {metaBatida && (
                  <span style={{ fontSize: 12.5, color: 'var(--moss)', fontWeight: 500 }}>
                    ✓ Meta batida{task.status === 'concluido' ? ' — etapa concluída.' : '.'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--char-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Status
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUS_COLUMNS.map(col => {
                const isActive = task.status === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => onMove(col.id)}
                    style={{
                      flex: 1,
                      padding: '7px 6px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      border: '1.5px solid rgba(27,54,93,0.20)',
                      background: isActive ? 'var(--ink)' : 'transparent',
                      color: isActive ? 'var(--washi)' : 'var(--char-soft)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {col.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checklist */}
          {task.checklist.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--char-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Checklist ({task.checklist.filter(c => c.done).length}/{task.checklist.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {task.checklist.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedIdx(idx)}
                    onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); setDragOverPos(null); }}
                    onDragOver={(e: React.DragEvent) => {
                      e.preventDefault();
                      if (draggedIdx === null) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const isTopHalf = e.clientY < rect.top + rect.height / 2;
                      setDragOverIdx(idx);
                      setDragOverPos(isTopHalf ? 'before' : 'after');
                    }}
                    onDrop={(e: React.DragEvent) => { e.preventDefault(); dropChecklist(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '5px 6px',
                      borderRadius: 4,
                      cursor: 'grab',
                      opacity: draggedIdx === idx ? 0.4 : 1,
                      borderTop: dragOverIdx === idx && dragOverPos === 'before' ? '2px solid var(--ink)' : '2px solid transparent',
                      borderBottom: dragOverIdx === idx && dragOverPos === 'after' ? '2px solid var(--ink)' : '2px solid transparent',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <span style={{
                      fontSize: 11,
                      color: 'var(--char-mute)',
                      minWidth: 16,
                      textAlign: 'right',
                      fontFamily: 'Cormorant Garamond, serif',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </span>
                    <Checkbox
                      checked={item.done}
                      onChange={() => onToggleChecklist(item.id)}
                      size={18}
                    />
                    <span style={{
                      fontSize: 13,
                      color: item.done ? 'var(--char-mute)' : 'var(--char)',
                      textDecoration: item.done ? 'line-through' : 'none',
                      flex: 1,
                    }}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(27,54,93,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <button
            onClick={onDelete}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--hanko)',
              borderRadius: 4,
              border: '1px solid rgba(197,72,58,0.25)',
              background: 'rgba(197,72,58,0.06)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Excluir
          </button>
          <button
            onClick={onEdit}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ink)',
              borderRadius: 4,
              border: '1px solid rgba(27,54,93,0.25)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
