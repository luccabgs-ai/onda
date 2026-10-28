'use client';
import React, { useState, useEffect } from 'react';
import { AlvoFoco, CronometroPreset, Habito } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useCronometrosStore, duracaoTotalMin } from '@/lib/cronometrosStore';
import { useCronometroSessao, presetDaSessao } from '@/lib/cronometroSessaoStore';
import { useHabitsStore } from '@/lib/habitsStore';
import { useProjectsStore } from '@/lib/projectsStore';
import { useRituaisStore } from '@/lib/rituaisStore';
import { useFocoStore, MINIMO_MIN_BLOCO_INTERROMPIDO } from '@/lib/focoStore';
import { toDateStr } from '@/lib/nutricao';
import EscolherFoco from './EscolherFoco';
import FimDeSessao from './FimDeSessao';
import TempoDeFoco from './TempoDeFoco';
import { CronometroClock } from './CronometroClock';
import CronometroFormModal from './CronometroFormModal';
import { Card } from '@/components/ui/Card';
import { IcTimer, IcEdit, IcTrash, IcArrowR, IcHabito } from '@/components/ui/icons';

interface Props {
  cronometrosStore: ReturnType<typeof useCronometrosStore>;
  sessaoStore: ReturnType<typeof useCronometroSessao>;
  habitsStore: ReturnType<typeof useHabitsStore>;
  projectsStore: ReturnType<typeof useProjectsStore>;
  rituaisStore: ReturnType<typeof useRituaisStore>;
  focoStore: ReturnType<typeof useFocoStore>;
  /** Tarefa vinda de "Focar nesta tarefa" (detalhe da tarefa) — abre a escolha já com ela. */
  tarefaParaFocar?: string | null;
  onTarefaParaFocarUsada?: () => void;
}

function formatarDuracao(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

function formatMMSS(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function PresetCard({
  preset, habitos, onStart, onEdit, onDelete,
}: {
  preset: CronometroPreset;
  habitos: Habito[];
  onStart: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const area = AREAS.find(a => a.id === preset.areaId);
  const color = area?.color ?? 'var(--ink)';
  const totalMin = duracaoTotalMin(preset.fases);
  const rounds = preset.fases.filter(f => f.tipo === 'foco').length;
  const focoFase = preset.fases.find(f => f.tipo === 'foco');
  const descansoFase = preset.fases.find(f => f.tipo === 'descanso');
  const habitoVinculado = preset.habitoId ? habitos.find(h => h.id === preset.habitoId) : undefined;

  return (
    <Card
      onClick={onStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      style={{
        padding: '16px 18px',
        cursor: 'pointer',
        borderLeft: `3px solid ${color}`,
        position: 'relative',
        transition: 'transform 0.12s, box-shadow 0.12s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 20px -8px rgba(20,38,74,0.25)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 500, marginBottom: 4 }}>
            {preset.nome}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--char-mute)' }}>
            {rounds > 1
              ? `${rounds}× ${focoFase?.minutos}min/${descansoFase?.minutos ?? 0}min · ${formatarDuracao(totalMin)} no total`
              : `${formatarDuracao(totalMin)} de foco`}
            {area && ` · ${area.name}`}
          </div>
          {habitoVinculado && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11, color: color }}>
              <IcHabito size={12} stroke={color} sw={1.6} />
              conclui &ldquo;{habitoVinculado.acao}&rdquo;
            </div>
          )}
        </div>

        {(onEdit || onDelete) && hovered ? (
          confirmDelete ? (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 10.5, color: 'var(--hanko)' }}>apagar?</span>
              <button onClick={() => onDelete?.()} style={{ fontSize: 11, fontWeight: 600, color: 'var(--hanko)', padding: '2px 6px' }}>sim</button>
              <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 11, color: 'var(--char-mute)', padding: '2px 6px' }}>não</button>
            </div>
          ) : (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              {onEdit && (
                <button onClick={onEdit} title="editar" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--char-mute)' }}>
                  <IcEdit size={13} stroke="var(--char-mute)" />
                </button>
              )}
              {onDelete && (
                <button onClick={() => setConfirmDelete(true)} title="apagar" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hanko)' }}>
                  <IcTrash size={13} stroke="var(--hanko)" />
                </button>
              )}
            </div>
          )
        ) : (
          <IcArrowR size={15} stroke="var(--char-mute)" />
        )}
      </div>
    </Card>
  );
}

