'use client';
import React, { useState } from 'react';
import { AlvoFoco, CronometroFase, CronometroPreset, Habito, Project, Task } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { duracaoTotalMin } from '@/lib/cronometrosStore';
import { formatarMinutos, fasesDaSessaoRapida, POMODORO_DESCANSO_MIN } from '@/lib/focoStore';
import { DURACOES_RAPIDAS, lerSessaoRapida, guardarSessaoRapida } from '@/lib/cronometroSessaoStore';
import { tinta } from '@/components/organizacao/estilo';

interface Props {
  preset?: CronometroPreset;      // ausente = sessão rápida (tempo escolhido aqui, não vira cronômetro)
  tasks: Task[];
  projects: Project[];
  habitos: Habito[];
  hoje: string;
  vitoriasTaskIds: string[];      // tarefas escolhidas como vitória no ritual de hoje
  inicial?: string;               // tarefa já escolhida (veio de "Focar nesta tarefa")
  onCancelar: () => void;
  /** `fases` só vem na sessão rápida — as montadas a partir do tempo e das pausas escolhidos. */
  onComecar: (alvo: AlvoFoco, fases?: CronometroFase[]) => void;
}

const LIVRE = 'livre';
const HAB = 'hab:';

/**
 * "No que você vai focar?" — antes de começar um cronômetro. Uma coisa só: uma tarefa (o que está
 * em andamento, as vitórias de hoje, o que tem prazo, ou busca), um hábito de hoje (concluído no
 * fim) ou foco livre. Sem `preset`, é a sessão rápida: escolhe também o tempo e se tem pausas.
 */
