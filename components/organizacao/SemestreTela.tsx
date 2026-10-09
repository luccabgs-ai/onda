'use client';
import {
  Periodo, subperiodos, meioDoPeriodo, diasEntre, duracaoEmDias, fracaoDecorrida, placarDoCiclo, itemAtingido,
  ritmoDoIndicador, ritmoBom, nomeDoMesCurto,
} from '@/lib/ciclos';
import { Card } from '@/components/ui/Card';
import { CabecalhoCiclo, SecaoItens, CartoesDoTempo, Numeros, Rotulo, Etiqueta, SeloFechado, NotaPontos, TelaProps, Store } from './partes';
import { tinta, kickerStyle } from './estilo';

function CartaoDoMes({ mes, hoje, store, onAbrir, ultimo }: { mes: Periodo; hoje: string; store: Store; onAbrir: (p: Periodo) => void; ultimo: boolean }) {
  const ciclo = store.cicloDe(mes);
  const { atingidos, total } = placarDoCiclo(ciclo);
  const atual = hoje >= mes.inicio && hoje <= mes.fim;
  const futuro = hoje < mes.inicio;
  const passou = hoje > mes.fim;

  const status = ciclo?.fechadoEm ? <SeloFechado size={20} />
    : atual ? <Etiqueta cor="var(--hanko)">agora</Etiqueta>
    : passou && ciclo ? <Etiqueta cor="var(--hanko)">em aberto</Etiqueta>
    : ultimo ? <Etiqueta>chegada</Etiqueta>
    : null;

  return (
    <Card onClick={() => onAbrir(mes)} style={{
      padding: '14px 14px 12px', minHeight: 190, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
      background: futuro ? 'transparent' : undefined,
      borderStyle: futuro ? 'dashed' : undefined,
      borderColor: atual ? 'var(--ink)' : undefined,
      boxShadow: atual ? '0 0 0 1px var(--ink)' : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <span className="serif" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1 }}>{nomeDoMesCurto(mes)}</span>
        {status}
      </div>
      <span style={ciclo?.foco
        ? { flex: 1, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: 'var(--char-soft)', lineHeight: 1.3 }
        : { flex: 1, fontSize: 11.5, color: 'var(--char-mute)' }}>
        {ciclo?.foco ?? (futuro ? 'Ainda sem plano. Ele nasce quando o mês chegar perto.' : 'Sem linha de chegada.')}
      </span>
      {total > 0 && (
        <div style={{ height: 3, borderRadius: 2, background: tinta(9), overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(atingidos / total) * 100}%`, background: 'var(--moss)' }} />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--char-mute)', minHeight: 14 }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{total > 0 ? `${atingidos}/${total} atingidos` : ''}</span>
        {ciclo?.nota && <NotaPontos nota={ciclo.nota} />}
      </div>
    </Card>
  );
}

export default function SemestreTela(props: TelaProps) {
  const { periodo, hoje, store, onAbrir } = props;
  const meses = subperiodos(periodo, 'mes');
  const ciclo = store.cicloDe(periodo);
  const frac = fracaoDecorrida(periodo, hoje);
  const posMeio = diasEntre(periodo.inicio, meioDoPeriodo(periodo)) / duracaoEmDias(periodo);
  const dentro = hoje >= periodo.inicio && hoje <= periodo.fim;

  const itens = ciclo?.itens ?? [];
  const metas = itens.filter(i => i.tipo === 'meta');
  const inds = itens.filter(i => i.tipo === 'indicador');
  const terminados = meses.filter(m => m.fim < hoje);
  const fechados = terminados.filter(m => store.cicloDe(m)?.fechadoEm);
  const notas = meses.map(m => store.cicloDe(m)?.nota).filter((n): n is number => !!n);
  const mediaNotas = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1).replace('.', ',') : '–';
  const somaMensal = meses.reduce((acc, m) => {
    const p = placarDoCiclo(store.cicloDe(m));
    return { atingidos: acc.atingidos + p.atingidos, total: acc.total + p.total };
  }, { atingidos: 0, total: 0 });

  const ritmo = (
    <Card style={{ padding: '18px 22px' }}>
      <Rotulo kicker="o ritmo até aqui" titulo={`${terminados.length} de ${meses.length} meses vividos`} />
      <Numeros itens={[
        [`${fechados.length}/${terminados.length}`, 'meses fechados'],
        [mediaNotas, 'nota média dos meses'],
        [`${somaMensal.atingidos}/${somaMensal.total}`, 'itens mensais atingidos'],
      ]} />
    </Card>
  );

  const resumo = (
    <Numeros itens={[
      [`${metas.filter(itemAtingido).length}/${metas.length}`, 'marcos cumpridos'],
      [`${inds.filter(i => ritmoBom(ritmoDoIndicador(i, periodo, hoje))).length}/${inds.length}`, 'indicadores no ritmo'],
      [`${fechados.length}/${terminados.length}`, 'meses fechados'],
    ]} />
  );

  return (
    <div>
      <CabecalhoCiclo {...props} />

      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <div style={{ position: 'relative', minWidth: 820, paddingTop: 30 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 10, height: 3, borderRadius: 2, background: tinta(10) }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${frac * 100}%`, background: 'var(--ink)', opacity: 0.55, borderRadius: 2 }} />
            <span style={{
              ...kickerStyle, position: 'absolute', left: `${posMeio * 100}%`, top: -17, transform: 'translateX(-50%)', fontSize: 8.5,
              color: ciclo?.meioEm ? 'var(--moss)' : hoje >= meioDoPeriodo(periodo) ? 'var(--hanko)' : 'var(--char-mute)', whiteSpace: 'nowrap',
            }}>
              meio{ciclo?.meioEm ? ' ✓' : ''}
            </span>
            <span style={{
              position: 'absolute', left: `${posMeio * 100}%`, top: -3, width: 9, height: 9, borderRadius: '50%', transform: 'translateX(-50%)',
              background: ciclo?.meioEm ? 'var(--moss)' : 'var(--washi)', border: `2px solid ${ciclo?.meioEm ? 'var(--moss)' : tinta(30)}`,
            }} />
            {dentro && (
              <span title="hoje" style={{
                position: 'absolute', left: `${frac * 100}%`, top: -7, width: 4, height: 17, borderRadius: 2,
                background: 'var(--hanko)', transform: 'translateX(-50%)',
              }} />
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${meses.length}, minmax(0, 1fr))`, gap: 10 }}>
            {meses.map((m, i) => (
              <CartaoDoMes key={m.inicio} mes={m} hoje={hoje} store={store} onAbrir={onAbrir} ultimo={i === meses.length - 1} />
            ))}
          </div>
        </div>
      </div>

      <div className="mobile-grid-1col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SecaoItens tipo="meta" periodo={periodo} hoje={hoje} store={store} kicker="os marcos do semestre" />
          <SecaoItens tipo="indicador" periodo={periodo} hoje={hoje} store={store} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CartoesDoTempo periodo={periodo} hoje={hoje} store={store} onAbrir={onAbrir} resumoMeio={resumo} extra={ritmo} />
        </div>
      </div>
    </div>
  );
}
