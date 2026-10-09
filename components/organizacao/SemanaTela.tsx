'use client';
import React from 'react';
import { CalendarEvent, Habito, PrioridadeRitual, RitualRegistro, RitualTipo, Task } from '@/lib/types';
import {
  Periodo, diasDoPeriodo, meioDoPeriodo, itemAtingido, ritmoDoIndicador, ritmoBom, habitosDoDia,
} from '@/lib/ciclos';
import { DOW_LABELS } from '@/lib/nutricao';
import { Card } from '@/components/ui/Card';
import { Hanko } from '@/components/ui/Hanko';
import { CabecalhoCiclo, SecaoItens, CartoesDoTempo, Numeros, TelaProps } from './partes';
import { tinta, kickerStyle } from './estilo';

interface Props extends TelaProps {
  habitos: Habito[];
  tasks: Task[];
  eventosDoDia: (dia: string) => CalendarEvent[];
  registroDe: (dia: string, tipo: RitualTipo) => RitualRegistro | undefined;
}

/**
 * Quantas das 3 vitórias escolhidas no ritual daquele dia foram feitas. Tarefa e hábito vêm do
 * dado real; evento conta como feito depois que o dia passou (ele aconteceu).
 */
function vitoriasDoDia(vitorias: PrioridadeRitual[] | undefined, dia: string, hoje: string, tasks: Task[], habitos: Habito[]) {
  const preenchidas = (vitorias ?? []).filter(v =>
    (v.origem === 'manual' && v.texto?.trim()) || v.taskId || v.habitoId || v.eventoId);
  const feitas = preenchidas.filter(v => {
    if (v.origem === 'manual') return !!v.done;
    if (v.origem === 'task') return tasks.find(t => t.id === v.taskId)?.status === 'concluido';
    if (v.origem === 'habito') return !!habitos.find(h => h.id === v.habitoId)?.votos[dia];
    return dia < hoje;
  });
  return { feitas: feitas.length, total: preenchidas.length };
}