function CronometroRunner({
  preset, sessaoStore, habitos, alvo, onPularFase, onEncerrar,
}: {
  preset: CronometroPreset;
  sessaoStore: ReturnType<typeof useCronometroSessao>;
  habitos: Habito[];
  alvo: { titulo: string; projeto?: string; cor?: string };
  onPularFase: () => void;
  onEncerrar: () => void;
}) {
  const { sessao, pausar, retomar, reiniciarFase } = sessaoStore;
  const [remainingMs, setRemainingMs] = useState(0);
  const [confirmarFim, setConfirmarFim] = useState(false);

  // Date.now() é impuro — não pode ser chamado durante o render. Ele mora só aqui dentro do
  // efeito, que recalcula o tempo restante a cada 250ms e guarda o resultado em estado puro.
  // Só exibe — avançar de fase e tocar o sino é responsabilidade do CronometroNotificacao,
  // que roda sempre (independente da tela ativa), não só enquanto esse componente tá montado.
  useEffect(() => {
    const tick = () => {
      if (!sessao) return;
      if (sessao.pausado) {
        setRemainingMs(sessao.pausadoRestanteMs ?? 0);
        return;
      }
      const remaining = new Date(sessao.faseTerminaEm).getTime() - Date.now();
      setRemainingMs(Math.max(0, remaining));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [sessao]);

  if (!sessao) return null;

  const area = AREAS.find(a => a.id === preset.areaId);
  const color = area?.color ?? 'var(--ink)';
  const faseAtual = preset.fases[sessao.faseIndex];
  const faseDurMs = faseAtual.minutos * 60 * 1000;
  const progresso = 1 - remainingMs / faseDurMs;
  const isLastFase = sessao.faseIndex === preset.fases.length - 1;

  const minutosFeitos = faseAtual.tipo === 'foco' ? (faseDurMs - remainingMs) / 60000 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 6 }}>
        {preset.nome}
      </div>
      {/* No que está focando — a tarefa (› projeto) ou o foco livre. */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, maxWidth: '100%', padding: '5px 14px', borderRadius: 16,
        background: 'color-mix(in srgb, var(--ink) 6%, transparent)', fontSize: 14, color: 'var(--char-soft)', marginBottom: 12,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: alvo.cor ?? 'var(--char-mute)', flexShrink: 0 }} />
        <span style={{ color: 'var(--char)', fontWeight: 500 }}>{alvo.titulo}</span>
        {alvo.projeto && <><span style={{ color: 'var(--char-mute)' }}>›</span>{alvo.projeto}</>}
      </div>
      {preset.habitoId && (
        <div style={{ fontSize: 11.5, color: 'var(--char-mute)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          <IcHabito size={12} stroke="var(--char-mute)" sw={1.6} />
          conclui &ldquo;{habitos.find(h => h.id === preset.habitoId)?.acao ?? '…'}&rdquo; ao terminar
        </div>
      )}

      <CronometroClock
        size={320}
        progresso={progresso}
        tempoLabel={formatMMSS(remainingMs)}
        faseLabel={faseAtual.tipo === 'foco' ? 'Foco' : 'Descanso'}
        faseJp={faseAtual.tipo === 'foco' ? '集中' : '休憩'}
        color={color}
        paused={sessao.pausado}
      />

      {/* Indicador de rodadas */}
      {preset.fases.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
          {preset.fases.map((f, i) => (
            <span
              key={i}
              title={f.tipo === 'foco' ? `Foco · ${f.minutos}min` : `Descanso · ${f.minutos}min`}
              style={{
                width: i === sessao.faseIndex ? 9 : 6,
                height: i === sessao.faseIndex ? 9 : 6,
                borderRadius: '50%',
                background: i <= sessao.faseIndex ? color : 'rgba(27,54,93,0.15)',
                opacity: i === sessao.faseIndex ? 1 : i < sessao.faseIndex ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Controles */}
      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <button
          onClick={() => (sessao.pausado ? retomar() : pausar())}
          style={{
            padding: '10px 26px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            background: color, color: 'white',
          }}
        >
          {sessao.pausado ? 'Retomar' : 'Pausar'}
        </button>
        <button
          onClick={() => reiniciarFase(preset)}
          style={{ padding: '10px 18px', borderRadius: 999, fontSize: 13, color: 'var(--char-soft)', border: '1px solid rgba(27,54,93,0.18)' }}
        >
          Reiniciar fase
        </button>
        {!isLastFase && (
          <button
            onClick={onPularFase}
            style={{ padding: '10px 18px', borderRadius: 999, fontSize: 13, color: 'var(--char-soft)', border: '1px solid rgba(27,54,93,0.18)' }}
          >
            Pular fase
          </button>
        )}
      </div>

      {confirmarFim ? (
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center', fontSize: 13 }}>
          <span style={{ color: 'var(--char-soft)' }}>
            {minutosFeitos >= MINIMO_MIN_BLOCO_INTERROMPIDO
              ? <>Encerrar? Os <strong>{Math.floor(minutosFeitos)} min</strong> feitos ficam guardados.</>
              : faseAtual.tipo === 'foco'
                ? `Encerrar? Com menos de ${MINIMO_MIN_BLOCO_INTERROMPIDO} min, esse tempo não é guardado.`
                : 'Encerrar a sessão?'}
          </span>
          <button onClick={onEncerrar} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12.5, border: '1px solid rgba(27,54,93,0.18)', color: 'var(--ink)' }}>
            encerrar
          </button>
          <button onClick={() => setConfirmarFim(false)} style={{ fontSize: 12.5, color: 'var(--char-mute)', textDecoration: 'underline' }}>
            continuar focando
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmarFim(true)}
          style={{ marginTop: 18, fontSize: 12, color: 'var(--char-mute)', textDecoration: 'underline' }}
        >
          Encerrar sessão
        </button>
      )}
    </div>
  );
}

export default function CronometrosScreen({
  cronometrosStore, sessaoStore, habitsStore, projectsStore, rituaisStore, focoStore, tarefaParaFocar, onTarefaParaFocarUsada,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CronometroPreset | null>(null);
  const [hoje] = useState(() => toDateStr(new Date()));
  // Cronômetro escolhido esperando a resposta de "no que você vai focar?" (+ tarefa já marcada).
  const [escolhendo, setEscolhendo] = useState<{ preset: CronometroPreset; taskId?: string } | null>(null);
  const [destaqueId, setDestaqueId] = useState<string | undefined>();

  const { presets, createPreset, updatePreset, deletePreset } = cronometrosStore;
  const { sessao, iniciar, parar, avancarFase } = sessaoStore;
  const { tasks, projects, moveTask, definirContador } = projectsStore;

  const presetAtivo = sessao ? presetDaSessao(sessao, presets) ?? null : null;

  const prontos = presets.filter(p => p.pronto);
  const customizados = presets.filter(p => !p.pronto);

  // "Focar nesta tarefa" (no detalhe da tarefa) chega aqui: a escolha já abre com a tarefa
  // marcada, no primeiro cronômetro pronto. Derivado no render — sem efeito copiando prop em estado.
  const padrao = prontos.find(p => p.id === 'pronto-foco-profundo') ?? prontos[0] ?? presets[0];
  const escolha = escolhendo ?? (tarefaParaFocar && !sessao && padrao ? { preset: padrao, taskId: tarefaParaFocar } : null);
  const fecharEscolha = () => { setEscolhendo(null); onTarefaParaFocarUsada?.(); };

  const handleSaveCreate = (data: { nome: string; fases: CronometroPreset['fases']; areaId?: string; habitoId?: string }) => {
    createPreset(data);
    setShowCreate(false);
  };

  const handleSaveEdit = (data: { nome: string; fases: CronometroPreset['fases']; areaId?: string; habitoId?: string }) => {
    if (editing) updatePreset(editing.id, data);
    setEditing(null);
  };

  const comecar = (preset: CronometroPreset, alvo: AlvoFoco) => {
    fecharEscolha();
    iniciar(preset, alvo);
  };

  // Pular ou encerrar no meio de um foco grava o tempo feito (se passou de 5 min).
  const pularFase = () => {
    if (!sessao || !presetAtivo) return;
    focoStore.registrarFaseAtual({ sessao, preset: presetAtivo, cheia: false, tasks, projects });
    avancarFase(presetAtivo);
  };
  const encerrar = () => {
    if (!sessao || !presetAtivo) return;
    const bloco = focoStore.registrarFaseAtual({ sessao, preset: presetAtivo, cheia: false, tasks, projects });
    const jaTinha = sessao.sessaoId ? focoStore.blocosDaSessao(sessao.sessaoId).length > 0 : false;
    if (sessao.sessaoId && (bloco || jaTinha)) focoStore.pedirAnotacao(sessao.sessaoId, true);
    parar();
  };

  const alvoDaSessao = () => {
    const task = sessao?.taskId ? tasks.find(t => t.id === sessao.taskId) : undefined;
    const project = task ? projects.find(p => p.id === task.projectId) : undefined;
    return task
      ? { titulo: task.title, projeto: project?.title, cor: project?.color }
      : { titulo: sessao?.rotulo || 'Foco livre' };
  };

  // Fim de sessão esperando o "o que avançou?" — vem do aviso global, então funciona mesmo se
  // a sessão acabou enquanto outra tela estava aberta.
  const aAnotar = focoStore.aAnotar;
  const blocosAnotar = aAnotar ? focoStore.blocosDaSessao(aAnotar.sessaoId) : [];
  if (aAnotar && blocosAnotar.length > 0 && !sessao) {
    const ultimo = blocosAnotar[blocosAnotar.length - 1];
    const task = ultimo.taskId ? tasks.find(t => t.id === ultimo.taskId) : undefined;
    const project = task ? projects.find(p => p.id === task.projectId) : undefined;
    const presetDoBloco = presets.find(p => p.id === ultimo.presetId);
    const guardar = (nota: string | undefined, concluirTarefa: boolean) => {
      if (nota) focoStore.anotar(ultimo.id, nota);
      if (concluirTarefa && task) moveTask(task.id, 'concluido');
      setDestaqueId(ultimo.id);
      focoStore.dispensarAnotacao();
    };
    return (
      <div style={{ padding: '40px 56px 80px', maxWidth: 880, margin: '0 auto' }}>
        <FimDeSessao
          key={aAnotar.sessaoId}
          blocos={blocosAnotar}
          encerradaCedo={aAnotar.encerradaCedo}
          task={task}
          project={project}
          onGuardar={guardar}
          onDefinirContador={valor => task && definirContador(task.id, valor)}
          onFazerDeNovo={presetDoBloco && (!task || task.status !== 'concluido') ? () => {
            focoStore.dispensarAnotacao();
            iniciar(presetDoBloco, task ? { taskId: task.id } : { rotulo: ultimo.rotulo });
          } : undefined}
        />
      </div>
    );
  }

  if (sessao && presetAtivo) {
    return (
      <div style={{ padding: '40px 56px 80px', maxWidth: 880, margin: '0 auto' }}>
        <CronometroRunner
          preset={presetAtivo}
          sessaoStore={sessaoStore}
          habitos={habitsStore.habitos}
          alvo={alvoDaSessao()}
          onPularFase={pularFase}
          onEncerrar={encerrar}
        />
      </div>
    );
  }

  // Sessão órfã — o preset foi apagado enquanto rodava.
  if (sessao && !presetAtivo) {
    return (
      <div style={{ padding: '40px 56px 80px', maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--char-mute)', fontStyle: 'italic', marginBottom: 16 }}>
          O cronômetro dessa sessão não existe mais.
        </p>
        <button onClick={parar} style={{ padding: '8px 18px', border: '1px solid rgba(27,54,93,0.18)', borderRadius: 999, fontSize: 13, color: 'var(--char-soft)' }}>
          Voltar
        </button>
      </div>
    );
  }

  const vitoriasTaskIds = (rituaisStore.registroDe(hoje, 'manha')?.vitorias ?? [])
    .filter(v => v.origem === 'task' && v.taskId).map(v => v.taskId!);

  return (
    <div style={{ padding: '40px 56px 80px', maxWidth: 1120, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 6 }}>
            tempo dedicado, com intenção
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <h1 className="serif" style={{ fontSize: 40, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>Cronômetros</h1>
            <span className="jp" style={{ fontSize: 22, color: 'var(--char-mute)', fontWeight: 400 }}>集中</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--char-soft)', maxWidth: 560, marginTop: 12, lineHeight: 1.65 }}>
            Escolha um cronômetro pronto ou crie o seu — blocos de foco corridos, ou rodadas
            no estilo Pomodoro, com descanso entre elas.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '9px 18px', background: 'var(--ink)', color: 'var(--washi)', borderRadius: 4, fontSize: 13, fontWeight: 500, flexShrink: 0 }}
        >
          + Novo cronômetro
        </button>
      </div>

      {/* Cronômetros à esquerda, tempo de foco à direita */}
      <div className="mobile-grid-1col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 26, alignItems: 'start' }}>
      <div>
      {/* Prontos */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 12 }}>
          Prontos pra começar
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {prontos.map(p => (
            <PresetCard key={p.id} preset={p} habitos={habitsStore.habitos} onStart={() => setEscolhendo({ preset: p })} />
          ))}
        </div>
      </div>

      {/* Customizados */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--char-mute)', marginBottom: 12 }}>
          Seus cronômetros
        </div>
        {customizados.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140, gap: 10, border: '1.5px dashed rgba(27,54,93,0.15)', borderRadius: 8 }}>
            <IcTimer size={28} stroke="var(--char-mute)" sw={1} />
            <div style={{ fontSize: 13, color: 'var(--char-mute)' }}>nenhum cronômetro seu ainda</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {customizados.map(p => (
              <PresetCard
                key={p.id}
                preset={p}
                habitos={habitsStore.habitos}
                onStart={() => setEscolhendo({ preset: p })}
                onEdit={() => setEditing(p)}
                onDelete={() => deletePreset(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      </div>
      <TempoDeFoco
        sessoes={focoStore.sessoes}
        hoje={hoje}
        projects={projects}
        destaqueId={destaqueId}
        onApagar={focoStore.apagar}
      />
      </div>

      {/* Modais */}
      {escolha && (
        <EscolherFoco
          preset={escolha.preset}
          tasks={tasks}
          projects={projects}
          hoje={hoje}
          vitoriasTaskIds={vitoriasTaskIds}
          inicial={escolha.taskId}
          onCancelar={fecharEscolha}
          onComecar={alvo => comecar(escolha.preset, alvo)}
        />
      )}
      {showCreate && (
        <CronometroFormModal habitos={habitsStore.habitos} onClose={() => setShowCreate(false)} onSave={handleSaveCreate} />
      )}
      {editing && (
        <CronometroFormModal preset={editing} habitos={habitsStore.habitos} onClose={() => setEditing(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
}
