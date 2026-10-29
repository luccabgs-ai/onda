'use client';
import { useEffect, useState } from 'react';
import { AlvoFoco, CronometroPreset } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useCronometrosStore, duracaoTotalMin } from '@/lib/cronometrosStore';
import { useCronometroSessao, presetDaSessao } from '@/lib/cronometroSessaoStore';
import { useHabitsStore } from '@/lib/habitsStore';
import { useProjectsStore } from '@/lib/projectsStore';
import { useFocoStore, formatarMinutos, somaMinutos, MINIMO_MIN_BLOCO_INTERROMPIDO } from '@/lib/focoStore';
import { toDateStr } from '@/lib/nutricao';
import { BotoesContador, formatarValor } from '@/components/projetos/ProgressoTarefa';
import { Checkbox } from '@/components/ui/Checkbox';
import { CronometroClock } from '@/components/cronometros/CronometroClock';
import { tinta } from '@/components/organizacao/estilo';
import { cartao, kicker, botaoCheio, botaoContorno, Cabecalho, Secao, Vazio, NotaPc, Folha, OpcaoFolha } from './ui';

interface Props {
  cronometrosStore: ReturnType<typeof useCronometrosStore>;
  sessaoStore: ReturnType<typeof useCronometroSessao>;
  habitsStore: ReturnType<typeof useHabitsStore>;
  projectsStore: ReturnType<typeof useProjectsStore>;
  focoStore: ReturnType<typeof useFocoStore>;
}