export default function EscolherFoco({ preset, tasks, projects, habitos, hoje, vitoriasTaskIds, inicial, onCancelar, onComecar }: Props) {
  const rapida = !preset;
  const abertas = tasks.filter(t => t.status !== 'concluido');
  const fazendo = abertas.filter(t => t.status === 'em_andamento');
  const vitorias = abertas.filter(t => vitoriasTaskIds.includes(t.id) && !fazendo.includes(t));
  const comPrazo = abertas
    .filter(t => !!t.dueDate && t.dueDate <= hoje && !fazendo.includes(t) && !vitorias.includes(t))
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

  // `escolhido`: id da tarefa, `hab:<id>` de um hábito, ou LIVRE. Na sessão rápida o padrão é
  // foco livre; num cronômetro com hábito vinculado, esse hábito; senão, a tarefa mais provável.
  const [escolhido, setEscolhido] = useState<string>(inicial ?? (
    rapida ? LIVRE : preset.habitoId ? HAB + preset.habitoId : fazendo[0]?.id ?? vitorias[0]?.id ?? comPrazo[0]?.id ?? LIVRE));
  const [rotulo, setRotulo] = useState('');
  const [busca, setBusca] = useState('');
  const [config, setConfig] = useState(lerSessaoRapida);

  // Hábitos sugeridos: os de hoje ainda não feitos, e o vinculado ao cronômetro.
  const diaSemana = new Date(`${hoje}T12:00:00`).getDay();
  const habitosHoje = habitos.filter(h => (h.diasSemana.includes(diaSemana) && !h.votos[hoje]) || h.id === preset?.habitoId);

  const minutosRapida = Math.min(300, Math.max(1, Math.round(config.minutos) || 1));
  const fasesRapida = fasesDaSessaoRapida(minutosRapida, config.pausas);
  const focosRapida = fasesRapida.filter(f => f.tipo === 'foco').map(f => f.minutos);
  const duracaoTotal = rapida ? duracaoTotalMin(fasesRapida) : duracaoTotalMin(preset.fases);
  const mudarConfig = (mudanca: Partial<typeof config>) => {
    const nova = { ...config, ...mudanca };
    setConfig(nova);
    guardarSessaoRapida(nova);
  };

  const projeto = (t: Task) => projects.find(p => p.id === t.projectId);
  const q = busca.trim().toLowerCase();
  const achadas = q ? abertas.filter(t => t.title.toLowerCase().includes(q) || (projeto(t)?.title ?? '').toLowerCase().includes(q)) : [];
  const habitosAchados = q ? habitos.filter(h => h.acao.toLowerCase().includes(q)) : [];
  // A tarefa que veio de "Focar nesta tarefa" aparece mesmo se não estiver em nenhum grupo.
  const extra = inicial && !q ? abertas.filter(t => t.id === inicial && !fazendo.includes(t) && !vitorias.includes(t) && !comPrazo.includes(t)) : [];

  const alvoDe = (id: string): AlvoFoco =>
    id === LIVRE ? { rotulo } : id.startsWith(HAB) ? { habitoId: id.slice(HAB.length) } : { taskId: id };
  const comecar = (id = escolhido) => onComecar(alvoDe(id), rapida ? fasesRapida : undefined);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); comecar(); }
    if (e.key === 'Escape') onCancelar();
  };

  const grupo = (rotuloGrupo: string) => (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--char-mute)', margin: '12px 8px 4px' }}>
      {rotuloGrupo}
    </div>
  );

  const opcao = (t: Task, marca?: string) => {
    const p = projeto(t);
    const ativo = escolhido === t.id;
    const vencida = !!t.dueDate && t.dueDate < hoje;
    return (
      <button
        key={t.id}
        onClick={() => setEscolhido(t.id)}
        onDoubleClick={() => comecar(t.id)}
        style={{
          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 7,
          background: ativo ? tinta(10) : 'transparent', boxShadow: ativo ? 'inset 0 0 0 1px var(--ink)' : 'none',
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 3, background: p?.color ?? 'var(--char-mute)', flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, color: 'var(--char)' }}>{t.title}</span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--char-mute)' }}>
            {p?.title}{t.valorAlvo !== undefined && ` · ${t.valorAtual ?? 0}/${t.valorAlvo}${t.unidade ? ` ${t.unidade}` : ''}`}
          </span>
        </span>
        {(marca || vencida) && (
          <span style={{ fontSize: 10.5, color: 'var(--hanko)', whiteSpace: 'nowrap' }}>{vencida ? 'venceu' : marca}</span>
        )}
      </button>
    );
  };

  const opcaoHabito = (h: Habito) => {
    const area = AREAS.find(a => a.id === h.areaId);
    const id = HAB + h.id;
    const ativo = escolhido === id;
    return (
      <button
        key={h.id}
        onClick={() => setEscolhido(id)}
        onDoubleClick={() => comecar(id)}
        style={{
          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 7,
          background: ativo ? tinta(10) : 'transparent', boxShadow: ativo ? 'inset 0 0 0 1px var(--ink)' : 'none',
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: area?.color ?? 'var(--moss)', flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, color: 'var(--char)' }}>{h.acao}</span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--char-mute)' }}>
            hábito · {h.votos[hoje] ? 'já feito hoje' : 'marcado como feito ao terminar'}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div
      onClick={onCancelar}
      style={{
        position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20,38,74,0.5)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        role="dialog"
        aria-label="No que você vai focar?"
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
        style={{
          width: 'min(560px, 100%)', maxHeight: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--washi)', border: '1px solid var(--card-border)', borderRadius: 10,
          boxShadow: '0 30px 80px -20px rgba(20,38,74,0.45)',
        }}
      >
        <div style={{ padding: '18px 22px 12px', borderBottom: `1px solid ${tinta(8)}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>
            {rapida ? 'sessão rápida · não vira cronômetro' : `${preset.nome} · ${formatarMinutos(duracaoTotal)}`}
          </div>
          <h2 className="serif" style={{ fontSize: 25, fontStyle: 'italic', color: 'var(--ink)', margin: '2px 0 10px', fontWeight: 500 }}>
            {rapida ? 'Quanto tempo, e no quê?' : 'No que você vai focar?'}
          </h2>
          {rapida && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                {DURACOES_RAPIDAS.map(m => {
                  const ativo = minutosRapida === m;
                  return (
                    <button key={m} onClick={() => mudarConfig({ minutos: m })} style={{
                      padding: '7px 13px', borderRadius: 16, fontSize: 13, fontVariantNumeric: 'tabular-nums',
                      border: `1px solid ${ativo ? 'var(--ink)' : tinta(18)}`,
                      background: ativo ? 'var(--ink)' : 'transparent', color: ativo ? 'var(--washi)' : 'var(--char-soft)',
                    }}>
                      {formatarMinutos(m)}
                    </button>
                  );
                })}
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--char-mute)' }}>
                  ou
                  <input
                    type="number" min={1} max={300}
                    value={config.minutos || ''}
                    onChange={e => mudarConfig({ minutos: Number(e.target.value) })}
                    aria-label="minutos de foco"
                    style={{
                      width: 58, padding: '6px 7px', borderRadius: 6, border: `1px solid ${tinta(18)}`,
                      background: 'var(--card-bg)', fontSize: 13, color: 'var(--char)', fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                  min
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', borderRadius: 7, border: `1px solid ${tinta(18)}`, overflow: 'hidden' }}>
                  {([[false, 'direto'], [true, 'com pausas']] as const).map(([v, nome]) => (
                    <button key={nome} onClick={() => mudarConfig({ pausas: v })} style={{
                      padding: '6px 13px', fontSize: 12.5,
                      background: config.pausas === v ? tinta(12) : 'transparent',
                      color: config.pausas === v ? 'var(--ink)' : 'var(--char-mute)', fontWeight: config.pausas === v ? 600 : 400,
                    }}>
                      {nome}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--char-mute)', fontVariantNumeric: 'tabular-nums' }}>
                  {focosRapida.length > 1
                    ? `${focosRapida.join(' + ')} min, com ${POMODORO_DESCANSO_MIN} de pausa entre eles`
                    : config.pausas ? 'até 25 min não tem pausa' : 'um bloco só, sem pausa'}
                </span>
              </div>
            </div>
          )}
          <input
            autoFocus={!inicial}
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="buscar em tarefas abertas e hábitos…"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 6, border: `1px solid ${tinta(18)}`,
              background: 'var(--card-bg)', fontSize: 14, color: 'var(--char)',
            }}
          />
        </div>

        <div style={{ padding: '6px 14px 12px', overflowY: 'auto' }}>
          {q ? (
            <>
              {grupo('resultado da busca')}
              {achadas.length + habitosAchados.length === 0
                ? <p style={{ fontSize: 13, color: 'var(--char-mute)', margin: '6px 10px' }}>Nenhuma tarefa aberta ou hábito com esse nome.</p>
                : <>{achadas.map(t => opcao(t))}{habitosAchados.map(opcaoHabito)}</>}
            </>
          ) : (
            <>
              {extra.length > 0 && <>{grupo('escolhida')}{extra.map(t => opcao(t))}</>}
              {fazendo.length > 0 && <>{grupo('fazendo agora')}{fazendo.map(t => opcao(t))}</>}
              {vitorias.length > 0 && <>{grupo('vitórias de hoje')}{vitorias.map(t => opcao(t, 'vitória'))}</>}
              {comPrazo.length > 0 && <>{grupo('prazo hoje ou vencido')}{comPrazo.map(t => opcao(t, 'hoje'))}</>}
              {fazendo.length + vitorias.length + comPrazo.length + extra.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--char-mute)', margin: '10px 10px 0' }}>
                  Nada em andamento agora. Busque uma tarefa acima ou use o foco livre.
                </p>
              )}
            </>
          )}

          {!q && habitosHoje.length > 0 && <>{grupo('hábitos de hoje')}{habitosHoje.map(opcaoHabito)}</>}

          {grupo('sem tarefa nem hábito')}
          <button
            onClick={() => setEscolhido(LIVRE)}
            style={{
              width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 7,
              background: escolhido === LIVRE ? tinta(10) : 'transparent', boxShadow: escolhido === LIVRE ? 'inset 0 0 0 1px var(--ink)' : 'none',
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--char-mute)', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              <span style={{ fontSize: 14, color: 'var(--char)' }}>Foco livre</span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--char-mute)' }}>guarda só o tempo</span>
            </span>
          </button>
          {escolhido === LIVRE && (
            <input
              autoFocus
              value={rotulo}
              onChange={e => setRotulo(e.target.value)}
              placeholder="dar um nome (opcional): estudar, e-mails…"
              style={{
                margin: '4px 10px 6px 30px', width: 'calc(100% - 40px)', padding: '7px 10px', borderRadius: 5,
                border: `1px solid ${tinta(16)}`, background: 'var(--card-bg)', fontSize: 13, color: 'var(--char)',
              }}
            />
          )}
        </div>

        <div style={{ padding: '12px 18px', borderTop: `1px solid ${tinta(8)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <button onClick={onCancelar} style={{ fontSize: 12.5, color: 'var(--char-mute)', textDecoration: 'underline' }}>cancelar</button>
          <button
            onClick={() => comecar()}
            style={{ padding: '9px 18px', background: 'var(--ink)', color: 'var(--washi)', borderRadius: 5, fontSize: 13, fontWeight: 500 }}
          >
            Começar · {formatarMinutos(duracaoTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
