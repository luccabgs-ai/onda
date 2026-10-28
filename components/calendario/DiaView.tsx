'use client';
import React, { useEffect, useRef, useState } from 'react';
import { CalendarEvent, Project, SessaoFoco, Task } from '@/lib/types';
import { blocosDoDia, formatarMinutos } from '@/lib/foco';
import { Card } from '@/components/ui/Card';
import { tinta } from '@/components/organizacao/estilo';

// ── Régua do dia ──────────────────────────────────────────────────────────────

const PX_HORA = 52;
const INICIO = 6 * 60;          // a linha do tempo vai das 6h…
const FIM = 24 * 60;            // …até a meia-noite
const PASSO = 15;               // arrastar anda de 15 em 15 min
const DURACAO_PADRAO = 60;      // evento sem hora de fim ocupa 1h; tarefa arrastada vira bloco de 1h

const paraMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const paraHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const px = (min: number) => ((min - INICIO) / 60) * PX_HORA;
const arredondar = (min: number) => Math.round(min / PASSO) * PASSO;
const limitar = (min: number) => Math.max(INICIO, Math.min(FIM, min));
const minutosDoIso = (iso: string) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); };
const cruza = (a: { ini: number; fim: number }, b: { ini: number; fim: number }) => Math.max(0, Math.min(a.fim, b.fim) - Math.max(a.ini, b.ini));

interface ItemPlano { ev: CalendarEvent; ini: number; fim: number; coluna: number; colunas: number }

/** Coloca eventos que se cruzam lado a lado (como no Google Agenda). */
function distribuir(itens: { ev: CalendarEvent; ini: number; fim: number }[]): ItemPlano[] {
  const ordenados = [...itens].sort((a, b) => a.ini - b.ini || b.fim - a.fim);
  const saida: ItemPlano[] = [];
  let grupo: ItemPlano[] = [];
  let fimDoGrupo = -1;
  const fecharGrupo = () => { const n = Math.max(1, ...grupo.map(g => g.coluna + 1)); grupo.forEach(g => { g.colunas = n; }); grupo = []; };
  for (const it of ordenados) {
    if (it.ini >= fimDoGrupo) fecharGrupo();
    const ocupadas = new Set(grupo.filter(g => g.fim > it.ini).map(g => g.coluna));
    let coluna = 0;
    while (ocupadas.has(coluna)) coluna++;
    const item = { ...it, coluna, colunas: 1 };
    grupo.push(item);
    saida.push(item);
    fimDoGrupo = Math.max(fimDoGrupo, it.fim);
  }
  fecharGrupo();
  return saida;
}

type NovoEvento = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>;

interface Props {
  data: string;                  // o dia mostrado
  hoje: string;
  eventos: CalendarEvent[];
  tasks: Task[];
  projects: Project[];
  sessoesFoco: SessaoFoco[];
  vitoriasTaskIds: string[];     // vitórias do ritual de hoje (sugestões "pra encaixar")
  sessaoRodando: boolean;        // já tem cronômetro rodando — não dá pra começar outro
  onCriar: (data: NovoEvento) => void;
  onAtualizar: (id: string, data: Partial<CalendarEvent>) => void;
  onApagar: (id: string) => void;
  onEditarEvento: (ev: CalendarEvent) => void;   // eventos comuns abrem o formulário de sempre
  onComecarFoco: (ev: CalendarEvent) => void;
}

type Pop =
  | { tipo: 'novo'; ini: number; fim: number; modo: 'foco' | 'evento' }
  | { tipo: 'editar'; id: string }
  | { tipo: 'bloco'; id: string }
  | { tipo: 'feito'; id: string };

/**
 * Visão Dia do calendário: linha do tempo com duas faixas — plano (eventos e blocos de foco
 * planejados) e feito (o que o cronômetro gravou). Arrastar no vazio cria; arrastar um bloco
 * muda o horário; a borda de baixo muda a duração.
 */
