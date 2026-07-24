'use client';
import React, { useState } from 'react';
import { Project } from '@/lib/types';
import { useProjectsStore } from '@/lib/projectsStore';
import { AREAS } from '@/lib/data';
import { Card } from '@/components/ui/Card';
import { IcKanban } from '@/components/ui/icons';
import ProjectFormModal from './ProjectFormModal';

interface ProjetosScreenProps {
  onOpenProject: (project: Project) => void;
  store: ReturnType<typeof useProjectsStore>;
}

function ProjectMenu({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color: 'var(--char-mute)',
          lineHeight: 1,
        }}
        title="Opções"
      >
        ⋯
      </button>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={e => { e.stopPropagation(); setOpen(false); }}
          />
          <div style={{
            position: 'absolute',
            top: 28,
            right: 0,
            zIndex: 20,
            background: 'var(--washi)',
            border: '1px solid rgba(27,54,93,0.15)',
            borderRadius: 6,
            boxShadow: '0 8px 24px -6px rgba(20,38,74,0.20)',
            minWidth: 140,
            overflow: 'hidden',
          }}>
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onEdit(); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: 13,
                color: 'var(--char)',
                borderBottom: '1px solid rgba(27,54,93,0.08)',
              }}
            >
              Editar
            </button>
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: 13,
                color: 'var(--hanko)',
              }}
            >
              Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type ProjectStatus = 'em_andamento' | 'nao_iniciado' | 'finalizado';

function getProjectStatus(projectId: string, tasks: ReturnType<typeof useProjectsStore>['tasks']): ProjectStatus {
  const pt = tasks.filter(t => t.projectId === projectId);
  if (pt.length === 0) return 'nao_iniciado';
  if (pt.every(t => t.status === 'concluido')) return 'finalizado';
  if (pt.every(t => t.status === 'a_fazer')) return 'nao_iniciado';
  return 'em_andamento';
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; jp: string; color: string; dot: string }> = {
  em_andamento: { label: 'Em andamento',  jp: '進行中', color: 'var(--ink)',       dot: 'var(--ink)' },
  nao_iniciado: { label: 'Não iniciado',  jp: '未着手', color: 'var(--char-soft)', dot: 'var(--char-mute)' },
  finalizado:   { label: 'Concluídos',    jp: '完了',   color: 'var(--moss)',       dot: 'var(--moss)' },
};

const STATUS_ORDER: ProjectStatus[] = ['em_andamento', 'nao_iniciado', 'finalizado'];