function Dia({ dia, hoje, periodo, habitos, tasks, eventos, registro }: {
  dia: string;
  hoje: string;
  periodo: Periodo;
  habitos: Habito[];
  tasks: Task[];
  eventos: CalendarEvent[];
  registro?: RitualRegistro;
}) {
  const ehHoje = dia === hoje;
  const futuro = dia > hoje;
  const marco = dia === periodo.inicio ? 'início' : dia === meioDoPeriodo(periodo) ? 'meio' : dia === periodo.fim ? 'chegada' : null;
  const habs = habitosDoDia(habitos, dia);
  const votados = habs.filter(h => h.votado).length;
  const vit = vitoriasDoDia(registro?.vitorias, dia, hoje, tasks, habitos);
  const ordenados = [...eventos].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
  const linha: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--char-soft)' };

  return (
    <Card style={{
      position: 'relative', padding: 12, minHeight: 176, display: 'flex', flexDirection: 'column', gap: 8,
      background: futuro ? 'transparent' : undefined,
      borderStyle: futuro ? 'dashed' : undefined,
      borderColor: ehHoje ? 'var(--ink)' : undefined,
      boxShadow: ehHoje ? '0 0 0 1px var(--ink)' : 'none',
      opacity: dia < hoje ? 0.8 : 1,
    }}>
      {marco && (
        <span style={{
          ...kickerStyle, fontSize: 8.5, position: 'absolute', top: -8, left: 10, padding: '0 5px',
          background: 'var(--washi)', color: marco === 'meio' && ehHoje ? 'var(--hanko)' : 'var(--char-mute)',
        }}>
          {marco}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ ...kickerStyle, fontSize: 10.5, letterSpacing: '0.1em' }}>
          {DOW_LABELS[new Date(dia + 'T12:00:00').getDay()]}
        </span>
        {ehHoje && <span style={{ fontSize: 10, color: 'var(--hanko)', fontWeight: 600 }}>hoje</span>}
        <span className="serif" style={{ fontSize: 24, color: 'var(--ink)', lineHeight: 1 }}>{Number(dia.slice(8))}</span>
      </div>

      {futuro ? (
        <div style={{ ...linha, color: 'var(--char-mute)' }}>ritual ainda não</div>
      ) : registro ? (
        <div style={linha} title="ritual da manhã feito · vitórias do dia">
          <Hanko size={16} label="朝" />
          <span style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: Math.max(vit.total, 1) }, (_, i) => (
              <span key={i} style={{ width: 13, height: 3, borderRadius: 2, background: i < vit.feitas ? 'var(--hanko)' : tinta(14) }} />
            ))}
          </span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{vit.feitas}/{vit.total}</span>
        </div>
      ) : (
        <div style={{ ...linha, color: 'var(--char-mute)' }}>sem ritual</div>
      )}

      {habs.length > 0 && (
        <div style={linha} title={habs.map(h => `${h.votado ? '✓' : '·'} ${h.habito.acao}`).join('\n')}>
          <span style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {habs.map(h => (
              <span key={h.habito.id} style={{
                width: 7, height: 7, borderRadius: '50%',
                border: '1.2px solid var(--moss)', background: h.votado ? 'var(--moss)' : 'transparent', opacity: h.votado ? 1 : 0.6,
              }} />
            ))}
          </span>
          <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {futuro ? `${habs.length} agendados` : `${votados}/${habs.length}`}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto' }}>
        {ordenados.slice(0, 3).map(e => {
          const comemoracao = e.type === 'comemoracao';
          return (
            <div key={e.id} title={e.title} style={{
              fontSize: 11, lineHeight: 1.3, padding: '3px 6px', borderRadius: 3,
              background: comemoracao ? 'color-mix(in srgb, var(--hanko) 10%, transparent)' : tinta(7),
              color: comemoracao ? 'var(--hanko)' : 'var(--ink)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {e.time && <span style={{ opacity: 0.75, marginRight: 4, fontVariantNumeric: 'tabular-nums' }}>{e.time}</span>}
              {e.title}
            </div>
          );
        })}
        {ordenados.length > 3 && <span style={{ fontSize: 10.5, color: 'var(--char-mute)' }}>+{ordenados.length - 3}</span>}
      </div>
    </Card>
  );
}

export default function SemanaTela(props: Props) {
  const { periodo, hoje, store, habitos, tasks, eventosDoDia, registroDe, onAbrir } = props;
  const dias = diasDoPeriodo(periodo);
  const ciclo = store.cicloDe(periodo);
  const itens = ciclo?.itens ?? [];
  const metas = itens.filter(i => i.tipo === 'meta');
  const inds = itens.filter(i => i.tipo === 'indicador');
  const diasVividos = dias.filter(d => d <= hoje);
  const rituais = diasVividos.filter(d => registroDe(d, 'manha')).length;

  const resumo = (
    <Numeros itens={[
      [`${metas.filter(itemAtingido).length}/${metas.length}`, 'metas cumpridas'],
      [`${inds.filter(i => ritmoBom(ritmoDoIndicador(i, periodo, hoje))).length}/${inds.length}`, 'indicadores no ritmo'],
      [`${rituais}/${diasVividos.length}`, 'rituais da manhã'],
    ]} />
  );

  return (
    <div>
      <CabecalhoCiclo {...props} />

      <div style={{ overflowX: 'auto', margin: '0 -2px 14px', padding: '10px 2px 2px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(112px, 1fr))', gap: 8, minWidth: 820 }}>
          {dias.map(d => (
            <Dia
              key={d}
              dia={d}
              hoje={hoje}
              periodo={periodo}
              habitos={habitos}
              tasks={tasks}
              eventos={eventosDoDia(d)}
              registro={registroDe(d, 'manha')}
            />
          ))}
        </div>
      </div>

      <div className="mobile-grid-1col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SecaoItens tipo="meta" periodo={periodo} hoje={hoje} store={store} />
          <SecaoItens tipo="indicador" periodo={periodo} hoje={hoje} store={store} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CartoesDoTempo periodo={periodo} hoje={hoje} store={store} onAbrir={onAbrir} resumoMeio={resumo} />
        </div>
      </div>
    </div>
  );
}
