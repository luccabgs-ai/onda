'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { AREAS } from '@/lib/data';
import { useHabitsStore } from '@/lib/habitsStore';
import { useProjectsStore } from '@/lib/projectsStore';
import { useCalendarStore } from '@/lib/calendarStore';
import { useRituaisStore } from '@/lib/rituaisStore';
import { useFocoStore, formatarMinutos } from '@/lib/focoStore';
import { computeNutridoMap, ordenarHabitosDoDia, estaAgendadoEm, toDateStr, addDays } from '@/lib/nutricao';
import { itensComHora, feitosDoDia, estadoDoBloco, resumoDoDia, paraHora } from '@/lib/agenda';
import { CalendarEvent, Habito, PrioridadeRitual } from '@/lib/types';
import { Checkbox } from '@/components/ui/Checkbox';
import { Hanko } from '@/components/ui/Hanko';
import { tinta } from '@/components/organizacao/estilo';
import { cartao, kicker, botaoCheio, botaoContorno, Cabecalho, Secao, Vazio, Energia } from './ui';
import EscolherVitoria from './EscolherVitoria';
import Lembretes from './Lembretes';

interface Props {
  habitsStore: ReturnType<typeof useHabitsStore>;
  projectsStore: ReturnType<typeof useProjectsStore>;
  calendarStore: ReturnType<typeof useCalendarStore>;
  rituaisStore: ReturnType<typeof useRituaisStore>;
  focoStore: ReturnType<typeof useFocoStore>;
  onComecarBloco: (ev: CalendarEvent) => void;
}

/**
 * Em que momento do dia a Hoje está. Segue o que você já fez, não só a hora: sem abrir o dia,
 * ela continua pedindo a abertura até as 18h; depois das 11h sem o ponto do meio, pede o meio;
 * a partir das 18h, o fechamento.
 */
type Momento = 'manha' | 'meio' | 'dia' | 'noite' | 'fechado';
const NOITE_A_PARTIR = 18, MEIO_A_PARTIR = 11;

const corDaArea = (areaId?: string) => AREAS.find(a => a.id === areaId)?.color ?? 'var(--ink)';
const chave = (v: PrioridadeRitual) => `${v.origem}:${v.texto ?? v.taskId ?? v.eventoId ?? v.habitoId ?? ''}`;
const NOMES = ['primeira', 'segunda', 'terceira'];

function ChipHabito({ habito, hoje, onVotar }: { habito: Habito; hoje: string; onVotar: () => void }) {
  const cor = corDaArea(habito.areaId);
  const votado = !!habito.votos[hoje];
  const agendado = estaAgendadoEm(habito, hoje);
  return (
    <button onClick={onVotar} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 38, padding: '7px 13px', borderRadius: 20,
      fontSize: 13.5, fontWeight: agendado ? 500 : 400,
      border: votado ? `1.5px solid ${cor}` : `1.5px ${agendado ? 'solid' : 'dashed'} color-mix(in srgb, ${cor} 45%, transparent)`,
      background: votado ? cor : agendado ? `color-mix(in srgb, ${cor} 9%, transparent)` : 'transparent',
      color: votado ? 'white' : agendado ? 'var(--char)' : 'var(--char-soft)',
    }}>
      <span aria-hidden style={{ fontSize: 12, width: 12, textAlign: 'center' }}>{votado ? '✓' : '·'}</span>
      {habito.acao}
      {habito.horario && <span style={{ fontSize: 11, opacity: 0.75, fontVariantNumeric: 'tabular-nums' }}>{habito.horario}</span>}
    </button>
  );
}

