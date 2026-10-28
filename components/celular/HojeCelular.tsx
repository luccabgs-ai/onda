'use client';
import { useState } from 'react';
import { AREAS } from '@/lib/data';
import { useHabitsStore } from '@/lib/habitsStore';
import { useProjectsStore } from '@/lib/projectsStore';
import { useCalendarStore } from '@/lib/calendarStore';
import { useRituaisStore } from '@/lib/rituaisStore';
import { computePrioridadesDoDia, PrioridadeItem } from '@/lib/prioridades';
import { computeNutridoMap, ordenarHabitosDoDia, estaAgendadoEm, toDateStr } from '@/lib/nutricao';
import { Habito } from '@/lib/types';
import { Checkbox } from '@/components/ui/Checkbox';
import { Hanko } from '@/components/ui/Hanko';
import RitualForm, { RitualRespostas } from '@/components/ritual/RitualForm';
import { tinta } from '@/components/organizacao/estilo';
import { cartao, kicker, botaoCheio, Cabecalho, Secao, Vazio, ForaDoApp } from './ui';
import Lembretes from './Lembretes';

interface Props {
  hour: number;
  habitsStore: ReturnType<typeof useHabitsStore>;
  projectsStore: ReturnType<typeof useProjectsStore>;
  calendarStore: ReturnType<typeof useCalendarStore>;
  rituaisStore: ReturnType<typeof useRituaisStore>;
}

const corDaArea = (areaId?: string) => AREAS.find(a => a.id === areaId)?.color ?? 'var(--ink)';

function ChipHabito({ habito, hoje, onVotar }: { habito: Habito; hoje: string; onVotar: () => void }) {
  const cor = corDaArea(habito.areaId);
  const votado = !!habito.votos[hoje];
  const agendado = estaAgendadoEm(habito, hoje);
  return (
    <button
      onClick={onVotar}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 38, padding: '7px 13px', borderRadius: 20,
        fontSize: 13.5, fontWeight: agendado ? 500 : 400,
        border: votado ? `1.5px solid ${cor}` : `1.5px ${agendado ? 'solid' : 'dashed'} color-mix(in srgb, ${cor} 45%, transparent)`,
        background: votado ? cor : agendado ? `color-mix(in srgb, ${cor} 9%, transparent)` : 'transparent',
        color: votado ? 'white' : agendado ? 'var(--char)' : 'var(--char-soft)',
      }}
    >
      <span aria-hidden style={{ fontSize: 12, width: 12, textAlign: 'center' }}>{votado ? '✓' : '·'}</span>
      {habito.acao}
      {habito.horario && (
        <span style={{ fontSize: 11, opacity: 0.75, fontVariantNumeric: 'tabular-nums' }}>{habito.horario}</span>
      )}
    </button>
  );
}