const duracao = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h}h` : `${h}h${m}`;
};

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function descrever(p: CronometroPreset) {
  const rodadas = p.fases.filter(f => f.tipo === 'foco').length;
  const foco = p.fases.find(f => f.tipo === 'foco');
  const descanso = p.fases.find(f => f.tipo === 'descanso');
  return rodadas > 1
    ? `${rodadas}× ${foco?.minutos}/${descanso?.minutos ?? 0} min · ${duracao(duracaoTotalMin(p.fases))}`
    : `${duracao(duracaoTotalMin(p.fases))} de foco`;
}

/** O relógio da sessão em andamento. Só mostra — avançar de fase e tocar o sino é do CronometroNotificacao. */
function Relogio({ preset, sessaoStore, nomeHabito, alvo, onPular, onEncerrar }: {
  preset: CronometroPreset;
  sessaoStore: Props['sessaoStore'];
  nomeHabito?: string;
  alvo: { titulo: string; projeto?: string; cor?: string };
  onPular: () => void;      // pula a fase gravando o tempo feito (se passou de 5 min)
  onEncerrar: () => void;   // encerra gravando o tempo feito (se passou de 5 min)
}) {
  const { sessao, pausar, retomar, reiniciarFase } = sessaoStore;
  const [restanteMs, setRestanteMs] = useState(0);
  const [confirmarFim, setConfirmarFim] = useState(false);

  // Date.now() não pode rodar no render — o efeito recalcula o restante e guarda em estado.
  useEffect(() => {
    const tick = () => {
      if (!sessao) return;
      setRestanteMs(sessao.pausado ? sessao.pausadoRestanteMs ?? 0 : Math.max(0, new Date(sessao.faseTerminaEm).getTime() - Date.now()));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [sessao]);

  if (!sessao) return null;
  const cor = AREAS.find(a => a.id === preset.areaId)?.color ?? 'var(--ink)';
  const fase = preset.fases[sessao.faseIndex];
  const progresso = 1 - restanteMs / (fase.minutos * 60 * 1000);
  const ultima = sessao.faseIndex === preset.fases.length - 1;

  return (
    <div style={{ ...cartao, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 15px 16px' }}>
      <div style={kicker}>{preset.nome}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%', marginTop: 6, padding: '4px 12px', borderRadius: 14, background: tinta(6), fontSize: 13, color: 'var(--char-soft)' }}>
        <span style={{ width: 7, height: 7, borderRadius: 2, background: alvo.cor ?? 'var(--char-mute)', flexShrink: 0 }} />
        <span style={{ color: 'var(--char)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alvo.titulo}</span>
        {alvo.projeto && <span style={{ whiteSpace: 'nowrap' }}>› {alvo.projeto}</span>}
      </div>
      {nomeHabito && <div style={{ fontSize: 12, color: 'var(--char-mute)', marginTop: 3 }}>conclui “{nomeHabito}” ao terminar</div>}
      <div style={{ width: '100%', maxWidth: 270, aspectRatio: '1', margin: '6px 0 2px' }}>
        <CronometroClock
          size={270}
          progresso={progresso}
          tempoLabel={mmss(restanteMs)}
          faseLabel={fase.tipo === 'foco' ? 'Foco' : 'Descanso'}
          faseJp={fase.tipo === 'foco' ? '集中' : '休憩'}
          color={cor}
          paused={sessao.pausado}
        />
      </div>
      {preset.fases.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {preset.fases.map((f, i) => (
            <span key={i} style={{
              width: i === sessao.faseIndex ? 9 : 6, height: i === sessao.faseIndex ? 9 : 6, borderRadius: '50%',
              background: i <= sessao.faseIndex ? cor : tinta(15), opacity: i < sessao.faseIndex ? 0.5 : 1,
            }} />
          ))}
        </div>
      )}
      <button onClick={() => (sessao.pausado ? retomar() : pausar())} style={{ ...botaoCheio, background: cor, color: 'white' }}>
        {sessao.pausado ? 'Retomar' : 'Pausar'}
      </button>
      <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 8 }}>
        <button onClick={() => reiniciarFase(preset)} style={{ ...botaoContorno, flex: 1 }}>Reiniciar fase</button>
        {!ultima && <button onClick={onPular} style={{ ...botaoContorno, flex: 1 }}>Pular fase</button>}
      </div>
      {confirmarFim ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, fontSize: 13 }}>
          <span style={{ color: 'var(--hanko)' }}>
            {fase.tipo === 'foco' && progresso * fase.minutos >= MINIMO_MIN_BLOCO_INTERROMPIDO
              ? `Encerrar? Os ${Math.floor(progresso * fase.minutos)} min ficam guardados.`
              : 'Encerrar sem guardar o tempo?'}
          </span>
          <button onClick={onEncerrar} style={{ fontWeight: 600, color: 'var(--hanko)', minHeight: 36 }}>sim</button>
          <button onClick={() => setConfirmarFim(false)} style={{ color: 'var(--char-mute)', minHeight: 36 }}>não</button>
        </div>
      ) : (
        <button onClick={() => setConfirmarFim(true)} style={{ marginTop: 12, minHeight: 36, fontSize: 12.5, color: 'var(--char-mute)', textDecoration: 'underline' }}>
          Encerrar sessão
        </button>
      )}
    </div>
  );
}

/** Fim da sessão no celular: quanto foi e em quê, "o que avançou?" e concluir a tarefa ou mexer no contador. */
function FimDeFoco({ focoStore, projectsStore }: Pick<Props, 'focoStore' | 'projectsStore'>) {
  const [nota, setNota] = useState('');
  const [concluir, setConcluir] = useState(false);
  const aAnotar = focoStore.aAnotar!;
  const blocos = focoStore.blocosDaSessao(aAnotar.sessaoId);
  const ultimo = blocos[blocos.length - 1];
  const task = ultimo?.taskId ? projectsStore.tasks.find(t => t.id === ultimo.taskId) : undefined;
  const projeto = task ? projectsStore.projects.find(p => p.id === task.projectId) : undefined;
  if (!ultimo) return null;
  const guardar = (comNota: boolean) => {
    if (comNota && nota.trim()) focoStore.anotar(ultimo.id, nota.trim());
    if (concluir && task) projectsStore.moveTask(task.id, 'concluido');
    focoStore.dispensarAnotacao();
  };
  const mensuravel = task && task.valorAlvo !== undefined;
  return (
    <div style={{ ...cartao, borderColor: 'color-mix(in srgb, var(--hanko) 55%, transparent)', textAlign: 'center' }}>
      <span className="jp" style={{ fontSize: 30, color: 'var(--hanko)' }}>了</span>
      <div className="serif" style={{ fontSize: 24, fontStyle: 'italic', color: 'var(--ink)' }}>{aAnotar.encerradaCedo ? 'Sessão encerrada' : 'Foco concluído'}</div>
      <p style={{ fontSize: 14, color: 'var(--char-soft)', margin: '2px 0 14px' }}>
        <strong style={{ color: 'var(--ink)' }}>{formatarMinutos(somaMinutos(blocos))}</strong> em <em>{task?.title ?? ultimo.taskTitulo ?? ultimo.rotulo ?? 'foco livre'}</em>
        {projeto && <> · {projeto.title}</>}
      </p>
      <textarea rows={2} value={nota} onChange={e => setNota(e.target.value)} placeholder="O que avançou? (opcional)"
        style={{ width: '100%', padding: '11px 12px', borderRadius: 9, border: `1px solid ${tinta(16)}`, background: 'var(--card-bg)', fontSize: 16, resize: 'none' }} />
      {mensuravel && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, textAlign: 'left', marginTop: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: 13.5, minWidth: 0 }}>{task.title}
            <span style={{ display: 'block', fontSize: 12, color: 'var(--char-mute)' }}>{formatarValor(task.valorAtual ?? 0)}/{formatarValor(task.valorAlvo!)}{task.unidade ? ` ${task.unidade}` : ''}</span>
          </span>
          <BotoesContador atual={task.valorAtual ?? 0} alvo={task.valorAlvo!} onDefinir={v => projectsStore.definirContador(task.id, v)} grande />
        </div>
      )}
      {task && !mensuravel && task.status !== 'concluido' && (
        // A linha inteira alterna; o Checkbox fica sem onChange.
        <div onClick={() => setConcluir(c => !c)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--card-border)', cursor: 'pointer', fontSize: 14, textAlign: 'left' }}>
          <Checkbox checked={concluir} size={20} /> Concluir a tarefa
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={() => guardar(false)} style={{ ...botaoContorno, flex: 1 }}>Pular</button>
        <button onClick={() => guardar(true)} style={{ ...botaoCheio, flex: 2 }}>Guardar</button>
      </div>
    </div>
  );
}

/** "No que você vai focar?" antes de começar um cronômetro — tarefa ou foco livre. */
function EscolherAlvo({ preset, projectsStore, onComecar, onFechar }: {
  preset: CronometroPreset;
  projectsStore: Props['projectsStore'];
  onComecar: (alvo: AlvoFoco) => void;
  onFechar: () => void;
}) {
  const [rotulo, setRotulo] = useState('');
  const [hoje] = useState(() => toDateStr(new Date()));
  const { tasks, projects } = projectsStore;
  const abertas = tasks.filter(t => t.status !== 'concluido')
    .sort((a, b) => Number(b.status === 'em_andamento') - Number(a.status === 'em_andamento')
      || Number(!!b.dueDate && b.dueDate <= hoje) - Number(!!a.dueDate && a.dueDate <= hoje));
  return (
    <Folha sobre={`${preset.nome} · ${duracao(duracaoTotalMin(preset.fases))}`} titulo="No que você vai focar?" onFechar={onFechar}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={rotulo} onChange={e => setRotulo(e.target.value)} placeholder="foco livre: estudar, e-mails…"
          style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 10, border: `1px solid ${tinta(18)}`, background: 'var(--card-bg)', fontSize: 16 }} />
        <button onClick={() => onComecar({ rotulo })} style={botaoContorno}>livre</button>
      </div>
      <div style={{ ...kicker, margin: '14px 0 6px' }}>tarefas</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {abertas.slice(0, 12).map(t => {
          const p = projects.find(x => x.id === t.projectId);
          return (
            <OpcaoFolha key={t.id} cor={p?.color} texto={t.title}
              detalhe={t.status === 'em_andamento' ? 'fazendo' : t.dueDate && t.dueDate <= hoje ? 'prazo' : p?.title}
              onClick={() => onComecar({ taskId: t.id })} />
          );
        })}
        {abertas.length === 0 && <Vazio>Nenhuma tarefa aberta. Use o foco livre.</Vazio>}
      </div>
    </Folha>
  );
}

export default function FocoCelular({ cronometrosStore, sessaoStore, habitsStore, projectsStore, focoStore }: Props) {
  const { presets, loaded } = cronometrosStore;
  const { sessao, iniciar, avancarFase, parar } = sessaoStore;
  const { tasks, projects } = projectsStore;
  const [escolhendo, setEscolhendo] = useState<CronometroPreset | null>(null);
  // presetDaSessao: também acha a sessão avulsa de um bloco do calendário.
  const ativo = sessao ? presetDaSessao(sessao, presets) : undefined;
  const nomeHabito = (p?: CronometroPreset) => p?.habitoId ? habitsStore.habitos.find(h => h.id === p.habitoId)?.acao : undefined;
  const ordenados = [...presets].sort((a, b) => Number(!!b.pronto) - Number(!!a.pronto));

  const alvoDaSessao = () => {
    const t = sessao?.taskId ? tasks.find(x => x.id === sessao.taskId) : undefined;
    const p = t ? projects.find(x => x.id === t.projectId) : undefined;
    return t ? { titulo: t.title, projeto: p?.title, cor: p?.color } : { titulo: sessao?.rotulo || 'Foco livre' };
  };
  // Pular ou encerrar no meio de um foco grava o tempo feito (se passou de 5 min), como no PC.
  const pular = () => {
    if (!sessao || !ativo) return;
    focoStore.registrarFaseAtual({ sessao, preset: ativo, cheia: false, tasks, projects });
    avancarFase(ativo);
  };
  const encerrar = () => {
    if (!sessao || !ativo) return;
    const bloco = focoStore.registrarFaseAtual({ sessao, preset: ativo, cheia: false, tasks, projects });
    const jaTinha = sessao.sessaoId ? focoStore.blocosDaSessao(sessao.sessaoId).length > 0 : false;
    if (sessao.sessaoId && (bloco || jaTinha)) focoStore.pedirAnotacao(sessao.sessaoId, true);
    parar();
  };

  return (
    <div>
      <Cabecalho sobre="cronômetro" titulo="Foco" />

      {!sessao && focoStore.aAnotar && <FimDeFoco key={focoStore.aAnotar.sessaoId} focoStore={focoStore} projectsStore={projectsStore} />}
      {ativo && <Relogio preset={ativo} sessaoStore={sessaoStore} nomeHabito={nomeHabito(ativo)} alvo={alvoDaSessao()} onPular={pular} onEncerrar={encerrar} />}

      <Secao titulo={ativo ? 'outros blocos' : 'começar um bloco'} primeira={!ativo}>
        {!loaded ? <Vazio>carregando…</Vazio> : ordenados.length === 0 ? <Vazio>Nenhum cronômetro ainda.</Vazio> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ordenados.map(p => {
              const cor = AREAS.find(a => a.id === p.areaId)?.color ?? 'var(--ink)';
              const habito = nomeHabito(p);
              const bloqueado = !!sessao;
              return (
                <button
                  key={p.id}
                  onClick={() => !bloqueado && setEscolhendo(p)}
                  disabled={bloqueado}
                  style={{
                    ...cartao, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                    borderLeft: `3px solid ${cor}`, opacity: bloqueado && p.id !== ativo?.id ? 0.55 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="serif" style={{ fontSize: 18, color: 'var(--ink)', lineHeight: 1.2 }}>{p.nome}</div>
                    <div style={{ fontSize: 12, color: 'var(--char-mute)', marginTop: 2 }}>
                      {descrever(p)}{habito && ` · conclui “${habito}”`}
                    </div>
                  </div>
                  {!bloqueado && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Começar</span>}
                </button>
              );
            })}
          </div>
        )}
        {sessao && <p style={{ fontSize: 12, color: 'var(--char-mute)', margin: '8px 2px 0' }}>Encerre a sessão atual pra começar outra.</p>}
      </Secao>

      <NotaPc>Criar e editar cronômetros continua no computador, por enquanto.</NotaPc>

      {escolhendo && (
        <EscolherAlvo
          preset={escolhendo}
          projectsStore={projectsStore}
          onFechar={() => setEscolhendo(null)}
          onComecar={alvo => { iniciar(escolhendo, alvo); setEscolhendo(null); }}
        />
      )}
    </div>
  );
}
