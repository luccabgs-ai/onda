'use client';
import React, { useState } from 'react';
import { Project, SessaoFoco, Task, TaskStatus } from '@/lib/types';
import { useProjectsStore } from '@/lib/projectsStore';
import { Card } from '@/components/ui/Card';
import { AreaBadge } from '@/components/ui/AreaBadge';
import ProjectFormModal from './ProjectFormModal';
import TaskFormModal from './TaskFormModal';
import TaskDetailModal from './TaskDetailModal';
import { LinhaProgresso, BotoesContador, formatarValor } from './ProgressoTarefa';
import { blocosDaSemana, formatarMinutos, somaMinutos } from '@/lib/focoStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS: { id: TaskStatus; label: string; jp: string; color: string }[] = [
  { id: 'a_fazer',      label: 'A Fazer',      jp: '未着手', color: 'var(--char-mute)' },
  { id: 'em_andamento', label: 'Em Andamento',  jp: '進行中', color: 'var(--ink-soft)' },
  { id: 'concluido',    label: 'Concluído',     jp: '完了',   color: 'var(--moss)' },
];

const PRIORITY_COLOR: Record<string, string> = {
  baixa: 'var(--moss)', media: '#B8860B', alta: 'var(--hanko)',
};
const PRIORITY_LABEL: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta',
};

// ── Calendar helpers ──────────────────────────────────────────────────────────

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS_MIN = ['D','S','T','Q','Q','S','S'];

function getCalDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function isPastDue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate + 'T23:59:59') < new Date();
}

function getPrev(s: TaskStatus): TaskStatus | null {
  const o: TaskStatus[] = ['a_fazer','em_andamento','concluido'];
  const i = o.indexOf(s); return i > 0 ? o[i - 1] : null;
}
function getNext(s: TaskStatus): TaskStatus | null {
  const o: TaskStatus[] = ['a_fazer','em_andamento','concluido'];
  const i = o.indexOf(s); return i < o.length - 1 ? o[i + 1] : null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TaskCard({
  task,
  projectColor,
  onOpen,
  onMove,
  onDefinirContador,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  isDragging,
  dropIndicator,
  accentColor,
}: {
  task: Task;
  projectColor: string;
  onOpen: () => void;
  onMove: (s: TaskStatus) => void;
  onDefinirContador: (valor: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOverCard: (e: React.DragEvent) => void;
  isDragging: boolean;
  dropIndicator: 'before' | 'after' | null;
  accentColor: string;
}) {
  const past = isPastDue(task.dueDate);
  const doneCount = task.checklist.filter(c => c.done).length;
  const prev = getPrev(task.status);
  const next = getNext(task.status);
  const alvo = task.valorAlvo;
  const atual = Math.min(task.valorAtual ?? 0, alvo ?? 0);
  const metaBatida = alvo !== undefined && atual >= alvo;

  return (
    <Card
      style={{
        padding: 12,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 0.15s, transform 0.15s',
        borderTop: dropIndicator === 'before' ? `2.5px solid ${accentColor}` : undefined,
        borderBottom: dropIndicator === 'after' ? `2.5px solid ${accentColor}` : undefined,
      }}
      onClick={onOpen}
      draggable
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOverCard}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--char)', marginBottom: 8, lineHeight: 1.4 }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600,
          background: PRIORITY_COLOR[task.priority] + '20',
          color: PRIORITY_COLOR[task.priority],
        }}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        {task.dueDate && (
          <span style={{ fontSize: 11, color: past ? 'var(--hanko)' : 'var(--char-mute)', fontWeight: past ? 600 : 400 }}>
            {formatDateLabel(task.dueDate)}
          </span>
        )}
        {task.checklist.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--char-mute)', marginLeft: 'auto' }}>
            {doneCount}/{task.checklist.length}
          </span>
        )}
      </div>
      {task.checklist.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {task.checklist.map(item => (
            <span
              key={item.id}
              title={item.done ? 'feito' : 'a fazer'}
              style={{
                width: 11, height: 11, borderRadius: 3, flexShrink: 0,
                border: item.done ? 'none' : '1.5px solid rgba(27,54,93,0.25)',
                background: item.done ? 'var(--moss)' : 'transparent',
              }}
            />
          ))}
        </div>
      )}
      {alvo !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 9 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
              {formatarValor(atual)}/{formatarValor(alvo)}
            </span>
            {task.unidade && <span style={{ fontSize: 11, color: 'var(--char-mute)' }}>{task.unidade}</span>}
            <span style={{
              marginLeft: 'auto', fontSize: 11,
              color: metaBatida ? 'var(--moss)' : 'var(--char-mute)',
              fontWeight: metaBatida ? 600 : 400,
            }}>
              {metaBatida ? 'meta batida' : `faltam ${formatarValor(alvo - atual)}`}
            </span>
          </div>
          <LinhaProgresso atual={atual} alvo={alvo} cor={projectColor} />
        </div>
      )}
      {(prev || next || alvo !== undefined) && (
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          {alvo !== undefined && (
            <div style={{ marginRight: 'auto' }}>
              <BotoesContador atual={atual} alvo={alvo} onDefinir={onDefinirContador} />
            </div>
          )}
          {prev && (
            <button
              onClick={() => onMove(prev)}
              style={{ padding: '2px 8px', fontSize: 11, borderRadius: 3, border: '1px solid rgba(27,54,93,0.12)', color: 'var(--char-mute)' }}
            >←</button>
          )}
          {next && (
            <button
              onClick={() => onMove(next)}
              style={{ padding: '2px 8px', fontSize: 11, borderRadius: 3, border: '1px solid rgba(27,54,93,0.12)', color: 'var(--char-mute)' }}
            >→</button>
          )}
        </div>
      )}
    </Card>
  );
}