export default function DiaView(props: Props) {
  const { data, hoje, eventos, tasks, projects, sessoesFoco, vitoriasTaskIds, sessaoRodando } = props;
  const [agora, setAgora] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  const [pop, setPop] = useState<Pop | null>(null);
  // Durante o arrasto o bloco mexe só aqui; grava uma vez ao soltar.
  const [arrasto, setArrasto] = useState<{ id: string; ini: number; fim: number } | null>(null);
  const [rascunho, setRascunho] = useState<{ ini: number; fim: number } | null>(null);
  const gesto = useRef<
    | { tipo: 'criar'; ancora: number }
    | { tipo: 'mover'; id: string; desloc: number; dur: number; moveu: boolean }
    | { tipo: 'duracao'; id: string; ini: number }
    | null
  >(null);
  const faixaRef = useRef<HTMLDivElement>(null);
  const rolagemRef = useRef<HTMLDivElement>(null);

  // A linha do "agora" anda sozinha.
  useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setAgora(d.getHours() * 60 + d.getMinutes()); }, 30000);
    return () => clearInterval(id);
  }, []);

  // Abre já mostrando a manhã (ou perto de agora, se for hoje).
  useEffect(() => {
    const el = rolagemRef.current;
    if (!el) return;
    const d = new Date();
    const alvo = data === hoje ? Math.max(INICIO, d.getHours() * 60 + d.getMinutes() - 90) : 7 * 60 + 30;
    el.scrollTop = px(alvo);
  }, [data, hoje]);

  const ehHoje = data === hoje;
  const corte = data < hoje ? FIM : ehHoje ? agora : -1;   // até onde o dia "já aconteceu"

  // ── O que está no dia ──
  const doDia = eventos.filter(e => e.endDate ? e.date <= data && e.endDate >= data : e.date === data);
  const comHora = doDia.filter(e => e.time).map(e => {
    const ini = arrasto?.id === e.id ? arrasto.ini : paraMin(e.time!);
    const fim = arrasto?.id === e.id ? arrasto.fim : e.endTime ? Math.max(paraMin(e.endTime), ini + PASSO) : ini + DURACAO_PADRAO;
    return { ev: e, ini, fim };
  });
  const diaTodo = doDia.filter(e => !e.time);
  const tarefasDoDia = tasks.filter(t => t.dueDate === data && t.status !== 'concluido');
  const itens = distribuir(comHora);

  const feitos = blocosDoDia(sessoesFoco, data).map(s => {
    const ini = minutosDoIso(s.inicio);
    return { s, ini, fim: Math.max(ini + 5, ini + Math.round(s.minutos)) };
  });

  const tarefa = (id?: string) => (id ? tasks.find(t => t.id === id) : undefined);
  const corDoBloco = (ev: CalendarEvent) => projects.find(p => p.id === tarefa(ev.taskId)?.projectId)?.color ?? 'var(--char-mute)';

  /** Quanto do bloco planejado virou foco de verdade (mesma tarefa, horário que se cruza). */
  const estado = (ev: CalendarEvent, ini: number, fim: number) => {
    if (corte < ini) return null;
    const janela = { ini, fim: Math.min(fim, corte) };
    const feito = feitos.filter(f => (ev.taskId ? f.s.taskId === ev.taskId : !f.s.taskId)).reduce((a, f) => a + cruza(janela, f), 0);
    if (fim <= corte) return feito > 0 ? { ok: true, texto: `feito ${formatarMinutos(feito)}` } : { ok: false, texto: 'não aconteceu' };
    return feito > 0 ? { ok: true, texto: `${formatarMinutos(feito)} até agora` } : null;
  };

  const blocosFoco = comHora.filter(i => i.ev.type === 'foco');
  const planejado = blocosFoco.reduce((a, i) => a + (i.fim - i.ini), 0);
  const feitoTotal = feitos.reduce((a, f) => a + Math.round(f.s.minutos), 0);
  const planejadoAteAgora = blocosFoco.reduce((a, i) => a + Math.max(0, Math.min(i.fim, corte) - i.ini), 0);
  const cumprido = blocosFoco.reduce((a, i) => {
    const janela = { ini: i.ini, fim: Math.min(i.fim, corte) };
    return a + feitos.filter(f => (i.ev.taskId ? f.s.taskId === i.ev.taskId : !f.s.taskId)).reduce((x, f) => x + cruza(janela, f), 0);
  }, 0);

  // Sugestões pra arrastar: em andamento, vitórias de hoje, prazo até o dia — sem repetir.
  const abertas = tasks.filter(t => t.status !== 'concluido');
  const sugestoes = [
    ...abertas.filter(t => t.status === 'em_andamento'),
    ...(ehHoje ? abertas.filter(t => vitoriasTaskIds.includes(t.id)) : []),
    ...abertas.filter(t => !!t.dueDate && t.dueDate <= data),
  ].filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i).slice(0, 8);

  // ── Arrastar ──
  const minutoDoPonteiro = (clientY: number) => {
    const faixa = faixaRef.current!;
    return limitar(arredondar(INICIO + ((clientY - faixa.getBoundingClientRect().top) / PX_HORA) * 60));
  };

  const aoApertar = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const alvo = e.target as HTMLElement;
    const m = minutoDoPonteiro(e.clientY);
    const alca = alvo.closest<HTMLElement>('[data-alca]');
    const bloco = alvo.closest<HTMLElement>('[data-bloco]');
    if (alvo.closest('[data-evento]')) return;   // evento comum: só o clique (abre o formulário)
    setPop(null);
    if (alca) {
      const it = comHora.find(i => i.ev.id === alca.dataset.alca)!;
      gesto.current = { tipo: 'duracao', id: it.ev.id, ini: it.ini };
      setArrasto({ id: it.ev.id, ini: it.ini, fim: it.fim });
    } else if (bloco) {
      const it = comHora.find(i => i.ev.id === bloco.dataset.bloco)!;
      gesto.current = { tipo: 'mover', id: it.ev.id, desloc: m - it.ini, dur: it.fim - it.ini, moveu: false };
      setArrasto({ id: it.ev.id, ini: it.ini, fim: it.fim });
    } else {
      gesto.current = { tipo: 'criar', ancora: m };
      setRascunho({ ini: m, fim: m + PASSO });
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const aoMover = (e: React.PointerEvent) => {
    const g = gesto.current;
    if (!g) return;
    const m = minutoDoPonteiro(e.clientY);
    if (g.tipo === 'criar') setRascunho({ ini: Math.min(g.ancora, m), fim: Math.max(g.ancora + PASSO, m) });
    if (g.tipo === 'duracao') setArrasto({ id: g.id, ini: g.ini, fim: Math.max(g.ini + PASSO, m) });
    if (g.tipo === 'mover') {
      const ini = Math.max(INICIO, Math.min(FIM - g.dur, m - g.desloc));
      if (arrasto && ini !== arrasto.ini) g.moveu = true;
      setArrasto({ id: g.id, ini, fim: ini + g.dur });
    }
  };

  const aoSoltar = () => {
    const g = gesto.current;
    gesto.current = null;
    if (!g) return;
    if (g.tipo === 'criar' && rascunho) {
      // Um clique sem arrastar cria 1h; arrastado, fica do tamanho arrastado.
      const fim = rascunho.fim - rascunho.ini < 30 ? Math.min(FIM, rascunho.ini + DURACAO_PADRAO) : rascunho.fim;
      setRascunho({ ini: rascunho.ini, fim });
      setPop({ tipo: 'novo', ini: rascunho.ini, fim, modo: 'foco' });
      return;
    }
    if (g.tipo === 'mover' && !g.moveu) { setArrasto(null); setPop({ tipo: 'bloco', id: g.id }); return; }
    if (arrasto) props.onAtualizar(arrasto.id, { time: paraHora(arrasto.ini), endTime: paraHora(arrasto.fim) });
    setArrasto(null);
  };

  // Tarefa arrastada da lateral vira um bloco de 1h onde cair.
  const aoSoltarTarefa = (e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData('text/onda-tarefa');
    const t = tarefa(taskId);
    if (!t) return;
    e.preventDefault();
    const ini = Math.min(FIM - DURACAO_PADRAO, minutoDoPonteiro(e.clientY));
    const areaId = projects.find(p => p.id === t.projectId)?.areaId;
    props.onCriar({ title: t.title, date: data, type: 'foco', time: paraHora(ini), endTime: paraHora(ini + DURACAO_PADRAO), taskId: t.id, projectId: t.projectId, areaId });
  };

  const fecharPop = () => { setPop(null); setRascunho(null); };

  // ── Janelinha ──
  const popEvento = pop && (pop.tipo === 'bloco' || pop.tipo === 'editar') ? comHora.find(i => i.ev.id === pop.id) : undefined;
  const popFeito = pop?.tipo === 'feito' ? feitos.find(f => f.s.id === pop.id) : undefined;
  const topoDoPop = pop?.tipo === 'novo' ? pop.ini : popEvento?.ini ?? popFeito?.ini ?? INICIO;

  const linhaHoras: number[] = [];
  for (let m = INICIO; m < FIM; m += 30) linhaHoras.push(m);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 270px', gap: 20, alignItems: 'start' }} className="mobile-grid-1col">
      <div style={{ minWidth: 0 }}>
        {(diaTodo.length > 0 || tarefasDoDia.length > 0) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', padding: '8px 10px', marginBottom: 8, borderRadius: 8, background: tinta(4) }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--char-mute)', marginRight: 4 }}>dia todo</span>
            {diaTodo.map(e => (
              <button key={e.id} onClick={() => props.onEditarEvento(e)} style={{
                padding: '3px 10px', borderRadius: 12, fontSize: 12,
                background: e.type === 'comemoracao' ? 'color-mix(in srgb, var(--hanko) 12%, transparent)' : tinta(8),
                color: e.type === 'comemoracao' ? 'var(--hanko)' : 'var(--ink)',
              }}>{e.title}</button>
            ))}
            {tarefasDoDia.map(t => (
              <span key={t.id} style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, background: tinta(8), color: 'var(--ink)' }}>prazo: {t.title}</span>
            ))}
          </div>
        )}

        <div ref={rolagemRef} style={{ position: 'relative', height: 640, overflowY: 'auto', border: '1px solid var(--card-border)', borderRadius: 10, background: 'var(--card-bg)' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 4, display: 'grid', gridTemplateColumns: '54px minmax(0, 1fr) minmax(0, 0.42fr)', background: 'var(--washi)', borderBottom: '1px solid var(--card-border)' }}>
            <span />
            {['plano', 'feito'].map((r, i) => (
              <span key={r} style={{ padding: '7px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--char-mute)', borderLeft: i ? `1px dashed ${tinta(14)}` : 'none' }}>{r}</span>
            ))}
          </div>

          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '54px minmax(0, 1fr) minmax(0, 0.42fr)', height: px(FIM) }}>
            {/* horas */}
            <div style={{ position: 'relative' }}>
              {linhaHoras.filter(m => m % 60 === 0 && m > INICIO).map(m => (
                <span key={m} style={{ position: 'absolute', right: 8, top: px(m), transform: 'translateY(-50%)', fontSize: 11, color: 'var(--char-mute)', fontVariantNumeric: 'tabular-nums' }}>{paraHora(m)}</span>
              ))}
            </div>

            {/* plano */}
            <div
              ref={faixaRef}
              onPointerDown={aoApertar}
              onPointerMove={aoMover}
              onPointerUp={aoSoltar}
              onDragOver={e => { if (e.dataTransfer.types.includes('text/onda-tarefa')) e.preventDefault(); }}
              onDrop={aoSoltarTarefa}
              style={{ position: 'relative', cursor: 'crosshair', touchAction: 'none', userSelect: 'none' }}
            >
              {corte > INICIO && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: px(Math.min(corte, FIM)), background: 'color-mix(in srgb, var(--char-mute) 6%, transparent)', pointerEvents: 'none' }} />}
              {linhaHoras.map(m => (
                <div key={m} style={{ position: 'absolute', left: 0, right: 0, top: px(m), height: 1, background: tinta(m % 60 ? 4 : 8), pointerEvents: 'none' }} />
              ))}
              {itens.map(({ ev, ini, fim, coluna, colunas }) => {
                const altura = px(fim) - px(ini) - 2;
                const larg = `calc((100% - 12px) / ${colunas})`;
                const base: React.CSSProperties = {
                  position: 'absolute', top: px(ini), height: altura, left: `calc(6px + ${larg} * ${coluna})`, width: `calc(${larg} - 3px)`,
                  borderRadius: 6, padding: '4px 8px', overflow: 'hidden', fontSize: 12, lineHeight: 1.3,
                };
                if (ev.type !== 'foco') {
                  return (
                    <div key={ev.id} data-evento={ev.id} onClick={() => props.onEditarEvento(ev)} style={{
                      ...base, cursor: 'pointer', color: 'var(--ink)', borderLeft: '3px solid var(--ink)',
                      background: 'color-mix(in srgb, var(--ink) 14%, var(--washi))',
                    }}>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                      {altura > 30 && <div style={{ fontSize: 11, opacity: 0.8 }}>{paraHora(ini)}{ev.endTime && `–${paraHora(fim)}`}</div>}
                    </div>
                  );
                }
                const cor = corDoBloco(ev);
                const est = estado(ev, ini, fim);
                const projeto = projects.find(p => p.id === tarefa(ev.taskId)?.projectId);
                return (
                  <div key={ev.id} data-bloco={ev.id} style={{
                    ...base, cursor: 'grab', color: 'var(--char)', border: `1.5px dashed ${cor}`,
                    background: `color-mix(in srgb, ${cor} 9%, var(--washi))`, opacity: arrasto?.id === ev.id ? 0.85 : 1,
                  }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: est ? 70 : 0 }}>
                      <span style={{ color: cor }}>◷ </span>{ev.title}
                    </div>
                    {altura > 30 && (
                      <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {paraHora(ini)}–{paraHora(fim)} · {projeto?.title ?? 'foco livre'}
                      </div>
                    )}
                    {est && (
                      <span style={{
                        position: 'absolute', right: 6, top: 4, fontSize: 10, fontWeight: 600, padding: '0 6px', borderRadius: 8,
                        color: est.ok ? 'var(--moss)' : 'var(--hanko)',
                        background: `color-mix(in srgb, ${est.ok ? 'var(--moss)' : 'var(--hanko)'} 13%, transparent)`,
                      }}>{est.texto}</span>
                    )}
                    <div data-alca={ev.id} title="arraste pra mudar a duração" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, cursor: 'ns-resize' }} />
                  </div>
                );
              })}
              {rascunho && (
                <div style={{
                  position: 'absolute', top: px(rascunho.ini), height: px(rascunho.fim) - px(rascunho.ini) - 2, left: 6, right: 8,
                  borderRadius: 6, border: '1.5px dashed var(--ink)', background: tinta(8), padding: '4px 8px', fontSize: 12, color: 'var(--ink)',
                  pointerEvents: 'none',
                }}>
                  {paraHora(rascunho.ini)}–{paraHora(rascunho.fim)}
                </div>
              )}
            </div>

            {/* feito */}
            <div style={{ position: 'relative', borderLeft: `1px dashed ${tinta(14)}`, background: tinta(2) }}>
              {corte > INICIO && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: px(Math.min(corte, FIM)), background: 'color-mix(in srgb, var(--char-mute) 6%, transparent)' }} />}
              {linhaHoras.map(m => (
                <div key={m} style={{ position: 'absolute', left: 0, right: 0, top: px(m), height: 1, background: tinta(m % 60 ? 4 : 8) }} />
              ))}
              {feitos.filter(f => f.fim > INICIO).map(({ s, ini, fim }) => {
                const cor = projects.find(p => p.id === s.projectId)?.color ?? 'var(--char-mute)';
                const altura = Math.max(14, px(fim) - px(Math.max(ini, INICIO)) - 2);
                return (
                  <button key={s.id} onClick={() => setPop({ tipo: 'feito', id: s.id })} title={`${s.taskTitulo ?? s.rotulo ?? 'foco livre'} · ${formatarMinutos(s.minutos)}`} style={{
                    position: 'absolute', top: px(Math.max(ini, INICIO)), height: altura, left: 5, right: 6, borderRadius: 6, padding: '3px 7px',
                    textAlign: 'left', overflow: 'hidden', fontSize: 11.5, lineHeight: 1.25, color: 'var(--washi)',
                    background: `color-mix(in srgb, ${cor} 72%, transparent)`,
                  }}>
                    <div style={{ fontWeight: 600 }}>{formatarMinutos(s.minutos)}</div>
                    {altura > 30 && <div style={{ opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.taskTitulo ?? s.rotulo ?? 'foco livre'}</div>}
                  </button>
                );
              })}
            </div>

            {/* agora */}
            {ehHoje && agora >= INICIO && (
              <div style={{ position: 'absolute', left: 54, right: 0, top: px(agora), height: 2, background: 'var(--hanko)', zIndex: 3, pointerEvents: 'none' }}>
                <span style={{ position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: '50%', background: 'var(--hanko)' }} />
                <span style={{ position: 'absolute', left: -50, top: -8, fontSize: 10.5, fontWeight: 600, color: 'var(--hanko)', fontVariantNumeric: 'tabular-nums' }}>{paraHora(agora)}</span>
              </div>
            )}

            {/* janelinha */}
            {pop && (
              <JanelaDoDia
                key={pop.tipo === 'novo' ? `novo-${pop.ini}` : `${pop.tipo}-${pop.id}`}
                topo={Math.max(8, px(topoDoPop) + 26)}
                pop={pop}
                evento={popEvento?.ev}
                horario={popEvento ? `${paraHora(popEvento.ini)}–${paraHora(popEvento.fim)} · ${formatarMinutos(popEvento.fim - popEvento.ini)}` : undefined}
                estado={popEvento ? estado(popEvento.ev, popEvento.ini, popEvento.fim) : null}
                feito={popFeito?.s}
                tasks={abertas}
                projects={projects}
                sessaoRodando={sessaoRodando}
                onFechar={fecharPop}
                onCriar={(dadosFoco) => {
                  if (pop.tipo !== 'novo') return;
                  props.onCriar({ ...dadosFoco, date: data, time: paraHora(pop.ini), endTime: paraHora(pop.fim) });
                  fecharPop();
                }}
                onSalvarEdicao={(dadosFoco) => {
                  if (pop.tipo !== 'editar') return;
                  props.onAtualizar(pop.id, dadosFoco);
                  fecharPop();
                }}
                onEditar={() => pop.tipo === 'bloco' && setPop({ tipo: 'editar', id: pop.id })}
                onApagar={() => { if (pop.tipo === 'bloco') props.onApagar(pop.id); fecharPop(); }}
                onComecar={() => { if (popEvento) props.onComecarFoco(popEvento.ev); fecharPop(); }}
              />
            )}
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--char-mute)', margin: '8px 2px 0' }}>
          Arraste no vazio da faixa <b>plano</b> pra criar · arraste um bloco pra mudar o horário · puxe a borda de baixo pra mudar a duração.
        </p>
      </div>

      {/* Lateral do dia */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ padding: '15px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>o dia em foco</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {[[planejado, 'planejados'], [feitoTotal, data === hoje ? 'feitos até agora' : 'feitos']].map(([v, r]) => (
              <div key={r as string} style={{ borderRadius: 8, padding: '8px 10px', background: tinta(5) }}>
                <div className="serif" style={{ fontSize: 26, color: 'var(--ink)', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>{formatarMinutos(v as number)}</div>
                <div style={{ fontSize: 10.5, color: 'var(--char-mute)' }}>{r}</div>
              </div>
            ))}
          </div>
          {planejadoAteAgora > 0 && (
            <p style={{ fontSize: 12, color: 'var(--char-soft)', margin: '10px 0 0', lineHeight: 1.45 }}>
              Do que estava planejado {data === hoje ? 'até agora' : ''} ({formatarMinutos(planejadoAteAgora)}),{' '}
              <strong style={{ color: 'var(--ink)' }}>{formatarMinutos(cumprido)}</strong> {cumprido === 1 ? 'virou' : 'viraram'} foco de verdade.
            </p>
          )}
        </Card>
        <Card style={{ padding: '15px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>pra encaixar</div>
          {sugestoes.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--char-mute)', fontStyle: 'italic', margin: '8px 0 0' }}>Nenhuma tarefa em andamento ou com prazo.</p>
          ) : sugestoes.map(t => {
            const p = projects.find(x => x.id === t.projectId);
            return (
              <div
                key={t.id}
                draggable
                onDragStart={e => { e.dataTransfer.setData('text/onda-tarefa', t.id); e.dataTransfer.effectAllowed = 'copy'; }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, border: '1px solid var(--card-border)', background: 'var(--washi)', marginTop: 6, cursor: 'grab', fontSize: 13 }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: p?.color ?? 'var(--char-mute)', flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>
                  {t.title}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)' }}>
                    {p?.title}{t.dueDate && t.dueDate <= data && <span style={{ color: 'var(--hanko)' }}> · {t.dueDate < data ? 'venceu' : 'prazo hoje'}</span>}
                  </span>
                </span>
              </div>
            );
          })}
          <p style={{ fontSize: 11.5, color: 'var(--char-mute)', margin: '8px 0 0', lineHeight: 1.45 }}>
            Arraste uma tarefa pra linha do tempo: vira um bloco de 1h, que você ajusta depois.
          </p>
        </Card>
      </div>
    </div>
  );
}