export default function HojeCelular({ hour, habitsStore, projectsStore, calendarStore, rituaisStore }: Props) {
  const [hoje] = useState(() => toDateStr(new Date()));
  const [dataCurta] = useState(() =>
    new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
  const [ritual, setRitual] = useState<'morning' | 'evening' | null>(null);
  const [verOutros, setVerOutros] = useState(false);

  const { habitos, votar } = habitsStore;
  const { projects, tasks, moveTask } = projectsStore;
  const manha = rituaisStore.registroDe(hoje, 'manha');
  const noite = rituaisStore.registroDe(hoje, 'noite');
  const vitorias = manha?.vitorias ?? [];
  const eventosHoje = [...calendarStore.getEventsForDate(hoje)].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));

  // Só as 3 vitórias escolhidas no ritual — os eventos de hoje aparecem na agenda logo abaixo.
  const slots = computePrioridadesDoDia({ tasks, projects, habitos, vitorias, events: calendarStore.events, hoje })
    .filter(i => i.slotIndex !== undefined);
  const feitas = slots.filter(i => i.done).length;

  const alternar = (item: PrioridadeItem) => {
    if (item.kind === 'manual') {
      const novo = [...vitorias];
      novo[item.slotIndex] = { ...novo[item.slotIndex], done: !novo[item.slotIndex].done };
      rituaisStore.atualizarVitorias(hoje, novo);
    } else if (item.kind === 'task') {
      moveTask(item.taskId, item.done ? 'em_andamento' : 'concluido');
    } else if (item.kind === 'habito') {
      votar(item.habitoId);
    }
  };

  const origemDe = (item: PrioridadeItem): { texto: string; cor?: string } | null => {
    if (item.kind === 'task') {
      const t = tasks.find(x => x.id === item.taskId);
      const p = projects.find(x => x.id === t?.projectId);
      return p ? { texto: p.title, cor: p.color } : null;
    }
    if (item.kind === 'habito') return { texto: `hábito · ${AREAS.find(a => a.id === item.areaId)?.name ?? ''}`, cor: corDaArea(item.areaId) };
    if (item.kind === 'evento') return { texto: `evento${item.time ? ` · ${item.time}` : ''}` };
    return null;
  };

  const ordenados = ordenarHabitosDoDia(habitos, hoje, computeNutridoMap(habitos, AREAS));
  const doDia = ordenados.filter(h => estaAgendadoEm(h, hoje) || h.votos[hoje]);
  const outros = ordenados.filter(h => !estaAgendadoEm(h, hoje) && !h.votos[hoje]);
  const votadosHoje = doDia.filter(h => h.votos[hoje]).length;

  const noturno = hour >= 18;
  const saudacao = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const salvar = (respostas: RitualRespostas) => {
    if (ritual) rituaisStore.salvarRitual({ data: hoje, tipo: ritual === 'morning' ? 'manha' : 'noite', ...respostas });
    setRitual(null);
  };

  const cartaoMomento = (titulo: string, texto: string, acao: string, abrir: () => void, rotulo: string) => (
    <div style={{ ...cartao, borderColor: 'color-mix(in srgb, var(--hanko) 55%, transparent)' }}>
      <div style={{ ...kicker, color: 'var(--hanko)' }}>{rotulo}</div>
      <div className="serif" style={{ fontSize: 23, color: 'var(--ink)', margin: '3px 0 6px', lineHeight: 1.2 }}>{titulo}</div>
      <p style={{ fontSize: 13.5, color: 'var(--char-soft)', margin: '0 0 12px', lineHeight: 1.5 }}>{texto}</p>
      <button onClick={abrir} style={botaoCheio}>{acao}</button>
    </div>
  );

  const vitoriasCard = manha && (
    <div style={cartao}>
      <div style={{ ...kicker, display: 'flex', justifyContent: 'space-between' }}>
        <span>as 3 vitórias de hoje</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{feitas}/{slots.length}</span>
      </div>
      {manha.intencao && (
        <p className="serif" style={{ fontStyle: 'italic', fontSize: 16, color: 'var(--char)', margin: '6px 0 2px', lineHeight: 1.35 }}>
          “{manha.intencao}”
        </p>
      )}
      {slots.length === 0 && <Vazio>Nenhuma vitória escolhida no ritual de hoje.</Vazio>}
      {slots.map((item, i) => {
        const origem = origemDe(item);
        const alternavel = item.kind !== 'evento';
        return (
          // A linha inteira alterna; o Checkbox fica sem onChange pro toque não contar duas vezes.
          <div
            key={item.id}
            onClick={alternavel ? () => alternar(item) : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', cursor: alternavel ? 'pointer' : 'default',
              borderBottom: i < slots.length - 1 ? `1px solid ${tinta(7)}` : 'none',
            }}
          >
            <span className="serif" style={{ fontSize: 20, color: 'var(--hanko)', width: 12, lineHeight: 1, flexShrink: 0 }}>{(item.slotIndex ?? i) + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14.5, lineHeight: 1.35,
                color: item.done ? 'var(--char-mute)' : 'var(--char)',
                textDecoration: item.done ? 'line-through' : 'none',
              }}>
                {item.text}
              </div>
              {origem && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--char-mute)', marginTop: 2 }}>
                  {origem.cor && <span style={{ width: 6, height: 6, borderRadius: '50%', background: origem.cor, flexShrink: 0 }} />}
                  {origem.texto}
                </div>
              )}
            </div>
            {alternavel && <Checkbox checked={item.done} size={22} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <Cabecalho
        sobre={dataCurta}
        titulo={saudacao}
        direita={manha
          ? <Hanko size={36} label="朝" />
          : <span title="ritual da manhã por fazer" style={{
            width: 36, height: 36, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px dashed ${tinta(25)}`, color: 'var(--char-mute)', fontSize: 15,
          }} className="jp">朝</span>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {noturno && !noite && cartaoMomento(
          'Fechar o dia', 'Dois minutos: como foi, o que funcionou e o que fica pra amanhã.',
          'Fechar o dia', () => setRitual('evening'), 'agora · noite',
        )}
        {!manha && !noturno && cartaoMomento(
          'Abrir o dia', 'Como você acordou, a intenção do dia e as 3 vitórias que fariam ele valer.',
          'Abrir o dia', () => setRitual('morning'), 'agora · manhã',
        )}
        {vitoriasCard}
        {noite && (
          <div style={{ ...cartao, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Hanko size={30} label="終" />
            <div style={{ fontSize: 13.5, color: 'var(--char-soft)' }}>
              Dia fechado.{noite.carrega && <> Amanhã: <em>{noite.carrega}</em></>}
            </div>
          </div>
        )}
      </div>

      <Secao titulo="agenda de hoje" extra={eventosHoje.length > 0 ? `${eventosHoje.length}` : undefined}>
        <div style={cartao}>
          {eventosHoje.length === 0 ? <Vazio>Nada marcado hoje.</Vazio> : eventosHoje.map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', gap: 12, alignItems: 'baseline', padding: '7px 0',
              borderBottom: i < eventosHoje.length - 1 ? `1px solid ${tinta(6)}` : 'none',
            }}>
              <span style={{ width: 42, flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                {e.time ?? 'dia'}
              </span>
              <span style={{ fontSize: 14, color: e.type === 'comemoracao' ? 'var(--hanko)' : 'var(--char)', minWidth: 0 }}>{e.title}</span>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="hábitos de hoje" extra={doDia.length > 0 ? `${votadosHoje}/${doDia.length}` : undefined}>
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

      <Lembretes />

      {ritual && (
        <ForaDoApp>
        <RitualForm
          kind={ritual}
          onClose={() => setRitual(null)}
          onSubmit={salvar}
          hoje={hoje}
          eventos={calendarStore.events}
          tasks={tasks}
          projects={projects}
          habitos={habitos}
        />
        </ForaDoApp>
      )}
    </div>
  );
}