function ProjectCalendar({
  tasks,
  projectColor,
}: {
  tasks: Task[];
  projectColor: string;
}) {
  const today = new Date();
  const todayStr = toDateStr(today);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const dateTaskMap = tasks
    .filter(t => t.dueDate)
    .reduce<Record<string, Task[]>>((acc, t) => {
      acc[t.dueDate!] = [...(acc[t.dueDate!] ?? []), t];
      return acc;
    }, {});

  const cells = getCalDays(year, month);
  const selectedTasks = selected ? (dateTaskMap[selected] ?? []) : [];

  const upcomingTasks = [...tasks]
    .filter(t => t.dueDate)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--card-border)', background: 'var(--card-bg)', fontSize: 18, color: 'var(--char-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <span className="serif" style={{ fontSize: 18, color: 'var(--ink)', fontWeight: 500 }}>
          {MONTHS_PT[month]} {year}
        </span>
        <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--card-border)', background: 'var(--card-bg)', fontSize: 18, color: 'var(--char-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
        {DAYS_MIN.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--char-mute)', fontWeight: 600, letterSpacing: '0.05em', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const ds = toDateStr(day);
          const hasTasks = !!dateTaskMap[ds];
          const isToday = ds === todayStr;
          const isSel = ds === selected;
          const count = dateTaskMap[ds]?.length ?? 0;

          return (
            <button
              key={idx}
              onClick={() => setSelected(isSel ? null : ds)}
              style={{
                height: 44,
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: isSel
                  ? projectColor
                  : isToday
                  ? 'rgba(27,54,93,0.10)'
                  : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                transition: 'background 0.12s',
              }}
            >
              <span style={{
                fontSize: 13,
                fontWeight: isToday || isSel ? 600 : 400,
                color: isSel ? 'white' : isToday ? 'var(--ink)' : 'var(--char)',
                lineHeight: 1,
              }}>
                {day.getDate()}
              </span>
              {hasTasks && (
                <span style={{
                  width: isSel ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: isSel ? 'rgba(255,255,255,0.75)' : projectColor,
                  fontSize: isSel ? 9 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  transition: 'all 0.15s',
                }}>
                  {isSel && count > 1 ? count : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date tasks */}
      {selected && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--char-mute)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>
            {formatDateLabel(selected)}
          </div>
          {selectedTasks.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--char-mute)', fontStyle: 'italic' }}>Nenhuma tarefa</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedTasks.map(t => (
                <div key={t.id} style={{
                  padding: '8px 10px',
                  background: 'var(--card-bg)',
                  border: `1px solid var(--card-border)`,
                  borderLeft: `3px solid ${PRIORITY_COLOR[t.priority]}`,
                  borderRadius: 5,
                  fontSize: 12,
                  color: 'var(--char)',
                  fontWeight: 500,
                }}>
                  {t.title}
                  <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--char-mute)', fontWeight: 400 }}>
                    {COLUMNS.find(c => c.id === t.status)?.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="brush-divider" style={{ margin: '20px 0 16px' }} />

      {/* Upcoming tasks */}
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--char-mute)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
        Linha do tempo
      </div>
      {upcomingTasks.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--char-mute)', fontStyle: 'italic' }}>
          Nenhuma tarefa com prazo definido
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {upcomingTasks.map((t, idx) => {
            const past = isPastDue(t.dueDate);
            const col = COLUMNS.find(c => c.id === t.status)!;
            return (
              <div key={t.id} style={{ display: 'flex', gap: 10, paddingBottom: 12, position: 'relative' }}>
                {/* Timeline line */}
                {idx < upcomingTasks.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: 5,
                    top: 16,
                    bottom: 0,
                    width: 1,
                    background: 'var(--card-border)',
                  }} />
                )}
                {/* Dot */}
                <div style={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: t.status === 'concluido' ? 'var(--moss)' : past ? 'var(--hanko)' : projectColor,
                  flexShrink: 0,
                  marginTop: 3,
                  zIndex: 1,
                  border: '2px solid var(--washi)',
                  outline: `1px solid ${t.status === 'concluido' ? 'var(--moss)' : past ? 'var(--hanko)' : projectColor}`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: t.status === 'concluido' ? 'var(--char-mute)' : 'var(--char)',
                    textDecoration: t.status === 'concluido' ? 'line-through' : 'none',
                    marginBottom: 2,
                    lineHeight: 1.3,
                  }}>
                    {t.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: past && t.status !== 'concluido' ? 'var(--hanko)' : 'var(--char-mute)', fontWeight: past && t.status !== 'concluido' ? 600 : 400 }}>
                      {formatDateLabel(t.dueDate!)}
                    </span>
                    <span style={{ fontSize: 10, color: col.color, fontWeight: 500 }}>
                      · {col.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  store: ReturnType<typeof useProjectsStore>;
  sessoesFoco?: SessaoFoco[];               // tempo de foco gravado (todas as sessões)
  onFocarTarefa?: (taskId: string) => void; // "Focar nesta tarefa" → cronômetro
}

export default function ProjectDetail({ project: initialProject, onBack, store, sessoesFoco = [], onFocarTarefa }: ProjectDetailProps) {
  const [showEditProject, setShowEditProject] = useState(false);
  const [addTaskCol, setAddTaskCol] = useState<TaskStatus | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showEditTaskFromDetail, setShowEditTaskFromDetail] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);

  const project = store.projects.find(p => p.id === initialProject.id) ?? initialProject;
  const grouped = store.getTasksByProject(project.id);
  const allTasks = store.tasks.filter(t => t.projectId === project.id);

  const handleCreateTask = (data: Omit<Task, 'id' | 'projectId' | 'order' | 'createdAt' | 'updatedAt'>) => {
    store.createTask(project.id, data);
    setAddTaskCol(null);
  };

  const handleUpdateTask = (data: Omit<Task, 'id' | 'projectId' | 'order' | 'createdAt' | 'updatedAt'>) => {
    if (editTask) {
      store.updateTask(editTask.id, data);
      // Baixar a meta pra um valor que o contador já alcançou também conclui a etapa.
      const atual = store.tasks.find(t => t.id === editTask.id)?.valorAtual ?? 0;
      if (data.valorAlvo !== undefined && atual >= data.valorAlvo && data.status !== 'concluido') {
        store.moveTask(editTask.id, 'concluido');
      }
      setEditTask(null);
      setShowEditTaskFromDetail(false);
    }
  };

  const handleMoveTask = (taskId: string, newStatus: TaskStatus) => {
    store.moveTask(taskId, newStatus);
    setDetailTask(prev => prev?.id === taskId ? { ...prev, status: newStatus } : prev);
  };

  const clearDragState = () => {
    setDraggingTaskId(null);
    setDragOverCol(null);
    setDragOverTaskId(null);
    setDragOverPosition(null);
  };

  const handleDropOnColumn = (colId: TaskStatus) => {
    const taskId = draggingTaskId;
    if (!taskId) return;
    const colTasks = grouped[colId].filter(t => t.id !== taskId);
    let beforeId: string | null = null;
    let afterId: string | null = null;

    if (dragOverTaskId) {
      const idx = colTasks.findIndex(t => t.id === dragOverTaskId);
      if (dragOverPosition === 'before') {
        afterId = colTasks[idx]?.id ?? null;
        beforeId = colTasks[idx - 1]?.id ?? null;
      } else {
        beforeId = colTasks[idx]?.id ?? null;
        afterId = colTasks[idx + 1]?.id ?? null;
      }
    } else {
      beforeId = colTasks[colTasks.length - 1]?.id ?? null;
    }

    store.reorderTask(taskId, colId, beforeId, afterId);
    setDetailTask(prev => prev?.id === taskId ? { ...prev, status: colId } : prev);
    clearDragState();
  };

  const handleToggleChecklist = (taskId: string, itemId: string) => {
    store.toggleChecklistItem(taskId, itemId);
    setDetailTask(prev => {
      if (!prev || prev.id !== taskId) return prev;
      return { ...prev, checklist: prev.checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c) };
    });
  };

  const handleReorderChecklist = (taskId: string, novaOrdem: Task['checklist']) => {
    store.updateTask(taskId, { checklist: novaOrdem });
    setDetailTask(prev => prev?.id === taskId ? { ...prev, checklist: novaOrdem } : prev);
  };

  const focoDoProjeto = sessoesFoco.filter(s => s.projectId === project.id);
  const focoTotal = somaMinutos(focoDoProjeto);
  const focoSemana = somaMinutos(blocosDaSemana(focoDoProjeto, toDateStr(new Date())));

  const done = allTasks.filter(t => t.status === 'concluido').length;
  const progress = allTasks.length > 0 ? done / allTasks.length : 0;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 170px 16px 28px',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexShrink: 0,
        background: 'var(--washi)',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 4,
            border: '1px solid rgba(27,54,93,0.15)',
            fontSize: 12, color: 'var(--char-soft)', flexShrink: 0,
          }}
        >
          ← Projetos
        </button>

        <div style={{ width: 10, height: 10, borderRadius: '50%', background: project.color, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="serif" style={{ fontSize: 22, color: 'var(--ink)', margin: 0, fontWeight: 500, lineHeight: 1.2 }}>
              {project.title}
            </h1>
            {project.areaId && <AreaBadge areaId={project.areaId} small />}
            {project.dueDate && (
              <span style={{
                fontSize: 11, flexShrink: 0,
                color: isPastDue(project.dueDate) ? 'var(--hanko)' : 'var(--char-mute)',
                fontWeight: isPastDue(project.dueDate) ? 600 : 400,
              }}>
                prazo {formatDateLabel(project.dueDate)}
              </span>
            )}
          </div>
          {project.description && (
            <p style={{ fontSize: 12, color: 'var(--char-mute)', margin: '2px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.description}
            </p>
          )}
        </div>

        {/* Tempo de foco no projeto */}
        {focoTotal > 0 && (
          <span title="tempo de foco gravado pelo cronômetro" style={{ fontSize: 12, color: 'var(--char-soft)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            ◷ foco: <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{formatarMinutos(focoSemana)}</strong> na semana
            {' · '}<strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{formatarMinutos(focoTotal)}</strong> no total
          </span>
        )}

        {/* Progress mini */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 80, height: 4, background: 'rgba(27,54,93,0.10)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: project.color, borderRadius: 999, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--char-mute)', minWidth: 32 }}>{Math.round(progress * 100)}%</span>
        </div>

        <button
          onClick={() => setShowEditProject(true)}
          style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid rgba(27,54,93,0.15)', fontSize: 12, color: 'var(--char-soft)', flexShrink: 0 }}
        >
          Editar
        </button>

        <button
          onClick={() => setAddTaskCol('a_fazer')}
          style={{
            padding: '7px 16px', borderRadius: 4,
            background: project.color, color: 'white',
            fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}
        >
          + Adicionar etapa
        </button>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Kanban */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', minHeight: '100%' }}>
            {COLUMNS.map(col => {
              const tasks = grouped[col.id];
              const isOver = dragOverCol === col.id;
              return (
                <div
                  key={col.id}
                  style={{ flex: '1 1 0', minWidth: 220, display: 'flex', flexDirection: 'column' }}
                  onDragOver={(e: React.DragEvent) => {
                    e.preventDefault();
                    setDragOverCol(col.id);
                    setDragOverTaskId(null);
                    setDragOverPosition(null);
                  }}
                  onDragLeave={() => {
                    setDragOverCol(prev => (prev === col.id ? null : prev));
                  }}
                  onDrop={(e: React.DragEvent) => {
                    e.preventDefault();
                    handleDropOnColumn(col.id);
                  }}
                >
                  {/* Column header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, padding: '0 2px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: col.color, flex: 1 }}>{col.label}</span>
                    <span className="jp" style={{ fontSize: 10, color: 'var(--char-mute)', opacity: 0.7 }}>{col.jp}</span>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 10, background: 'rgba(27,54,93,0.07)', color: 'var(--char-mute)', fontWeight: 500 }}>
                      {tasks.length}
                    </span>
                    <button
                      onClick={() => setAddTaskCol(col.id)}
                      style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid rgba(27,54,93,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--char-mute)', lineHeight: 1 }}
                    >+</button>
                  </div>

                  {/* Tasks */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flex: 1,
                    minHeight: 200,
                    padding: 6,
                    margin: -6,
                    borderRadius: 8,
                    background: isOver ? `${col.color}10` : 'transparent',
                    outline: isOver ? `2px dashed ${col.color}60` : 'none',
                    outlineOffset: -2,
                    transition: 'background 0.12s, outline-color 0.12s',
                  }}>
                    {tasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        projectColor={project.color}
                        onOpen={() => setDetailTask(task)}
                        onMove={s => handleMoveTask(task.id, s)}
                        onDefinirContador={valor => store.definirContador(task.id, valor)}
                        onDragStart={() => setDraggingTaskId(task.id)}
                        onDragEnd={clearDragState}
                        onDragOverCard={(e: React.DragEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (task.id === draggingTaskId) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const isTopHalf = e.clientY < rect.top + rect.height / 2;
                          setDragOverCol(col.id);
                          setDragOverTaskId(task.id);
                          setDragOverPosition(isTopHalf ? 'before' : 'after');
                        }}
                        isDragging={draggingTaskId === task.id}
                        dropIndicator={dragOverCol === col.id && dragOverTaskId === task.id ? dragOverPosition : null}
                        accentColor={col.color}
                      />
                    ))}
                    {tasks.length === 0 && (
                      <div style={{ padding: '18px 10px', textAlign: 'center', fontSize: 12, color: 'var(--char-mute)', border: '1.5px dashed rgba(27,54,93,0.12)', borderRadius: 6 }}>
                        {isOver ? 'Soltar aqui' : 'Nenhuma etapa'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'var(--card-border)', flexShrink: 0 }} />

        {/* Calendar sidebar */}
        <div style={{ width: 420, flexShrink: 0, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--char-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Calendário do projeto
          </div>
          <ProjectCalendar tasks={allTasks} projectColor={project.color} />
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showEditProject && (
        <ProjectFormModal
          project={project}
          onClose={() => setShowEditProject(false)}
          onSave={data => { store.updateProject(project.id, data); setShowEditProject(false); }}
        />
      )}

      {addTaskCol !== null && (
        <TaskFormModal
          projectId={project.id}
          initialStatus={addTaskCol}
          onClose={() => setAddTaskCol(null)}
          onSave={handleCreateTask}
        />
      )}

      {detailTask && !showEditTaskFromDetail && (
        <TaskDetailModal
          task={store.tasks.find(t => t.id === detailTask.id) ?? detailTask}
          project={project}
          onClose={() => setDetailTask(null)}
          onEdit={() => { setEditTask(store.tasks.find(t => t.id === detailTask.id) ?? detailTask); setShowEditTaskFromDetail(true); }}
          onDelete={() => { store.deleteTask(detailTask.id); setDetailTask(null); }}
          onMove={s => handleMoveTask(detailTask.id, s)}
          onToggleChecklist={itemId => handleToggleChecklist(detailTask.id, itemId)}
          onReorderChecklist={novaOrdem => handleReorderChecklist(detailTask.id, novaOrdem)}
          onDefinirContador={valor => store.definirContador(detailTask.id, valor)}
          minutosDeFoco={somaMinutos(focoDoProjeto.filter(s => s.taskId === detailTask.id))}
          onFocar={onFocarTarefa && (() => { setDetailTask(null); onFocarTarefa(detailTask.id); })}
        />
      )}

      {editTask && showEditTaskFromDetail && (
        <TaskFormModal
          task={editTask}
          projectId={project.id}
          onClose={() => { setShowEditTaskFromDetail(false); setEditTask(null); }}
          onSave={handleUpdateTask}
        />
      )}
    </div>
  );
}
