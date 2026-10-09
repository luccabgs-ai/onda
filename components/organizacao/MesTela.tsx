'use client';
import { CalendarEvent, Habito } from '@/lib/types';
import {
  Periodo, subperiodos, diasDoPeriodo, meioDoPeriodo, rotuloDoPeriodo, placarDoCiclo, itemAtingido,
  ritmoDoIndicador, ritmoBom, aproveitamentoDoDia,
} from '@/lib/ciclos';
import { Card } from '@/components/ui/Card';
import { CabecalhoCiclo, SecaoItens, CartoesDoTempo, Numeros, Rotulo, Etiqueta, SeloFechado, TelaProps } from './partes';
import { tinta, kickerStyle } from './estilo';

interface Props extends TelaProps {
  habitos: Habito[];
  eventosDoDia: (dia: string) => CalendarEvent[];
}

const COLUNAS = '168px repeat(7, minmax(0, 1fr))';

function RailDaSemana({ semana, hoje, store, onAbrir }: { semana: Periodo; hoje: string; store: Props['store']; onAbrir: (p: Periodo) => void }) {
  const ciclo = store.cicloDe(semana);
  const { atingidos, total } = placarDoCiclo(ciclo);
  const temPlano = !!ciclo && (!!ciclo.foco?.trim() || ciclo.itens.length > 0);
  const atual = hoje >= semana.inicio && hoje <= semana.fim;
  const passou = hoje > semana.fim;
  const titulo = rotuloDoPeriodo(semana).titulo.replace('Semana', 'Sem');

  const status = ciclo?.fechadoEm ? <SeloFechado />
    : atual ? <Etiqueta cor="var(--hanko)">agora</Etiqueta>
    : passou && temPlano ? <Etiqueta cor="var(--hanko)">em aberto</Etiqueta>
    : !temPlano && !passou ? <Etiqueta>planejar</Etiqueta>
    : null;

  return (
    <button
      onClick={() => onAbrir(semana)}
      title={`abrir ${rotuloDoPeriodo(semana).titulo.toLowerCase()}`}
      style={{
        textAlign: 'left', minWidth: 0, padding: '8px 10px', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 3,
        border: `1px solid ${atual ? 'var(--ink)' : tinta(9)}`,
        background: atual ? 'var(--card-bg)' : 'transparent',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--ink)' }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{titulo}{total > 0 && <span style={{ fontWeight: 400, color: 'var(--char-soft)' }}> · {atingidos}/{total}</span>}</span>
        {status}
      </span>
      <span style={ciclo?.foco
        ? {
          fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: 'var(--char-soft)', lineHeight: 1.25,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }
        : { fontSize: 11, color: 'var(--char-mute)' }}>
        {ciclo?.foco ?? (passou ? rotuloDoPeriodo(semana).sub : 'Sem linha de chegada ainda')}
      </span>
    </button>
  );
}

export default function MesTela(props: Props) {
  const { periodo, hoje, store, habitos, eventosDoDia, onAbrir } = props;
  const semanas = subperiodos(periodo, 'semana');
  const meio = meioDoPeriodo(periodo);
  const itens = store.cicloDe(periodo)?.itens ?? [];
  const metas = itens.filter(i => i.tipo === 'meta');
  const inds = itens.filter(i => i.tipo === 'indicador');
  const semanasPassadas = semanas.filter(s => s.fim < hoje);

  const resumo = (
    <Numeros itens={[
      [`${metas.filter(itemAtingido).length}/${metas.length}`, 'metas cumpridas'],
      [`${inds.filter(i => ritmoBom(ritmoDoIndicador(i, periodo, hoje))).length}/${inds.length}`, 'indicadores no ritmo'],
      [`${semanasPassadas.filter(s => store.cicloDe(s)?.fechadoEm).length}/${semanasPassadas.length}`, 'semanas fechadas'],
    ]} />
  );

  return (
    <div>
      <CabecalhoCiclo {...props} />

      <Card style={{ padding: '18px 22px', marginBottom: 14 }}>
        <Rotulo kicker="o mês, semana a semana" titulo="Cada semana é um degrau" />
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 620 }}>
            <div style={{ display: 'grid', gridTemplateColumns: COLUNAS, gap: 4, paddingBottom: 6 }}>
              <span style={kickerStyle}>semana</span>
              {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(d => (
                <span key={d} style={{ ...kickerStyle, textAlign: 'center' }}>{d}</span>
              ))}
            </div>
            {semanas.map(s => (
              <div key={s.inicio} style={{ display: 'grid', gridTemplateColumns: COLUNAS, gap: 4, marginBottom: 4 }}>
                <RailDaSemana semana={s} hoje={hoje} store={store} onAbrir={onAbrir} />
                {diasDoPeriodo(s).map(d => {
                  const fora = d < periodo.inicio || d > periodo.fim;
                  const ehHoje = d === hoje;
                  const futuro = d > hoje;
                  const calor = futuro ? 0 : aproveitamentoDoDia(habitos, d);
                  const eventos = [...eventosDoDia(d)].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
                  const marco = fora ? null : d === meio ? 'meio' : d === periodo.fim ? 'chegada' : null;
                  return (
                    <div key={d} style={{
                      position: 'relative', minHeight: 64, padding: '6px 7px', borderRadius: 4,
                      display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0,
                      opacity: fora ? 0.35 : 1,
                      background: futuro ? 'transparent' : `color-mix(in srgb, var(--moss) ${Math.round(calor * 34)}%, transparent)`,
                      border: ehHoje ? '1px solid var(--ink)' : futuro ? `1px dashed ${tinta(9)}` : '1px solid transparent',
                      boxShadow: ehHoje ? 'inset 0 0 0 1px var(--ink)' : 'none',
                    }}>
                      <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: ehHoje ? 'var(--ink)' : 'var(--char-soft)', fontWeight: ehHoje ? 600 : 400 }}>
                        {Number(d.slice(8))}
                      </span>
                      {marco && (
                        <span style={{ ...kickerStyle, position: 'absolute', top: 6, right: 6, fontSize: 7.5, color: 'var(--hanko)', letterSpacing: '0.1em' }}>{marco}</span>
                      )}
                      {eventos.slice(0, 2).map(e => (
                        <span key={e.id} title={e.title} style={{
                          fontSize: 9.5, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          color: e.type === 'comemoracao' ? 'var(--hanko)' : 'var(--ink)',
                        }}>
                          {e.title}
                        </span>
                      ))}
                      {eventos.length > 2 && <span style={{ fontSize: 9, color: 'var(--char-mute)' }}>+{eventos.length - 2}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: 'var(--char-mute)', marginTop: 10, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'color-mix(in srgb, var(--moss) 34%, transparent)' }} />
            quanto mais verde, mais hábitos votados
          </span>
          <span>toque numa semana pra abrir</span>
        </div>
      </Card>

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