function ProjectCard({
  project,
  tasks,
  onOpen,
  onEdit,
  onDelete,
}: {
  project: Project;
  tasks: ReturnType<typeof useProjectsStore>['tasks'];
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pt = tasks.filter(t => t.projectId === project.id);
  const done = pt.filter(t => t.status === 'concluido').length;
  const progress = pt.length > 0 ? done / pt.length : 0;
  const area = project.areaId ? AREAS.find(a => a.id === project.areaId) : undefined;

  return (
    <Card
      style={{ padding: 0, cursor: 'pointer', overflow: 'hidden' }}
      onClick={onOpen}
    >
      <div style={{ height: 4, background: project.color }} />
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
          <h3 className="serif" style={{ fontSize: 19, color: 'var(--ink)', margin: 0, fontWeight: 500, lineHeight: 1.3, flex: 1 }}>
            {project.title}
          </h3>
          <div onClick={e => e.stopPropagation()}>
            <ProjectMenu project={project} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
        {area && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: area.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--char-mute)', fontWeight: 500 }}>{area.name}</span>
          </div>
        )}
        {project.description && (
          <p style={{
            fontSize: 13, color: 'var(--char-soft)', margin: '0 0 10px', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {project.description}
          </p>
        )}
        <div style={{ fontSize: 12, color: 'var(--char-mute)', marginBottom: 10 }}>
          {pt.length} {pt.length === 1 ? 'tarefa' : 'tarefas'} · {done} concluída{done !== 1 ? 's' : ''}
        </div>
        <div style={{ height: 4, background: 'rgba(27,54,93,0.10)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: project.color, borderRadius: 999, transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </Card>
  );
}

export default function ProjetosScreen({ onOpenProject, store }: ProjetosScreenProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [collapsedFinalizados, setCollapsedFinalizados] = useState(false);
  const [filterArea, setFilterArea] = useState<string | null>(null);

  const handleCreate = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    store.createProject(data);
    setShowCreate(false);
  };

  const handleEdit = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProject) {
      store.updateProject(editingProject.id, data);
      setEditingProject(null);
    }
  };

  const filteredProjects = filterArea
    ? store.projects.filter(p => p.areaId === filterArea)
    : store.projects;

  const grouped = STATUS_ORDER.reduce<Record<ProjectStatus, Project[]>>((acc, s) => {
    acc[s] = filteredProjects.filter(p => getProjectStatus(p.id, store.tasks) === s);
    return acc;
  }, { em_andamento: [], nao_iniciado: [], finalizado: [] });

  return (
    <div style={{ padding: '40px 48px 80px', maxWidth: 1180 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--char-mute)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
            seus projetos
          </div>
          <h1 className="serif" style={{ fontSize: 36, color: 'var(--ink)', margin: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
            Projetos
            <span className="jp" style={{ fontSize: 26, color: 'var(--char-mute)', fontWeight: 400, opacity: 0.65 }}>企画</span>
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '9px 18px', background: 'var(--ink)', color: 'var(--washi)',
            borderRadius: 4, fontSize: 13, fontWeight: 500,
          }}
        >
          + Novo Projeto
        </button>
      </div>

      {/* Area filter chips */}
      {store.projects.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          <button
            onClick={() => setFilterArea(null)}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
              border: !filterArea ? 'none' : '1px solid var(--card-border)',
              background: !filterArea ? 'var(--ink)' : 'var(--card-bg)',
              color: !filterArea ? 'white' : 'var(--char-soft)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            Todas as áreas
          </button>
          {AREAS.map(area => {
            const active = filterArea === area.id;
            return (
              <button
                key={area.id}
                onClick={() => setFilterArea(active ? null : area.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                  border: active ? 'none' : '1px solid var(--card-border)',
                  background: active ? area.color : 'var(--card-bg)',
                  color: active ? 'white' : 'var(--char-soft)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: active ? 'rgba(255,255,255,0.8)' : area.color,
                  flexShrink: 0,
                }} />
                {area.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {store.projects.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 12 }}>
          <IcKanban size={40} stroke="var(--char-mute)" sw={1} />
          <div style={{ fontSize: 16, color: 'var(--char-soft)', fontWeight: 500 }}>Nenhum projeto ainda</div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ padding: '8px 18px', border: '1px solid rgba(27,54,93,0.20)', borderRadius: 4, fontSize: 13, color: 'var(--ink)', marginTop: 4 }}
          >
            Crie seu primeiro projeto
          </button>
        </div>
      )}

      {/* No results for filter */}
      {store.projects.length > 0 && filteredProjects.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 8 }}>
          <div style={{ fontSize: 14, color: 'var(--char-mute)', fontStyle: 'italic' }}>
            Nenhum projeto nessa área ainda
          </div>
        </div>
      )}

      {/* Sections */}
      {filteredProjects.length > 0 && STATUS_ORDER.map(status => {
        const projects = grouped[status];
        if (projects.length === 0) return null;
        const cfg = STATUS_CONFIG[status];
        const isFinalizados = status === 'finalizado';
        const collapsed = isFinalizados && collapsedFinalizados;

        return (
          <div key={status} style={{ marginBottom: 40 }}>
            {/* Section header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: collapsed ? 0 : 16,
                cursor: isFinalizados ? 'pointer' : 'default',
              }}
              onClick={isFinalizados ? () => setCollapsedFinalizados(v => !v) : undefined}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: cfg.dot, flexShrink: 0,
              }} />
              <span className="serif" style={{ fontSize: 17, color: cfg.color, fontWeight: 500 }}>
                {cfg.label}
              </span>
              <span className="jp" style={{ fontSize: 11, color: 'var(--char-mute)', opacity: 0.7 }}>
                {cfg.jp}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: 'var(--char-mute)',
                background: 'rgba(27,54,93,0.07)',
                borderRadius: 999,
                padding: '1px 8px',
              }}>
                {projects.length}
              </span>
              {isFinalizados && (
                <span style={{ fontSize: 13, color: 'var(--char-mute)', marginLeft: 'auto' }}>
                  {collapsed ? '▸' : '▾'}
                </span>
              )}
              <div style={{ flex: isFinalizados ? 0 : 1, height: 1, background: 'var(--card-border)', marginLeft: isFinalizados ? 0 : 4 }} />
            </div>

            {/* Project grid */}
            {!collapsed && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    tasks={store.tasks}
                    onOpen={() => onOpenProject(project)}
                    onEdit={() => setEditingProject(project)}
                    onDelete={() => store.deleteProject(project.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Modals */}
      {showCreate && (
        <ProjectFormModal onClose={() => setShowCreate(false)} onSave={handleCreate} />
      )}
      {editingProject && (
        <ProjectFormModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}
