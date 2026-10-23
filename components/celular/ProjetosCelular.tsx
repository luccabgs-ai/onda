'use client';
import { useState } from 'react';
import { Project, Task, TaskStatus } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useProjectsStore } from '@/lib/projectsStore';
import { toDateStr } from '@/lib/nutricao';
import TaskDetailModal from '@/components/projetos/TaskDetailModal';
import TaskFormModal from '@/components/projetos/TaskFormModal';
import { LinhaProgresso } from '@/components/projetos/ProgressoTarefa';
import { tinta } from '@/components/organizacao/estilo';
import { cartao, botaoContorno, Cabecalho, Vazio, NotaPc } from './ui';

type Store = ReturnType<typeof useProjectsStore>;
type DadosTarefa = Omit<Task, 'id' | 'projectId' | 'order' | 'createdAt' | 'updatedAt'>;

const ETAPAS: { id: TaskStatus; rotulo: string; proxima?: TaskStatus; acao?: string }[] = [
  { id: 'a_fazer', rotulo: 'A fazer', proxima: 'em_andamento', acao: 'começar' },
  { id: 'em_andamento', rotulo: 'Fazendo', proxima: 'concluido', acao: 'concluir' },
  { id: 'concluido', rotulo: 'Feito', proxima: 'em_andamento', acao: 'reabrir' },
];

const dataCurta = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');

