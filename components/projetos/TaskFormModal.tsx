'use client';
import React, { useState } from 'react';
import { Task, Priority, TaskStatus, ChecklistItem } from '@/lib/types';
import { IcClose } from '@/components/ui/icons';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  background: 'rgba(255,253,247,0.7)',
  border: '1px solid rgba(27,54,93,0.15)',
  borderRadius: 4,
  fontSize: 14,
  color: 'var(--char)',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'baixa', label: 'Baixa', color: 'var(--moss)' },
  { value: 'media', label: 'Média', color: '#C8A000' },
  { value: 'alta', label: 'Alta', color: 'var(--hanko)' },
];

interface TaskFormModalProps {
  task?: Task;
  projectId: string;
  initialStatus?: TaskStatus;
  onClose: () => void;
  onSave: (data: Omit<Task, 'id' | 'projectId' | 'order' | 'createdAt' | 'updatedAt'>) => void;
}

export default function TaskFormModal({ task, projectId: _projectId, initialStatus, onClose, onSave }: TaskFormModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'media');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [status] = useState<TaskStatus>(task?.status ?? initialStatus ?? 'a_fazer');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task?.checklist ?? []);
  const [newItem, setNewItem] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragOverPos, setDragOverPos] = useState<'before' | 'after' | null>(null);

  const isEdit = !!task;
  const canSave = title.trim().length > 0;

  const addItem = () => {
    const t = newItem.trim();
    if (!t) return;
    setChecklist(prev => [...prev, { id: crypto.randomUUID(), title: t, done: false }]);
    setNewItem('');
  };

  const removeItem = (id: string) => {
    setChecklist(prev => prev.filter(c => c.id !== id));
  };

  const dropChecklist = () => {
    if (draggedIdx === null || dragOverIdx === null) return;
    let targetIdx = dragOverPos === 'after' ? dragOverIdx + 1 : dragOverIdx;
    if (targetIdx !== draggedIdx && targetIdx !== draggedIdx + 1) {
      setChecklist(prev => {
        const novaLista = [...prev];
        const [movido] = novaLista.splice(draggedIdx, 1);
        if (draggedIdx < targetIdx) targetIdx -= 1;
        novaLista.splice(targetIdx, 0, movido);
        return novaLista;
      });
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
    setDragOverPos(null);
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      checklist,
      status,
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
          width: 'min(520px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px -15px rgba(20,38,74,0.40)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--char-mute)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {isEdit ? 'editar tarefa' : 'nova tarefa'}
            </div>
            <h3 className="serif" style={{ fontSize: 18, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
              {isEdit ? task.title : 'Criar Tarefa'}
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
        <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Título *
            </label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="O que precisa ser feito…"
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
              placeholder="Contexto adicional…"
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          {/* Priority + Due Date row */}
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Priority */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Prioridade
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    style={{
                      flex: 1,
                      padding: '7px 6px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      border: `1.5px solid ${p.color}`,
                      background: priority === p.value ? p.color : 'transparent',
                      color: priority === p.value ? 'white' : p.color,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Prazo
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px' }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--char-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Checklist
            </label>
            {checklist.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {checklist.map((item, idx) => (
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
                      gap: 8,
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(27,54,93,0.10)',
                      borderRadius: 4,
                      cursor: 'grab',
                      opacity: draggedIdx === idx ? 0.4 : 1,
                      borderTop: dragOverIdx === idx && dragOverPos === 'before' ? '2px solid var(--ink)' : undefined,
                      borderBottom: dragOverIdx === idx && dragOverPos === 'after' ? '2px solid var(--ink)' : undefined,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <span style={{
                      fontSize: 11, color: 'var(--char-mute)', minWidth: 14, textAlign: 'right',
                      fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, flexShrink: 0,
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--char)' }}>{item.title}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{ color: 'var(--char-mute)', display: 'flex', alignItems: 'center' }}
                    >
                      <IcClose size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                placeholder="Adicionar item…"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={addItem}
                style={{
                  padding: '8px 14px',
                  background: 'var(--ink)',
                  color: 'var(--washi)',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                +
              </button>
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
          flexShrink: 0,
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
            {isEdit ? 'Salvar' : 'Criar Tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
}