// ── Janelinha: criar, ver/editar bloco, ver foco feito ────────────────────────

type DadosNovo = Pick<CalendarEvent, 'title' | 'type' | 'taskId' | 'projectId' | 'areaId'>;

function JanelaDoDia(p: {
  topo: number;
  pop: Pop;
  evento?: CalendarEvent;
  horario?: string;
  estado: { ok: boolean; texto: string } | null;
  feito?: SessaoFoco;
  tasks: Task[];
  projects: Project[];
  sessaoRodando: boolean;
  onFechar: () => void;
  onCriar: (d: DadosNovo) => void;
  onSalvarEdicao: (d: DadosNovo) => void;
  onEditar: () => void;
  onApagar: () => void;
  onComecar: () => void;
}) {
  const editando = p.pop.tipo === 'editar' ? p.evento : undefined;
  const [modo, setModo] = useState<'foco' | 'evento'>(p.pop.tipo === 'novo' ? p.pop.modo : 'foco');
  const [escolha, setEscolha] = useState<string>(editando ? editando.taskId ?? 'livre' : p.tasks.find(t => t.status === 'em_andamento')?.id ?? p.tasks[0]?.id ?? 'livre');
  const [texto, setTexto] = useState(editando && !editando.taskId ? editando.title : '');

  const dados = (): DadosNovo => {
    if (modo === 'evento') return { title: texto.trim() || 'Evento', type: 'evento', taskId: undefined, projectId: undefined, areaId: undefined };
    const t = p.tasks.find(x => x.id === escolha);
    const projeto = t ? p.projects.find(x => x.id === t.projectId) : undefined;
    return t
      ? { title: t.title, type: 'foco', taskId: t.id, projectId: t.projectId, areaId: projeto?.areaId }
      : { title: texto.trim() || 'Foco livre', type: 'foco', taskId: undefined, projectId: undefined, areaId: undefined };
  };

  const campo: React.CSSProperties = { width: '100%', padding: '7px 9px', borderRadius: 5, border: `1px solid ${tinta(18)}`, background: 'var(--card-bg)', fontSize: 13, color: 'var(--char)' };
  const rotulo: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--char-mute)', margin: '10px 0 4px' };
  const acoes: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 14 };

  let corpo: React.ReactNode;
  if (p.pop.tipo === 'novo' || p.pop.tipo === 'editar') {
    corpo = <>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>{editando ? 'editar bloco' : 'novo'}</div>
      {!editando && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {(['foco', 'evento'] as const).map(m => (
            <button key={m} onClick={() => setModo(m)} style={{
              flex: 1, padding: 6, borderRadius: 6, fontSize: 12,
              border: `1px solid ${modo === m ? 'var(--ink)' : tinta(18)}`,
              background: modo === m ? 'var(--ink)' : 'transparent', color: modo === m ? 'var(--washi)' : 'var(--char-soft)',
            }}>{m === 'foco' ? 'Bloco de foco' : 'Evento'}</button>
          ))}
        </div>
      )}
      {modo === 'foco' ? <>
        <label style={rotulo} htmlFor="dia-tarefa">no que focar</label>
        <select id="dia-tarefa" value={escolha} onChange={e => setEscolha(e.target.value)} style={campo}>
          {p.tasks.map(t => <option key={t.id} value={t.id}>{t.title} · {p.projects.find(x => x.id === t.projectId)?.title}</option>)}
          <option value="livre">Foco livre</option>
        </select>
        {escolha === 'livre' && (
          <input value={texto} onChange={e => setTexto(e.target.value)} placeholder="nome (opcional): estudar, e-mails…" style={{ ...campo, marginTop: 6 }} />
        )}
      </> : <>
        <label style={rotulo} htmlFor="dia-titulo">título</label>
        <input id="dia-titulo" autoFocus value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') p.onCriar(dados()); }} placeholder="ex: almoço com a família" style={campo} />
      </>}
      <div style={acoes}>
        <button onClick={p.onFechar} style={{ fontSize: 12.5, color: 'var(--char-mute)', textDecoration: 'underline' }}>cancelar</button>
        <button onClick={() => (editando ? p.onSalvarEdicao(dados()) : p.onCriar(dados()))} style={{ padding: '7px 15px', background: 'var(--ink)', color: 'var(--washi)', borderRadius: 5, fontSize: 13, fontWeight: 500 }}>
          Salvar
        </button>
      </div>
    </>;
  } else if (p.pop.tipo === 'bloco' && p.evento) {
    corpo = <>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>bloco de foco</div>
      <h3 className="serif" style={{ fontSize: 20, color: 'var(--ink)', margin: '2px 0 4px', fontWeight: 500 }}>{p.evento.title}</h3>
      <div style={{ fontSize: 12.5, color: 'var(--char-soft)', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
        {p.horario}{p.estado && <> · <span style={{ color: p.estado.ok ? 'var(--moss)' : 'var(--hanko)' }}>{p.estado.texto}</span></>}
      </div>
      <button
        onClick={p.onComecar}
        disabled={p.sessaoRodando}
        title={p.sessaoRodando ? 'Já tem um cronômetro rodando — encerre ele antes' : undefined}
        style={{ width: '100%', padding: '9px 14px', background: 'var(--ink)', color: 'var(--washi)', borderRadius: 5, fontSize: 13, fontWeight: 500, opacity: p.sessaoRodando ? 0.45 : 1 }}
      >
        ▶ Começar foco agora
      </button>
      {p.sessaoRodando && <p style={{ fontSize: 11.5, color: 'var(--char-mute)', margin: '6px 0 0' }}>Já tem um cronômetro rodando.</p>}
      <div style={acoes}>
        <button onClick={p.onApagar} style={{ fontSize: 12.5, color: 'var(--hanko)' }}>Apagar</button>
        <span style={{ display: 'flex', gap: 14 }}>
          <button onClick={p.onEditar} style={{ fontSize: 12.5, color: 'var(--ink)' }}>Trocar tarefa</button>
          <button onClick={p.onFechar} style={{ fontSize: 12.5, color: 'var(--char-mute)', textDecoration: 'underline' }}>fechar</button>
        </span>
      </div>
    </>;
  } else if (p.pop.tipo === 'feito' && p.feito) {
    const f = p.feito;
    corpo = <>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>foco feito</div>
      <h3 className="serif" style={{ fontSize: 20, color: 'var(--ink)', margin: '2px 0 4px', fontWeight: 500 }}>{f.taskTitulo ?? f.rotulo ?? 'Foco livre'}</h3>
      <div style={{ fontSize: 12.5, color: 'var(--char-soft)', marginBottom: 10 }}>
        {formatarMinutos(f.minutos)} · {p.projects.find(x => x.id === f.projectId)?.title ?? 'foco livre'}
      </div>
      {f.nota
        ? <p className="serif" style={{ fontStyle: 'italic', fontSize: 16, margin: 0, color: 'var(--char-soft)' }}>“{f.nota}”</p>
        : <p style={{ fontSize: 12, color: 'var(--char-mute)', margin: 0 }}>Sem anotação.</p>}
      <div style={acoes}><span /><button onClick={p.onFechar} style={{ fontSize: 12.5, color: 'var(--char-mute)', textDecoration: 'underline' }}>fechar</button></div>
    </>;
  }

  return (
    <div
      onPointerDown={e => e.stopPropagation()}
      onKeyDown={e => { if (e.key === 'Escape') p.onFechar(); }}
      style={{
        position: 'absolute', zIndex: 6, top: p.topo, left: 64, width: 300, maxWidth: 'calc(100% - 74px)',
        background: 'var(--washi)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '14px 16px',
        boxShadow: '0 20px 50px -18px rgba(20,38,74,0.5)',
      }}
    >
      {corpo}
    </div>
  );
}