function ListaDeProjetos({ store, hoje, onAbrir }: { store: Store; hoje: string; onAbrir: (p: Project) => void }) {
  const { projects, tasks, loaded } = store;
  const resumo = (p: Project) => {
    const ts = tasks.filter(t => t.projectId === p.id);
    return {
      fazendo: ts.filter(t => t.status === 'em_andamento').length,
      afazer: ts.filter(t => t.status === 'a_fazer').length,
      feitas: ts.filter(t => t.status === 'concluido').length,
      total: ts.length,
    };
  };
  // Projetos com algo em andamento primeiro — é onde a atenção já está.
  const ordenados = [...projects].sort((a, b) =>
    Number(resumo(b).fazendo > 0) - Number(resumo(a).fazendo > 0) || a.title.localeCompare(b.title));

  return (
    <div>
      <Cabecalho sobre={`${projects.length} projetos`} titulo="Projetos" />
      {!loaded ? <Vazio>carregando…</Vazio> : projects.length === 0 ? <Vazio>Nenhum projeto ainda.</Vazio> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ordenados.map(p => {
            const r = resumo(p);
            const area = AREAS.find(a => a.id === p.areaId);
            const vencido = !!p.dueDate && p.dueDate < hoje;
            return (
              <button key={p.id} onClick={() => onAbrir(p)} style={{ ...cartao, textAlign: 'left', display: 'block', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, color: 'var(--char)' }}>{p.title}</span>
                  <span aria-hidden style={{ color: 'var(--char-mute)', fontSize: 16 }}>›</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--char-mute)', margin: '4px 0 9px 20px' }}>
                  {[area?.name, r.fazendo ? `${r.fazendo} fazendo` : null, r.afazer ? `${r.afazer} a fazer` : null].filter(Boolean).join(' · ') || 'sem tarefas'}
                  {p.dueDate && <span style={{ color: vencido ? 'var(--hanko)' : undefined }}> · até {dataCurta(p.dueDate)}</span>}
                </div>
                {r.total > 0 && (
                  <div style={{ height: 4, borderRadius: 2, background: tinta(9), overflow: 'hidden', marginLeft: 20 }}>
                    <div style={{ height: '100%', width: `${(r.feitas / r.total) * 100}%`, background: p.color }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
      <NotaPc>Criar e editar projetos continua no computador, por enquanto.</NotaPc>
    </div>
  );
}

function Projeto({ projeto, store, hoje, onVoltar }: { projeto: Project; store: Store; hoje: string; onVoltar: () => void }) {
  const [etapa, setEtapa] = useState<TaskStatus>('em_andamento');
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [editando, setEditando] = useState<Task | null>(null);
  const [criando, setCriando] = useState(false);

  const tarefas = store.tasks.filter(t => t.projectId === projeto.id);
  const daEtapa = tarefas.filter(t => t.status === etapa).sort((a, b) => a.order - b.order);
  const cfg = ETAPAS.find(e => e.id === etapa)!;
  const detalhe = detalheId ? store.tasks.find(t => t.id === detalheId) : undefined;

  const salvarEdicao = (data: DadosTarefa) => {
    if (!editando) return;
    store.updateTask(editando.id, data);
    // Mesma regra do PC: baixar a meta pra um valor que o contador já alcançou conclui a etapa.
    const atual = store.tasks.find(t => t.id === editando.id)?.valorAtual ?? 0;
    if (data.valorAlvo !== undefined && atual >= data.valorAlvo && data.status !== 'concluido') store.moveTask(editando.id, 'concluido');
    setEditando(null);
  };

  return (
    <div>
      <button onClick={onVoltar} style={{ fontSize: 14, color: 'var(--ink)', minHeight: 36, marginBottom: 2 }}>‹ Projetos</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: projeto.color, flexShrink: 0 }} />
        <h1 className="serif" style={{ fontSize: 28, color: 'var(--ink)', margin: 0, fontWeight: 500, lineHeight: 1.1 }}>{projeto.title}</h1>
      </div>
      {projeto.description && <p style={{ fontSize: 13, color: 'var(--char-soft)', margin: '4px 0 0', lineHeight: 1.5 }}>{projeto.description}</p>}

      {/* O quadro de três colunas não cabe no celular — vira três abas. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: tinta(6), borderRadius: 10, padding: 3, margin: '16px 0 12px' }}>
        {ETAPAS.map(e => {
          const ativo = e.id === etapa;
          return (
            <button key={e.id} onClick={() => setEtapa(e.id)} style={{
              minHeight: 36, borderRadius: 8, fontSize: 13,
              background: ativo ? 'var(--washi)' : 'transparent',
              color: ativo ? 'var(--ink)' : 'var(--char-soft)', fontWeight: ativo ? 600 : 400,
              boxShadow: ativo ? `0 1px 3px ${tinta(18)}` : 'none',
            }}>
              {e.rotulo} <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>{tarefas.filter(t => t.status === e.id).length}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {daEtapa.length === 0 && <Vazio>Nada aqui.</Vazio>}
        {daEtapa.map(t => {
          const vencida = !!t.dueDate && t.dueDate < hoje && t.status !== 'concluido';
          const checklistFeitos = t.checklist.filter(c => c.done).length;
          return (
            <div key={t.id} onClick={() => setDetalheId(t.id)} style={{ ...cartao, padding: '12px 13px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14.5, lineHeight: 1.35,
                    color: t.status === 'concluido' ? 'var(--char-mute)' : 'var(--char)',
                    textDecoration: t.status === 'concluido' ? 'line-through' : 'none',
                  }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--char-mute)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {t.dueDate && <span style={{ color: vencida ? 'var(--hanko)' : undefined }}>{vencida ? 'venceu ' : ''}{dataCurta(t.dueDate)}</span>}
                    {t.checklist.length > 0 && <span>{checklistFeitos}/{t.checklist.length} itens</span>}
                    {t.priority === 'alta' && <span style={{ color: 'var(--hanko)' }}>prioridade alta</span>}
                  </div>
                </div>
                {cfg.proxima && (
                  <button
                    onClick={e => { e.stopPropagation(); store.moveTask(t.id, cfg.proxima!); }}
                    style={{ ...botaoContorno, minHeight: 34, padding: '5px 11px', fontSize: 12, flexShrink: 0 }}
                  >
                    {cfg.acao}
                  </button>
                )}
              </div>
              {t.valorAlvo !== undefined && (
                <div style={{ marginTop: 9 }}>
                  <LinhaProgresso atual={t.valorAtual ?? 0} alvo={t.valorAlvo} cor={projeto.color} />
                </div>
              )}
            </div>
          );
        })}
        <button onClick={() => setCriando(true)} style={{ ...botaoContorno, marginTop: 4, alignSelf: 'flex-start' }}>+ nova tarefa</button>
      </div>

      {detalhe && !editando && (
        <TaskDetailModal
          task={detalhe}
          project={projeto}
          onClose={() => setDetalheId(null)}
          onEdit={() => setEditando(detalhe)}
          onDelete={() => { store.deleteTask(detalhe.id); setDetalheId(null); }}
          onMove={s => store.moveTask(detalhe.id, s)}
          onToggleChecklist={itemId => store.toggleChecklistItem(detalhe.id, itemId)}
          onReorderChecklist={novaOrdem => store.updateTask(detalhe.id, { checklist: novaOrdem })}
          onDefinirContador={valor => store.definirContador(detalhe.id, valor)}
        />
      )}
      {editando && (
        <TaskFormModal task={editando} projectId={projeto.id} onClose={() => setEditando(null)} onSave={salvarEdicao} />
      )}
      {criando && (
        <TaskFormModal
          projectId={projeto.id}
          initialStatus={etapa === 'concluido' ? 'a_fazer' : etapa}
          onClose={() => setCriando(false)}
          onSave={data => { store.createTask(projeto.id, data); setCriando(false); setEtapa(data.status); }}
        />
      )}
    </div>
  );
}

export default function ProjetosCelular({ store }: { store: Store }) {
  const [hoje] = useState(() => toDateStr(new Date()));
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const aberto = abertoId ? store.projects.find(p => p.id === abertoId) : undefined;

  return aberto
    ? <Projeto key={aberto.id} projeto={aberto} store={store} hoje={hoje} onVoltar={() => setAbertoId(null)} />
    : <ListaDeProjetos store={store} hoje={hoje} onAbrir={p => setAbertoId(p.id)} />;
}