export default function HojeCelular({ habitsStore, projectsStore, calendarStore, rituaisStore, focoStore, onComecarBloco }: Props) {
  const [hoje] = useState(() => toDateStr(new Date()));
  const [dataCurta] = useState(() => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
  const [agora, setAgora] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  // Manhã (rascunho do ritual, só grava em "Começar o dia")
  const [energia, setEnergia] = useState<number | null>(null);
  const [rascunho, setRascunho] = useState<(PrioridadeRitual | null)[]>([null, null, null]);
  // Meio
  const [decisao, setDecisao] = useState<Record<number, 'manter'>>({});
  const [energiaMeio, setEnergiaMeio] = useState<number | null>(null);
  // Noite
  const [levar, setLevar] = useState<Record<number, boolean>>({});
  const [energiaNoite, setEnergiaNoite] = useState<number | null>(null);
  const [funcionou, setFuncionou] = useState('');
  const [amanha, setAmanha] = useState('');
  // Folha de escolher vitória: qual espaço, e se é do rascunho da manhã ou das vitórias já salvas
  const [escolhendo, setEscolhendo] = useState<{ i: number; salvo: boolean } | null>(null);
  const [verOutros, setVerOutros] = useState(false);

  useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setAgora(d.getHours() * 60 + d.getMinutes()); }, 30000);
    return () => clearInterval(id);
  }, []);

  const { habitos, votar } = habitsStore;
  const { projects, tasks, moveTask } = projectsStore;
  const manha = rituaisStore.registroDe(hoje, 'manha');
  const meio = rituaisStore.registroDe(hoje, 'meio');
  const noite = rituaisStore.registroDe(hoje, 'noite');
  const vitorias = manha?.vitorias ?? [];
  const hora = Math.floor(agora / 60);

  const momento: Momento = noite ? 'fechado'
    : hora >= NOITE_A_PARTIR ? 'noite'
    : !manha ? 'manha'
    : hora >= MEIO_A_PARTIR && !meio ? 'meio'
    : 'dia';

  // ── Agenda do dia ──
  const itens = itensComHora(calendarStore.events, hoje);
  const feitos = feitosDoDia(focoStore.sessoes, hoje);
  const resumo = resumoDoDia(itens, feitos, agora);
  const proximoBloco = itens.find(i => i.ev.type === 'foco' && i.fim > agora);

  // ── Vitórias ──
  const descrever = (v: PrioridadeRitual) => {
    if (v.origem === 'task') {
      const t = tasks.find(x => x.id === v.taskId);
      const p = projects.find(x => x.id === t?.projectId);
      return { texto: t?.title ?? 'tarefa apagada', origem: p?.title ?? 'tarefa', cor: p?.color, feita: t?.status === 'concluido' };
    }
    if (v.origem === 'habito') {
      const h = habitos.find(x => x.id === v.habitoId);
      return { texto: h?.acao ?? 'hábito apagado', origem: `hábito · ${AREAS.find(a => a.id === h?.areaId)?.name ?? ''}`, cor: corDaArea(h?.areaId), feita: !!h?.votos[hoje] };
    }
    if (v.origem === 'evento') {
      const e = calendarStore.events.find(x => x.id === v.eventoId);
      const p = projects.find(x => x.id === e?.projectId);
      return {
        texto: e?.title ?? 'evento apagado',
        origem: e?.type === 'foco' ? `◷ bloco ${e.time ?? ''}` : `evento ${e?.time ?? ''}`,
        cor: e?.type === 'foco' ? p?.color : 'var(--ink)', feita: !!v.done,
      };
    }
    return { texto: v.texto ?? '', origem: 'escrita', cor: 'var(--hanko)', feita: !!v.done };
  };
  const feitas = vitorias.filter(v => descrever(v).feita).length;

  const alternar = (i: number) => {
    const v = vitorias[i];
    if (v.origem === 'task' && v.taskId) moveTask(v.taskId, descrever(v).feita ? 'em_andamento' : 'concluido');
    else if (v.origem === 'habito' && v.habitoId) votar(v.habitoId);
    else { const novo = [...vitorias]; novo[i] = { ...v, done: !v.done }; rituaisStore.atualizarVitorias(hoje, novo); }
  };

  const escolher = (v: PrioridadeRitual) => {
    if (!escolhendo) return;
    if (escolhendo.salvo) {
      const novo = [...vitorias]; novo[escolhendo.i] = v; rituaisStore.atualizarVitorias(hoje, novo);
    } else {
      setRascunho(r => r.map((x, i) => (i === escolhendo.i ? v : x)));
    }
    setEscolhendo(null);
  };

  // Sugestões da manhã: o que você disse ontem que começaria, o que levou de ontem, e os blocos de hoje.
  const noiteOntem = rituaisStore.registroDe(addDays(hoje, -1), 'noite');
  const sugestoes: { v: PrioridadeRitual; de: string }[] = [
    ...(noiteOntem?.carrega ? [{ v: { origem: 'manual' as const, texto: noiteOntem.carrega }, de: 'você começa por isso' }] : []),
    ...(noiteOntem?.levar ?? []).map(v => ({ v: { ...v, done: false }, de: 'levada de ontem' })),
    ...itens.filter(i => i.ev.type === 'foco' && i.fim > agora).slice(0, 2).map(i => ({ v: { origem: 'evento' as const, eventoId: i.ev.id }, de: `bloco ${paraHora(i.ini)}` })),
  ].filter((s, i, arr) => arr.findIndex(x => chave(x.v) === chave(s.v)) === i)
    .filter(s => !rascunho.some(r => r && chave(r) === chave(s.v)));

  // ── Peças ──
  const linhaVitoria = (v: PrioridadeRitual | null, i: number, modo: 'manha' | 'dia' | 'meio' | 'noite', total: number) => {
    const fim = i < total - 1 ? `1px solid ${tinta(7)}` : 'none';
    if (!v) {
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: fim }}>
          <span className="serif" style={{ fontSize: 21, color: 'var(--hanko)', width: 12, flexShrink: 0, lineHeight: 1 }}>{i + 1}</span>
          <span style={{ flex: 1, fontSize: 14, color: 'var(--char-mute)', fontStyle: 'italic' }}>{NOMES[i]} vitória</span>
          <button onClick={() => setEscolhendo({ i, salvo: false })} style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', minHeight: 36 }}>escolher</button>
        </div>
      );
    }
    const d = descrever(v);
    return (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: fim }}>
        <span className="serif" style={{ fontSize: 21, color: 'var(--hanko)', width: 12, flexShrink: 0, lineHeight: 1 }}>{i + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, lineHeight: 1.35, color: d.feita ? 'var(--char-mute)' : 'var(--char)', textDecoration: d.feita ? 'line-through' : 'none' }}>{d.texto}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--char-mute)', marginTop: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.cor ?? 'var(--char-mute)', flexShrink: 0 }} />{d.origem}
          </div>
          {modo === 'meio' && !d.feita && (
            <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
              {(['manter', 'trocar'] as const).map(x => (
                <button key={x} onClick={() => (x === 'manter' ? setDecisao(dd => ({ ...dd, [i]: 'manter' })) : setEscolhendo({ i, salvo: true }))} style={{
                  fontSize: 12, padding: '5px 12px', borderRadius: 12, minHeight: 30,
                  border: `1px solid ${decisao[i] === x ? 'var(--ink)' : tinta(18)}`,
                  background: decisao[i] === x ? 'var(--ink)' : 'transparent', color: decisao[i] === x ? 'var(--washi)' : 'var(--char-soft)',
                }}>{x}</button>
              ))}
            </div>
          )}
          {modo === 'noite' && !d.feita && (
            // A linha inteira alterna; o Checkbox fica sem onChange.
            <div onClick={() => setLevar(l => ({ ...l, [i]: !l[i] }))} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 7, padding: '4px 10px 4px 6px', borderRadius: 12, cursor: 'pointer',
              fontSize: 12, color: levar[i] ? 'var(--hanko)' : 'var(--char-soft)', border: `1px solid ${levar[i] ? 'var(--hanko)' : tinta(16)}`,
            }}>
              <Checkbox checked={!!levar[i]} size={15} /> levar pra amanhã
            </div>
          )}
        </div>
        {modo === 'manha'
          ? <button onClick={() => setEscolhendo({ i, salvo: false })} style={{ fontSize: 13, color: 'var(--ink)', minHeight: 36 }}>trocar</button>
          // Marcar feita: o toque no Checkbox é o único gatilho (a linha não alterna).
          : <span onClick={() => alternar(i)} style={{ cursor: 'pointer', padding: 4 }}><Checkbox checked={d.feita} size={22} /></span>}
      </div>
    );
  };

  const agendaCurta = (
    <div style={cartao}>
      {itens.length === 0 ? <Vazio>Nada marcado hoje. Planeje blocos de foco na aba Agenda.</Vazio> : itens.map((it, i) => {
        const foco = it.ev.type === 'foco';
        const cor = foco ? projects.find(p => p.id === it.ev.projectId)?.color ?? 'var(--char-mute)' : 'var(--ink)';
        const est = foco ? estadoDoBloco(it, feitos, agora) : null;
        return (
          <div key={it.ev.id} style={{
            display: 'flex', alignItems: 'center', gap: 11, padding: '8px 0', opacity: it.fim <= agora ? 0.6 : 1,
            borderBottom: i < itens.length - 1 ? `1px solid ${tinta(6)}` : 'none',
          }}>
            <span style={{ width: 42, flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{paraHora(it.ini)}</span>
            <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: cor, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: it.ev.type === 'comemoracao' ? 'var(--hanko)' : 'var(--char)' }}>{foco && '◷ '}{it.ev.title}</span>
            {est && <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', color: est.ok ? 'var(--moss)' : 'var(--hanko)' }}>{est.ok ? formatarMinutos(est.minutos) : 'não aconteceu'}</span>}
          </div>
        );
      })}
    </div>
  );

  const ordenados = ordenarHabitosDoDia(habitos, hoje, computeNutridoMap(habitos, AREAS));
  const doDia = ordenados.filter(h => estaAgendadoEm(h, hoje) || h.votos[hoje]);
  const outros = ordenados.filter(h => !estaAgendadoEm(h, hoje) && !h.votos[hoje]);
  const habitosSecao = (
    <Secao titulo="hábitos de hoje" extra={doDia.length > 0 ? `${doDia.filter(h => h.votos[hoje]).length}/${doDia.length}` : undefined}>
      {habitos.length === 0 ? <Vazio>Nenhum hábito criado ainda.</Vazio> : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {doDia.map(h => <ChipHabito key={h.id} habito={h} hoje={hoje} onVotar={() => votar(h.id)} />)}
          {verOutros && outros.map(h => <ChipHabito key={h.id} habito={h} hoje={hoje} onVotar={() => votar(h.id)} />)}
          {outros.length > 0 && (
            <button onClick={() => setVerOutros(v => !v)} style={{ minHeight: 38, padding: '7px 12px', fontSize: 12.5, color: 'var(--ink)' }}>
              {verOutros ? 'esconder os de outros dias' : `+ ${outros.length} de outros dias`}
            </button>
          )}
        </div>
      )}
    </Secao>
  );

  const numeros = (lista: [string, string][]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
      {lista.map(([v, r]) => (
        <div key={r} style={{ background: tinta(5), borderRadius: 9, padding: '8px 9px' }}>
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
          <div style={{ fontSize: 10, color: 'var(--char-mute)', lineHeight: 1.25 }}>{r}</div>
        </div>
      ))}
    </div>
  );

  const momentoCartao = (rotulo: string) => <div style={{ ...kicker, color: 'var(--hanko)' }}>{rotulo}</div>;
  const bordaMomento = { ...cartao, borderColor: 'color-mix(in srgb, var(--hanko) 55%, transparent)' };
  const tituloMomento = (t: string) => <div className="serif" style={{ fontSize: 23, color: 'var(--ink)', margin: '2px 0 10px', lineHeight: 1.2 }}>{t}</div>;

  const proximoCartao = proximoBloco && (
    <div style={{ ...cartao, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={kicker}>{proximoBloco.ini <= agora ? 'bloco de agora' : `próximo bloco · ${paraHora(proximoBloco.ini)}`}</div>
        <div style={{ fontSize: 14, marginTop: 2 }}>{proximoBloco.ev.title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--char-mute)' }}>
          {projects.find(p => p.id === proximoBloco.ev.projectId)?.title ?? 'foco livre'} · {formatarMinutos(proximoBloco.fim - proximoBloco.ini)}
        </div>
      </div>
      <button onClick={() => onComecarBloco(proximoBloco.ev)} style={botaoContorno}>▶ Começar</button>
    </div>
  );

  // ── Telas por momento ──
  let principal: ReactNode;
  if (momento === 'manha') {
    const prontas = rascunho.every(Boolean);
    principal = <>
      <div style={bordaMomento}>
        {momentoCartao('agora · abrir o dia')}
        {tituloMomento('Como você acordou?')}
        <Energia valor={energia} onEscolher={setEnergia} />
        <div style={{ ...kicker, marginTop: 16 }}>as 3 vitórias de hoje</div>
        {sugestoes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0 4px' }}>
            {sugestoes.map(s => {
              const d = descrever(s.v);
              return (
                <button key={chave(s.v)} onClick={() => setRascunho(r => { const i = r.findIndex(x => !x); if (i < 0) return r; const n = [...r]; n[i] = s.v; return n; })}
                  disabled={prontas}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 16, fontSize: 12.5, color: 'var(--ink)', border: `1px dashed ${tinta(30)}`, opacity: prontas ? 0.5 : 1, textAlign: 'left' }}>
                  + {d.texto.length > 28 ? `${d.texto.slice(0, 27)}…` : d.texto} <span style={{ fontSize: 10.5, color: 'var(--hanko)' }}>{s.de}</span>
                </button>
              );
            })}
          </div>
        )}
        {rascunho.map((v, i) => linhaVitoria(v, i, 'manha', 3))}
        <button
          disabled={!energia || !prontas}
          onClick={() => energia && prontas && rituaisStore.salvarRitual({ data: hoje, tipo: 'manha', energia, vitorias: rascunho as PrioridadeRitual[] })}
          style={{ ...botaoCheio, marginTop: 12, opacity: energia && prontas ? 1 : 0.45 }}
        >
          {!energia ? 'Escolha a energia' : prontas ? 'Começar o dia' : 'Escolha as 3 vitórias'}
        </button>
      </div>
      <Secao titulo="hoje na agenda" extra={resumo.planejado > 0 ? `${formatarMinutos(resumo.planejado)} de foco planejado` : undefined}>{agendaCurta}</Secao>
    </>;
  } else if (momento === 'meio' || momento === 'dia') {
    principal = <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {momento === 'meio' ? (
          <div style={bordaMomento}>
            {momentoCartao('agora · meio do dia')}
            {tituloMomento('Ainda faz sentido?')}
            {numeros([[`${feitas}/${vitorias.length || 3}`, 'vitórias'], [formatarMinutos(resumo.feito), 'de foco'], [`${resumo.blocosCumpridos}/${resumo.blocosPassados}`, 'blocos cumpridos']])}
            <div style={{ marginTop: 6 }}>{vitorias.map((v, i) => linhaVitoria(v, i, 'meio', vitorias.length))}</div>
            <div style={{ ...kicker, marginTop: 12 }}>energia agora</div>
            <div style={{ marginTop: 6 }}><Energia valor={energiaMeio} onEscolher={setEnergiaMeio} /></div>
            <button
              onClick={() => rituaisStore.salvarRitual({ data: hoje, tipo: 'meio', energia: energiaMeio ?? manha?.energia ?? 3 })}
              style={{ ...botaoCheio, marginTop: 12 }}
            >
              Seguir o dia
            </button>
          </div>
        ) : (
          <div style={cartao}>
            <div style={{ ...kicker, display: 'flex', justifyContent: 'space-between' }}><span>as 3 vitórias</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{feitas}/{vitorias.length}</span></div>
            {manha?.intencao && <p className="serif" style={{ fontStyle: 'italic', fontSize: 16, margin: '6px 0 0', lineHeight: 1.35 }}>“{manha.intencao}”</p>}
            {vitorias.map((v, i) => linhaVitoria(v, i, 'dia', vitorias.length))}
          </div>
        )}
        {proximoCartao}
      </div>
      <Secao titulo="agenda" extra={resumo.planejado > 0 ? `${formatarMinutos(resumo.feito)} de ${formatarMinutos(resumo.planejado)} feitos` : undefined}>{agendaCurta}</Secao>
    </>;
  } else if (momento === 'noite') {
    const porProjeto = new Map<string, number>();
    for (const f of feitos) porProjeto.set(f.s.projectId ?? '', (porProjeto.get(f.s.projectId ?? '') ?? 0) + f.s.minutos);
    const linhas = [...porProjeto.entries()].sort((a, b) => b[1] - a[1]);
    const maior = Math.max(1, ...linhas.map(([, m]) => m));
    const fechar = () => {
      if (!energiaNoite) return;
      rituaisStore.salvarRitual({
        data: hoje, tipo: 'noite', energia: energiaNoite,
        funcionou: funcionou.trim() || undefined,
        carrega: amanha.trim() || undefined,
        levar: vitorias.filter((_, i) => levar[i]).map(v => ({ ...v, done: false })),
      });
    };
    const campo = { width: '100%', padding: '11px 12px', borderRadius: 9, border: `1px solid ${tinta(16)}`, background: 'var(--card-bg)', fontSize: 16, resize: 'none' as const, marginTop: 8 };
    principal = (
      <div style={bordaMomento}>
        {momentoCartao('agora · fechar o dia')}
        {tituloMomento(manha ? `${feitas} de ${vitorias.length} vitórias, ${formatarMinutos(resumo.feito)} de foco` : `${formatarMinutos(resumo.feito)} de foco hoje`)}
        {manha ? vitorias.map((v, i) => linhaVitoria(v, i, 'noite', vitorias.length)) : <Vazio>O dia não foi aberto hoje, sem vitórias pra conferir.</Vazio>}
        {(resumo.planejado > 0 || resumo.feito > 0) && <>
          <div style={{ ...kicker, margin: '14px 0 6px' }}>plano × feito</div>
          {numeros([[formatarMinutos(resumo.planejado), 'planejado'], [formatarMinutos(resumo.feito), 'feito'], [`${resumo.blocosCumpridos}/${resumo.blocosPassados}`, 'blocos cumpridos']])}
        </>}
        {linhas.length > 0 && <>
          <div style={{ ...kicker, margin: '14px 0 4px' }}>pra onde foi o foco</div>
          {linhas.map(([projectId, m]) => {
            const p = projects.find(x => x.id === projectId);
            return (
              <div key={projectId || 'livre'} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '3px 10px', padding: '5px 0', fontSize: 13 }}>
                <span>{projectId ? p?.title ?? 'projeto apagado' : 'Foco livre'}</span>
                <span style={{ color: 'var(--char-soft)', fontVariantNumeric: 'tabular-nums' }}>{formatarMinutos(m)}</span>
                <div style={{ gridColumn: '1 / -1', height: 5, borderRadius: 3, background: tinta(8), overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(m / maior) * 100}%`, background: p?.color ?? 'var(--char-mute)' }} />
                </div>
              </div>
            );
          })}
        </>}
        <div style={{ ...kicker, margin: '14px 0 6px' }}>como foi o dia</div>
        <Energia valor={energiaNoite} onEscolher={setEnergiaNoite} />
        <textarea rows={2} value={funcionou} onChange={e => setFuncionou(e.target.value)} placeholder="O que funcionou hoje?" style={{ ...campo, marginTop: 10 }} />
        <textarea rows={2} value={amanha} onChange={e => setAmanha(e.target.value)} placeholder="Amanhã eu começo por…" style={campo} />
        <button onClick={fechar} disabled={!energiaNoite} style={{ ...botaoCheio, marginTop: 12, opacity: energiaNoite ? 1 : 0.45 }}>
          {energiaNoite ? 'Fechar o dia' : 'Escolha como foi o dia'}
        </button>
      </div>
    );
  } else {
    const levadas = noite?.levar?.length ?? 0;
    principal = (
      <div style={{ ...cartao, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Hanko size={32} label="終" />
        <div style={{ fontSize: 13.5, color: 'var(--char-soft)', lineHeight: 1.5 }}>
          Dia fechado.
          {noite?.carrega && <> Amanhã você começa por <em>{noite.carrega}</em>.</>}
          {levadas > 0 && <> {levadas === 1 ? 'A vitória que você levou aparece' : `As ${levadas} vitórias que você levou aparecem`} como sugestão de manhã.</>}
        </div>
      </div>
    );
  }

  const titulo = momento === 'manha' ? 'Bom dia' : momento === 'meio' ? 'Meio do dia' : momento === 'noite' ? 'Fechar o dia' : hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div>
      <Cabecalho
        sobre={dataCurta}
        titulo={titulo}
        direita={manha ? <Hanko size={36} label="朝" /> : (
          <span title="ritual da manhã por fazer" className="jp" style={{
            width: 36, height: 36, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px dashed ${tinta(25)}`, color: 'var(--char-mute)', fontSize: 15,
          }}>朝</span>
        )}
      />
      {principal}
      {habitosSecao}
      <Lembretes />

      {escolhendo && (
        <EscolherVitoria
          numero={escolhendo.i}
          hoje={hoje}
          eventos={calendarStore.events}
          tasks={tasks}
          projects={projects}
          habitos={habitos}
          onEscolher={escolher}
          onFechar={() => setEscolhendo(null)}
        />
      )}
    </div>
  );
}
