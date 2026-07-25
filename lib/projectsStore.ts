'use client';
import { useState, useCallback } from 'react';
import { Project, Task, TaskStatus, ChecklistItem } from './types';
import { useRetryFetch } from './useRetryFetch';
import { gravar, jsonComNulos } from './gravacao';

interface StoreState {
  projects: Project[];
  tasks: Task[];
}

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

/** Posição fracionária: encaixa um novo valor entre dois vizinhos sem precisar renumerar a coluna inteira. */
function midpointOrder(before: number | undefined, after: number | undefined): number {
  if (before === undefined && after === undefined) return Date.now();
  if (before === undefined) return after! - 1000;
  if (after === undefined) return before + 1000;
  return (before + after) / 2;
}

const patchTask = (taskId: string, data: Record<string, unknown>) => {
  gravar(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: jsonComNulos(data),
  });
};

export function useProjectsStore() {
  const [state, setState] = useState<StoreState>({ projects: [], tasks: [] });
  const [loaded, setLoaded] = useState(false);

  const erro = useRetryFetch(async () => {
    try {
      const r = await fetch('/api/projects');
      if (!r.ok) throw new Error('falha ao carregar projetos');
      const data: StoreState = await r.json();
      const valido = data && Array.isArray(data.projects) && Array.isArray(data.tasks);
      if (!valido) throw new Error('formato inesperado');
      setState(data);
    } finally {
      setLoaded(true);
    }
  });

  const createProject = useCallback((data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const p: Project = { ...data, id: uid(), createdAt: now(), updatedAt: now() };
    setState(s => ({ ...s, projects: [...s.projects, p] }));
    gravar('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos(p),
    });
  }, []);

  const updateProject = useCallback((id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    setState(s => ({ ...s, projects: s.projects.map(p => p.id === id ? { ...p, ...data, updatedAt: now() } : p) }));
    gravar(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos(data),
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState(s => ({ projects: s.projects.filter(p => p.id !== id), tasks: s.tasks.filter(t => t.projectId !== id) }));
    // apaga o projeto — as tasks somem juntas por causa do ON DELETE CASCADE no banco
    gravar(`/api/projects/${id}`, { method: 'DELETE' });
  }, []);

  const createTask = useCallback((projectId: string, data: Omit<Task, 'id' | 'projectId' | 'order' | 'createdAt' | 'updatedAt'>) => {
    const t: Task = { ...data, id: uid(), projectId, order: Date.now(), createdAt: now(), updatedAt: now() };
    setState(s => ({ ...s, tasks: [...s.tasks, t] }));
    gravar('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos(t),
    });
  }, []);

  const updateTask = useCallback((taskId: string, data: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => {
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...data, updatedAt: now() } : t) }));
    patchTask(taskId, data);
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== taskId) }));
    gravar(`/api/tasks/${taskId}`, { method: 'DELETE' });
  }, []);

  /** Muda o status e joga a task pro fim da nova coluna — usado pelos atalhos ←/→ que não têm posição de destino. */
  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    const order = Date.now();
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: newStatus, order, updatedAt: now() } : t) }));
    patchTask(taskId, { status: newStatus, order });
  }, []);

  /** Reordena dentro da coluna (ou muda de coluna numa posição específica) via drag-and-drop. */
  const reorderTask = useCallback((taskId: string, newStatus: TaskStatus, beforeId: string | null, afterId: string | null) => {
    const beforeOrder = beforeId ? state.tasks.find(t => t.id === beforeId)?.order : undefined;
    const afterOrder = afterId ? state.tasks.find(t => t.id === afterId)?.order : undefined;
    const newOrder = midpointOrder(beforeOrder, afterOrder);
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: newStatus, order: newOrder, updatedAt: now() } : t) }));
    patchTask(taskId, { status: newStatus, order: newOrder });
  }, [state.tasks]);

  // As três abaixo leem o checklist atual de `state.tasks` antes de decidir o novo array (não
  // de dentro do updater do setState, que o React pode invocar mais de uma vez).
  const toggleChecklistItem = useCallback((taskId: string, itemId: string) => {
    const tarefa = state.tasks.find(t => t.id === taskId);
    if (!tarefa) return;
    const checklist = tarefa.checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c);
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, checklist, updatedAt: now() } : t) }));
    patchTask(taskId, { checklist });
  }, [state.tasks]);

  const addChecklistItem = useCallback((taskId: string, title: string) => {
    const tarefa = state.tasks.find(t => t.id === taskId);
    if (!tarefa) return;
    const item: ChecklistItem = { id: uid(), title, done: false };
    const checklist = [...tarefa.checklist, item];
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, checklist, updatedAt: now() } : t) }));
    patchTask(taskId, { checklist });
  }, [state.tasks]);

  const removeChecklistItem = useCallback((taskId: string, itemId: string) => {
    const tarefa = state.tasks.find(t => t.id === taskId);
    if (!tarefa) return;
    const checklist = tarefa.checklist.filter(c => c.id !== itemId);
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, checklist, updatedAt: now() } : t) }));
    patchTask(taskId, { checklist });
  }, [state.tasks]);

  const getTasksByProject = useCallback((projectId: string) => {
    const tasks = state.tasks.filter(t => t.projectId === projectId).sort((a, b) => a.order - b.order);
    return {
      a_fazer: tasks.filter(t => t.status === 'a_fazer'),
      em_andamento: tasks.filter(t => t.status === 'em_andamento'),
      concluido: tasks.filter(t => t.status === 'concluido'),
    };
  }, [state.tasks]);

  return {
    projects: state.projects,
    tasks: state.tasks,
    loaded,
    erro,
    createProject, updateProject, deleteProject,
    createTask, updateTask, deleteTask,
    moveTask, reorderTask, toggleChecklistItem, addChecklistItem, removeChecklistItem,
    getTasksByProject,
  };
}
