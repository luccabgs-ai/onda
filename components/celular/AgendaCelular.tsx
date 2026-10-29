'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CalendarEvent } from '@/lib/types';
import { useCalendarStore } from '@/lib/calendarStore';
import { useProjectsStore } from '@/lib/projectsStore';
import { useFocoStore, formatarMinutos } from '@/lib/focoStore';
import { toDateStr, addDays } from '@/lib/nutricao';
import { periodoDe, diasDoPeriodo } from '@/lib/ciclos';
import { itensComHora, feitosDoDia, estadoDoBloco, resumoDoDia, eventosDoDia, corteDoDia, paraHora, paraMin, ItemAgenda } from '@/lib/agenda';
import { tinta } from '@/components/organizacao/estilo';
import { cartao, kicker, botaoCheio, botaoContorno, Cabecalho, Folha, OpcaoFolha } from './ui';

interface Props {
  calendarStore: ReturnType<typeof useCalendarStore>;
  projectsStore: ReturnType<typeof useProjectsStore>;
  focoStore: ReturnType<typeof useFocoStore>;
  sessaoRodando: boolean;
  onComecarBloco: (ev: CalendarEvent) => void;
}

type Modo = 'dia' | 'semana' | 'mes';
type FolhaAgenda =
  | { tipo: 'novo'; ini: number; dur: number; evento: boolean; alvo: string; titulo: string }
  | { tipo: 'bloco'; id: string }
  | { tipo: 'evento'; id: string };

const PXH = 46;                 // px por hora na linha do tempo do celular
const INICIO = 6 * 60, FIM = 24 * 60;
const y = (m: number) => ((m - INICIO) / 60) * PXH;
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const diaLongo = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '');

/**
 * Aba Agenda do celular: Dia (linha do tempo plano | feito, igual à do PC, mas por toque),
 * Semana (lista dos 7 dias) e Mês (grade). Tocar num horário vazio cria; tocar num bloco
 * deixa começar, mover de 15 em 15, mudar a duração ou apagar.
 */
export default function AgendaCelular({ calendarStore, projectsStore, focoStore, sessaoRodando, onComecarBloco }: Props) {
  const [hoje] = useState(() => toDateStr(new Date()));
  const [agora, setAgora] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  const [modo, setModo] = useState<Modo>('dia');
  const [dia, setDia] = useState(hoje);
  const [folha, setFolha] = useState<FolhaAgenda | null>(null);
  const [apagando, setApagando] = useState(false);
  const agoraRef = useRef<HTMLDivElement>(null);
  const topoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setAgora(d.getHours() * 60 + d.getMinutes()); }, 30000);
    return () => clearInterval(id);
  }, []);

  // Abrir o Dia de hoje já mostra o agora; outro dia começa pela manhã.
  useEffect(() => {
    if (modo !== 'dia') return;
    const alvo = dia === hoje ? agoraRef.current : topoRef.current;
    alvo?.scrollIntoView({ block: dia === hoje ? 'center' : 'start' });
  }, [modo, dia, hoje]);

  const { events } = calendarStore;
  const { tasks, projects } = projectsStore;
  const abertas = tasks.filter(t => t.status !== 'concluido')
    .sort((a, b) => Number(b.status === 'em_andamento') - Number(a.status === 'em_andamento'));
  const corDe = (ev: CalendarEvent) => ev.type === 'foco' ? projects.find(p => p.id === ev.projectId)?.color ?? 'var(--char-mute)' : 'var(--ink)';

  const abrirDia = (d: string) => { setDia(d); setModo('dia'); };
  const novo = (ini: number) => {
    setApagando(false);
    setFolha({ tipo: 'novo', ini, dur: 60, evento: false, alvo: abertas[0]?.id ?? 'livre', titulo: '' });
  };

  // ── Dia ──
  const itens = itensComHora(events, dia);
  const feitos = feitosDoDia(focoStore.sessoes, dia);
  const corte = corteDoDia(dia, hoje, agora);
  const diaTodo = eventosDoDia(events, dia).filter(e => !e.time);
  const prazos = tasks.filter(t => t.dueDate === dia && t.status !== 'concluido');
  const horas: number[] = [];
  for (let m = INICIO; m < FIM; m += 60) horas.push(m);

  const vistaDia = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <button onClick={() => setDia(addDays(dia, -1))} aria-label="dia anterior" style={{ ...botaoContorno, width: 38, padding: 0, borderRadius: '50%' }}>‹</button>
        <button onClick={() => setDia(hoje)} className="serif" style={{ fontSize: 19, color: 'var(--ink)', textAlign: 'center' }}>
          {diaLongo(dia)}{dia === hoje && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'var(--hanko)', marginLeft: 6 }}>hoje</span>}
        </button>
        <button onClick={() => setDia(addDays(dia, 1))} aria-label="próximo dia" style={{ ...botaoContorno, width: 38, padding: 0, borderRadius: '50%' }}>›</button>
      </div>

      {(diaTodo.length > 0 || prazos.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {diaTodo.map(e => (
            <button key={e.id} onClick={() => setFolha({ tipo: 'evento', id: e.id })} style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 12,
              background: e.type === 'comemoracao' ? 'color-mix(in srgb, var(--hanko) 12%, transparent)' : tinta(8),
              color: e.type === 'comemoracao' ? 'var(--hanko)' : 'var(--ink)',
            }}>{e.title}</button>
          ))}
          {prazos.map(t => <span key={t.id} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12, background: tinta(8), color: 'var(--ink)' }}>prazo: {t.title}</span>)}
        </div>
      )}

      <div ref={topoRef} style={{ position: 'relative', border: '1px solid var(--card-border)', borderRadius: 12, background: 'var(--card-bg)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '38px minmax(0, 1fr) 74px', borderBottom: '1px solid var(--card-border)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>
          <span /><span style={{ padding: '6px' }}>plano</span><span style={{ padding: '6px', borderLeft: `1px dashed ${tinta(14)}` }}>feito</span>
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '38px minmax(0, 1fr) 74px', height: y(FIM) }}>
          <div style={{ position: 'relative' }}>
            {horas.filter(m => m > INICIO).map(m => (
              <span key={m} style={{ position: 'absolute', right: 5, top: y(m), transform: 'translateY(-50%)', fontSize: 10, color: 'var(--char-mute)', fontVariantNumeric: 'tabular-nums' }}>{paraHora(m)}</span>
            ))}
          </div>

          {/* plano: cada hora vazia é um botão que cria ali */}
          <div style={{ position: 'relative' }}>
            {corte > INICIO && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: y(Math.min(corte, FIM)), background: 'color-mix(in srgb, var(--char-mute) 6%, transparent)', pointerEvents: 'none' }} />}
            {horas.map(m => (
              <button key={m} onClick={() => novo(m)} aria-label={`criar às ${paraHora(m)}`} style={{
                position: 'absolute', left: 0, right: 0, top: y(m), height: PXH, borderTop: `1px solid ${tinta(7)}`,
              }} />
            ))}
            {itens.map((it: ItemAgenda) => {
              const foco = it.ev.type === 'foco';
              const cor = corDe(it.ev);
              const alt = Math.max(18, y(it.fim) - y(it.ini) - 2);
              const est = foco ? estadoDoBloco(it, feitos, corte) : null;
              return (
                <button key={it.ev.id} onClick={() => { setApagando(false); setFolha({ tipo: foco ? 'bloco' : 'evento', id: it.ev.id }); }} style={{
                  position: 'absolute', left: 4, right: 5, top: y(it.ini), height: alt, borderRadius: 6, padding: '3px 7px', overflow: 'hidden',
                  textAlign: 'left', fontSize: 11.5, lineHeight: 1.25,
                  ...(foco
                    ? { background: `color-mix(in srgb, ${cor} 10%, var(--washi))`, border: `1.5px dashed ${cor}`, color: 'var(--char)' }
                    : { background: 'color-mix(in srgb, var(--ink) 14%, var(--washi))', borderLeft: '3px solid var(--ink)', color: 'var(--ink)' }),
                }}>
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{foco && <span style={{ color: cor }}>◷ </span>}{it.ev.title}</div>
                  {alt > 30 && (
                    <div style={{ fontSize: 10.5, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {paraHora(it.ini)}–{paraHora(it.fim)}
                      {est && <> · <b style={{ color: est.ok ? 'var(--moss)' : 'var(--hanko)' }}>{est.ok ? formatarMinutos(est.minutos) : 'não aconteceu'}</b></>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* feito */}
          <div style={{ position: 'relative', borderLeft: `1px dashed ${tinta(14)}`, background: tinta(2) }}>
            {horas.map(m => <div key={m} style={{ position: 'absolute', left: 0, right: 0, top: y(m), height: 1, background: tinta(7) }} />)}
            {feitos.filter(f => f.fim > INICIO).map(f => {
              const cor = projects.find(p => p.id === f.s.projectId)?.color ?? 'var(--char-mute)';
              return (
                <div key={f.s.id} title={f.s.taskTitulo ?? f.s.rotulo ?? 'foco livre'} style={{
                  position: 'absolute', left: 3, right: 3, top: y(Math.max(f.ini, INICIO)), height: Math.max(14, y(f.fim) - y(Math.max(f.ini, INICIO)) - 2),
                  borderRadius: 5, padding: '2px 5px', fontSize: 10.5, fontWeight: 600, color: 'var(--washi)', overflow: 'hidden',
                  background: `color-mix(in srgb, ${cor} 72%, transparent)`,
                }}>{Math.round(f.s.minutos)}m</div>
              );
            })}
          </div>

          {dia === hoje && agora >= INICIO && (
            <div ref={agoraRef} style={{ position: 'absolute', left: 38, right: 0, top: y(agora), height: 2, background: 'var(--hanko)', zIndex: 2, pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: '50%', background: 'var(--hanko)' }} />
            </div>
          )}
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--char-mute)', margin: '8px 2px 0' }}>Toque num horário vazio pra criar. Toque num bloco pra começar ou ajustar.</p>
    </>
  );

  // ── Semana ──
  const semana = periodoDe('semana', dia);
  const vistaSemana = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setDia(addDays(semana.inicio, -7))} aria-label="semana anterior" style={{ ...botaoContorno, width: 38, padding: 0, borderRadius: '50%' }}>‹</button>
        <span className="serif" style={{ fontSize: 18, color: 'var(--ink)' }}>{Number(semana.inicio.slice(8))} – {Number(semana.fim.slice(8))} de {MESES[Number(semana.fim.slice(5, 7)) - 1]}</span>
        <button onClick={() => setDia(addDays(semana.inicio, 7))} aria-label="próxima semana" style={{ ...botaoContorno, width: 38, padding: 0, borderRadius: '50%' }}>›</button>
      </div>
      <div style={{ ...cartao, padding: '2px 14px' }}>
        {diasDoPeriodo(semana).map((d, i) => {
          const its = itensComHora(events, d);
          const todo = eventosDoDia(events, d).filter(e => !e.time);
          const r = resumoDoDia(its, feitosDoDia(focoStore.sessoes, d), corteDoDia(d, hoje, agora));
          return (
            <button key={d} onClick={() => abrirDia(d)} style={{
              display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr)', gap: 10, width: '100%', textAlign: 'left', padding: '10px 0',
              borderBottom: i < 6 ? `1px solid ${tinta(7)}` : 'none',
            }}>
              <span style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>{DIAS[i]}</span>
                <span className="serif" style={{ fontSize: 24, lineHeight: 1, color: d === hoje ? 'var(--hanko)' : 'var(--ink)' }}>{Number(d.slice(8))}</span>
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[...todo.map(e => ({ id: e.id, txt: e.title, foco: false, cor: 'var(--ink)' })),
                    ...its.map(it => ({ id: it.ev.id, txt: `${paraHora(it.ini)} ${it.ev.title}`, foco: it.ev.type === 'foco', cor: corDe(it.ev) }))]
                    .map(c => (
                      <span key={c.id} style={{
                        fontSize: 11, padding: '2px 7px', borderRadius: 9, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        ...(c.foco ? { border: `1px dashed ${c.cor}`, color: 'var(--char)' } : { background: tinta(8), color: 'var(--ink)' }),
                      }}>{c.foco && '◷ '}{c.txt}</span>
                    ))}
                  {its.length + todo.length === 0 && <span style={{ fontSize: 11.5, color: 'var(--char-mute)' }}>livre</span>}
                </span>
                {(r.planejado > 0 || r.feito > 0) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6, fontSize: 10.5, color: 'var(--char-mute)' }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatarMinutos(r.feito)}/{formatarMinutos(r.planejado)}</span>
                    <span style={{ flex: 1, height: 4, borderRadius: 2, background: tinta(8), overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: `${r.planejado ? Math.min(100, (r.feito / r.planejado) * 100) : 100}%`, background: 'var(--moss)' }} />
                    </span>
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--char-mute)', margin: '8px 2px 0' }}>A barrinha verde é o foco feito contra o planejado. Toque num dia pra abrir.</p>
    </>
  );

  // ── Mês ──
  const mes = periodoDe('mes', dia);
  const primeiraSegunda = periodoDe('semana', mes.inicio).inicio;
  const celulas: string[] = [];
  for (let d = primeiraSegunda; d <= mes.fim || celulas.length % 7 !== 0; d = addDays(d, 1)) celulas.push(d);
  const vistaMes = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setDia(addDays(mes.inicio, -1))} aria-label="mês anterior" style={{ ...botaoContorno, width: 38, padding: 0, borderRadius: '50%' }}>‹</button>
        <span className="serif" style={{ fontSize: 19, color: 'var(--ink)' }}>{MESES[Number(mes.inicio.slice(5, 7)) - 1]} {mes.inicio.slice(0, 4)}</span>
        <button onClick={() => setDia(addDays(mes.fim, 1))} aria-label="próximo mês" style={{ ...botaoContorno, width: 38, padding: 0, borderRadius: '50%' }}>›</button>
      </div>
      <div style={{ ...cartao, padding: '12px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 3 }}>
          {DIAS.map(w => <span key={w} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--char-mute)', paddingBottom: 4 }}>{w}</span>)}
          {celulas.map(d => {
            const fora = d < mes.inicio || d > mes.fim;
            const doDia = eventosDoDia(events, d);
            const feito = feitosDoDia(focoStore.sessoes, d).reduce((a, f) => a + f.s.minutos, 0);
            return (
              <button key={d} onClick={() => abrirDia(d)} style={{
                aspectRatio: '1 / 1.15', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5, gap: 3,
                fontSize: 13, opacity: fora ? 0.3 : 1, color: d === hoje ? 'var(--hanko)' : 'var(--char-soft)', fontWeight: d === hoje ? 600 : 400,
                boxShadow: d === hoje ? 'inset 0 0 0 1.5px var(--hanko)' : 'none',
                background: `color-mix(in srgb, var(--moss) ${Math.round(Math.min(1, feito / 120) * 30)}%, transparent)`,
              }}>
                <span>{Number(d.slice(8))}</span>
                <span style={{ display: 'flex', gap: 2 }}>
                  {doDia.slice(0, 4).map(e => (
                    <span key={e.id} style={{ width: 4, height: 4, borderRadius: '50%', ...(e.type === 'foco' ? { border: '1px solid var(--ink)' } : { background: 'var(--ink)' }) }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--char-mute)', margin: '8px 2px 0' }}>Ponto cheio = evento, vazado = bloco de foco, verde = foco feito. Toque num dia pra abrir.</p>
    </>
  );

  // ── Folhas ──
  let folhaUi: ReactNode = null;
  if (folha?.tipo === 'novo') {
    const f = folha;
    const salvar = () => {
      const fim = Math.min(FIM, f.ini + f.dur);
      if (f.evento) {
        calendarStore.createEvent({ title: f.titulo.trim() || 'Evento', date: dia, type: 'evento', time: paraHora(f.ini), endTime: paraHora(fim) });
      } else {
        const t = tasks.find(x => x.id === f.alvo);
        const p = t ? projects.find(x => x.id === t.projectId) : undefined;
        calendarStore.createEvent({
          title: t?.title ?? (f.titulo.trim() || 'Foco livre'), date: dia, type: 'foco', time: paraHora(f.ini), endTime: paraHora(fim),
          taskId: t?.id, projectId: t?.projectId, areaId: p?.areaId,
        });
      }
      setFolha(null);
    };
    folhaUi = (
      <Folha sobre={`${diaLongo(dia)} · ${paraHora(f.ini)}`} titulo={f.evento ? 'Novo evento' : 'Bloco de foco'} onFechar={() => setFolha(null)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: tinta(6), borderRadius: 10, padding: 3, marginBottom: 12 }}>
          {[false, true].map(ev => (
            <button key={String(ev)} onClick={() => setFolha({ ...f, evento: ev })} style={{
              minHeight: 36, borderRadius: 8, fontSize: 13, background: f.evento === ev ? 'var(--washi)' : 'transparent',
              color: f.evento === ev ? 'var(--ink)' : 'var(--char-soft)', fontWeight: f.evento === ev ? 600 : 400,
            }}>{ev ? 'Evento' : 'Bloco de foco'}</button>
          ))}
        </div>
        {(f.evento || f.alvo === 'livre') && (
          <input
            autoFocus={f.evento}
            value={f.titulo}
            onChange={e => setFolha({ ...f, titulo: e.target.value })}
            placeholder={f.evento ? 'título do evento' : 'nome do foco livre (opcional)'}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${tinta(18)}`, background: 'var(--card-bg)', fontSize: 16, marginBottom: 10 }}
          />
        )}
        <div style={{ ...kicker, marginBottom: 6 }}>duração</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {[30, 60, 90, 120].map(d => (
            <button key={d} onClick={() => setFolha({ ...f, dur: d })} style={{
              padding: '8px 13px', borderRadius: 16, fontSize: 13, border: `1px solid ${f.dur === d ? 'var(--ink)' : tinta(18)}`,
              background: f.dur === d ? 'var(--ink)' : 'transparent', color: f.dur === d ? 'var(--washi)' : 'var(--char-soft)',
            }}>{formatarMinutos(d)}</button>
          ))}
        </div>
        {!f.evento && <>
          <div style={{ ...kicker, marginBottom: 6 }}>no que focar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {abertas.slice(0, 10).map(t => (
              <OpcaoFolha key={t.id} cor={projects.find(p => p.id === t.projectId)?.color} texto={t.title}
                detalhe={projects.find(p => p.id === t.projectId)?.title} ativo={f.alvo === t.id} onClick={() => setFolha({ ...f, alvo: t.id })} />
            ))}
            <OpcaoFolha texto="Foco livre" ativo={f.alvo === 'livre'} onClick={() => setFolha({ ...f, alvo: 'livre' })} />
          </div>
        </>}
        <button onClick={salvar} style={{ ...botaoCheio, marginTop: 14 }}>Salvar · {paraHora(f.ini)}–{paraHora(Math.min(FIM, f.ini + f.dur))}</button>
      </Folha>
    );
  } else if (folha?.tipo === 'bloco' || folha?.tipo === 'evento') {
    const it = itensComHora(events, dia).find(i => i.ev.id === folha.id);
    const ev = it?.ev ?? events.find(e => e.id === folha.id);
    if (ev) {
      const foco = ev.type === 'foco';
      const est = it && foco ? estadoDoBloco(it, feitos, corte) : null;
      const ajustar = (desloc: number, dur: number) => {
        if (!it) return;
        const ini = Math.max(INICIO, Math.min(FIM - 15, it.ini + desloc));
        const fim = Math.max(ini + 15, Math.min(FIM, (desloc ? it.fim + desloc : it.fim) + dur));
        calendarStore.updateEvent(ev.id, { time: paraHora(ini), endTime: paraHora(fim) });
      };
      const linha = (rotulo: string, valor: string, menos: () => void, mais: () => void) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${tinta(7)}`, fontSize: 14 }}>
          <span>{rotulo} <b style={{ fontVariantNumeric: 'tabular-nums' }}>{valor}</b></span>
          <span style={{ display: 'flex', gap: 6 }}>
            <button onClick={menos} style={{ ...botaoContorno, width: 46, padding: 0 }}>−15</button>
            <button onClick={mais} style={{ ...botaoContorno, width: 46, padding: 0 }}>+15</button>
          </span>
        </div>
      );
      folhaUi = (
        <Folha sobre={foco ? 'bloco de foco' : 'evento'} titulo={ev.title} onFechar={() => setFolha(null)}>
          <div style={{ fontSize: 13, color: 'var(--char-soft)', marginTop: -4 }}>
            {it ? `${paraHora(it.ini)}–${paraHora(it.fim)}` : 'dia todo'}
            {foco && <> · {projects.find(p => p.id === ev.projectId)?.title ?? 'foco livre'}</>}
            {est && <> · <b style={{ color: est.ok ? 'var(--moss)' : 'var(--hanko)' }}>{est.ok ? `feito ${formatarMinutos(est.minutos)}` : 'não aconteceu'}</b></>}
          </div>
          {foco && it && <>
            <button
              onClick={() => { setFolha(null); onComecarBloco(ev); }}
              disabled={sessaoRodando}
              style={{ ...botaoCheio, marginTop: 14, opacity: sessaoRodando ? 0.45 : 1 }}
            >
              ▶ Começar foco · {formatarMinutos(it.fim - it.ini)}
            </button>
            {sessaoRodando && <p style={{ fontSize: 12, color: 'var(--char-mute)', margin: '6px 0 0' }}>Já tem um cronômetro rodando.</p>}
          </>}
          {it && <div style={{ marginTop: 8 }}>
            {linha('Começa', paraHora(it.ini), () => ajustar(-15, 0), () => ajustar(15, 0))}
            {linha('Duração', formatarMinutos(it.fim - it.ini), () => ajustar(0, -15), () => ajustar(0, 15))}
          </div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            {apagando ? (
              <span style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 13.5 }}>
                <span style={{ color: 'var(--hanko)' }}>Apagar?</span>
                <button onClick={() => { calendarStore.deleteEvent(ev.id); setFolha(null); }} style={{ color: 'var(--hanko)', fontWeight: 600, minHeight: 36 }}>sim</button>
                <button onClick={() => setApagando(false)} style={{ color: 'var(--char-mute)', minHeight: 36 }}>não</button>
              </span>
            ) : (
              <button onClick={() => setApagando(true)} style={{ color: 'var(--hanko)', fontSize: 13.5, minHeight: 36 }}>Apagar</button>
            )}
            <button onClick={() => setFolha(null)} style={{ color: 'var(--char-mute)', fontSize: 13.5, minHeight: 36 }}>fechar</button>
          </div>
        </Folha>
      );
    }
  }

  // + cria no próximo meio-horário livre de hoje, ou às 9h em outro dia.
  const proximoHorario = dia === hoje ? Math.min(FIM - 60, Math.ceil((agora + 1) / 30) * 30) : paraMin('09:00');

  return (
    <div>
      <Cabecalho sobre="seus compromissos" titulo="Agenda" direita={
        <button onClick={() => novo(proximoHorario)} aria-label="criar bloco ou evento" style={{
          width: 40, height: 40, borderRadius: '50%', background: 'var(--ink)', color: 'var(--washi)', fontSize: 22, lineHeight: 1,
        }}>+</button>
      } />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: tinta(6), borderRadius: 10, padding: 3, marginBottom: 12 }}>
        {(['dia', 'semana', 'mes'] as const).map(m => (
          <button key={m} onClick={() => setModo(m)} style={{
            minHeight: 34, borderRadius: 8, fontSize: 13, background: modo === m ? 'var(--washi)' : 'transparent',
            color: modo === m ? 'var(--ink)' : 'var(--char-soft)', fontWeight: modo === m ? 600 : 400,
            boxShadow: modo === m ? `0 1px 3px ${tinta(18)}` : 'none',
          }}>{m === 'dia' ? 'Dia' : m === 'semana' ? 'Semana' : 'Mês'}</button>
        ))}
      </div>
      {modo === 'dia' ? vistaDia : modo === 'semana' ? vistaSemana : vistaMes}
      {folhaUi}
    </div>
  );
}
