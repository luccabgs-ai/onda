'use client';
import { useState } from 'react';
import { CicloItemTipo } from '@/lib/types';
import { AREAS } from '@/lib/data';
import {
  Periodo, subperiodos, fracaoDecorrida, diasEntre, duracaoEmDias, diasRestantes, placarDoCiclo, itemAtingido,
  ritmoDoIndicador, ritmoBom, rotuloDoPeriodo,
} from '@/lib/ciclos';
import { Card } from '@/components/ui/Card';
import { ItemForm } from './ItemCiclo';
import {
  NavPeriodo, CampoFoco, ListaDeItens, CartoesDoTempo, Numeros, Etiqueta, SeloFechado, NotaPontos, TelaProps, Store,
} from './partes';
import { tinta, kickerStyle, botaoLink } from './estilo';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/**
 * Os 12 meses como um relógio: a cor de cada fatia é a nota do fechamento do mês; mês que
 * terminou com plano mas sem fechamento fica tracejado; a régua vermelha marca hoje.
 */
function AnelDoAno({ ano, hoje, store, onAbrir }: { ano: Periodo; hoje: string; store: Store; onAbrir: (p: Periodo) => void }) {
  const meses = subperiodos(ano, 'mes');
  const cx = 130, cy = 130, r = 92, largura = 20;
  const ponto = (a: number, raio = r) => [cx + raio * Math.sin(a), cy - raio * Math.cos(a)];
  const frac = fracaoDecorrida(ano, hoje);
  const dentro = hoje >= ano.inicio && hoje <= ano.fim;

  return (
    <svg viewBox="0 0 260 260" role="img" aria-label={`Os 12 meses de ${rotuloDoPeriodo(ano).titulo}, coloridos pela nota do fechamento`}
      style={{ width: '100%', maxWidth: 260, display: 'block', margin: '0 auto' }}>
      {meses.map((m, i) => {
        const a0 = (i / 12) * 2 * Math.PI + 0.035;
        const a1 = ((i + 1) / 12) * 2 * Math.PI - 0.035;
        const [x0, y0] = ponto(a0);
        const [x1, y1] = ponto(a1);
        const ciclo = store.cicloDe(m);
        const atual = hoje >= m.inicio && hoje <= m.fim;
        const passou = hoje > m.fim;
        const semFechar = passou && !!ciclo && !ciclo.fechadoEm;
        const cor = atual ? 'color-mix(in srgb, var(--hanko) 55%, transparent)'
          : ciclo?.fechadoEm ? `color-mix(in srgb, var(--ink) ${ciclo.nota ? 18 + ciclo.nota * 16 : 30}%, transparent)`
          : semFechar ? 'color-mix(in srgb, var(--hanko) 30%, transparent)'
          : tinta(passou ? 12 : 7);
        const am = ((i + 0.5) / 12) * 2 * Math.PI;
        const [lx, ly] = ponto(am, r + 24);
        const situacao = ciclo?.fechadoEm ? (ciclo.nota ? `nota ${ciclo.nota}` : 'fechado') : semFechar ? 'ficou sem fechamento' : atual ? 'agora' : '';
        return (
          <g key={m.inicio} onClick={() => onAbrir(m)} style={{ cursor: 'pointer' }}>
            <title>{MESES[i]}{situacao ? ` · ${situacao}` : ''}</title>
            <path
              d={`M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`}
              style={{ fill: 'none', stroke: cor, strokeWidth: largura, strokeDasharray: semFechar ? '3 3' : undefined }}
            />
            <text x={lx.toFixed(1)} y={(ly + 3.5).toFixed(1)} textAnchor="middle"
              style={{ fill: atual ? 'var(--hanko)' : 'var(--char-mute)', fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              {MESES[i][0].toUpperCase()}
            </text>
          </g>
        );
      })}
      {dentro && (() => {
        const a = frac * 2 * Math.PI;
        const [x0, y0] = ponto(a, r - 14);
        const [x1, y1] = ponto(a, r + 14);
        return <line x1={x0} y1={y0} x2={x1} y2={y1} style={{ stroke: 'var(--hanko)', strokeWidth: 3.5, strokeLinecap: 'round' }} />;
      })()}
      <text x={cx} y={cy + 6} textAnchor="middle" style={{ fill: 'var(--ink)', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34 }}>
        {Math.round(frac * 100)}%
      </text>
      {dentro && (
        <text x={cx} y={cy + 24} textAnchor="middle" style={{ fill: 'var(--char-mute)', fontSize: 9.5, letterSpacing: '0.12em', fontFamily: 'Inter, sans-serif' }}>
          DIA {diasEntre(ano.inicio, hoje) + 1} DE {duracaoEmDias(ano)}
        </text>
      )}
    </svg>
  );
}

function CartaoDoSemestre({ semestre, hoje, store, onAbrir }: { semestre: Periodo; hoje: string; store: Store; onAbrir: (p: Periodo) => void }) {
  const ciclo = store.cicloDe(semestre);
  const { atingidos, total } = placarDoCiclo(ciclo);
  const atual = hoje >= semestre.inicio && hoje <= semestre.fim;
  const rotulo = rotuloDoPeriodo(semestre);
  return (
    <Card onClick={() => onAbrir(semestre)} style={{
      padding: '16px 18px', cursor: 'pointer',
      borderColor: atual ? 'var(--ink)' : undefined, boxShadow: atual ? '0 0 0 1px var(--ink)' : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={kickerStyle}>{rotulo.titulo} · {rotulo.sub.split('·')[1]?.trim()}</span>
        {ciclo?.fechadoEm ? <SeloFechado size={20} /> : atual ? <Etiqueta cor="var(--hanko)">agora</Etiqueta> : null}
      </div>
      <p className="serif" style={{
        fontStyle: 'italic', fontSize: 17, lineHeight: 1.35, margin: '8px 0 0',
        color: ciclo?.foco ? 'var(--char)' : 'var(--char-mute)',
      }}>
        {ciclo?.foco ? `“${ciclo.foco}”` : 'Sem linha de chegada ainda.'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 11, color: 'var(--char-mute)' }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{total > 0 ? `${atingidos}/${total} atingidos` : ''}</span>
        {ciclo?.nota ? <NotaPontos nota={ciclo.nota} /> : ciclo?.meioEm ? <span>meio feito</span> : null}
      </div>
    </Card>
  );
}

export default function AnoTela(props: TelaProps) {
  const { periodo, hoje, store, onAbrir } = props;
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novo, setNovo] = useState<{ areaId: string; tipo: CicloItemTipo } | null>(null);

  const ciclo = store.cicloDe(periodo);
  const itens = ciclo?.itens ?? [];
  const metas = itens.filter(i => i.tipo === 'meta');
  const inds = itens.filter(i => i.tipo === 'indicador');
  const meses = subperiodos(periodo, 'mes');
  const terminados = meses.filter(m => m.fim < hoje);
  const fechados = terminados.filter(m => store.cicloDe(m)?.fechadoEm);
  const dentro = hoje >= periodo.inicio && hoje <= periodo.fim;
  const { atingidos, total } = placarDoCiclo(ciclo);

  // Áreas fixas + um grupo "sem área" só quando existe item solto.
  const grupos = [
    ...AREAS.map(a => ({ id: a.id, nome: a.name, kanji: a.kanji, cor: a.color })),
    ...(itens.some(i => !i.areaId || !AREAS.some(a => a.id === i.areaId))
      ? [{ id: '', nome: 'Sem área', kanji: '無', cor: 'var(--char-mute)' }] : []),
  ];

  const resumo = (
    <Numeros itens={[
      [`${metas.filter(itemAtingido).length}/${metas.length}`, 'metas cumpridas'],
      [`${inds.filter(i => ritmoBom(ritmoDoIndicador(i, periodo, hoje))).length}/${inds.length}`, 'indicadores no ritmo'],
      [`${fechados.length}/${terminados.length}`, 'meses fechados'],
    ]} />
  );

  const tituloSecao = (titulo: string, sub?: string) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, margin: '28px 0 12px', flexWrap: 'wrap' }}>
      <h3 className="serif" style={{ fontSize: 22, color: 'var(--ink)', fontWeight: 500, margin: 0 }}>{titulo}</h3>
      {sub && <span style={{ fontSize: 11.5, color: 'var(--char-mute)' }}>{sub}</span>}
    </div>
  );

  return (
    <div>
      <NavPeriodo {...props} titulo={false} />

      <div className="mobile-grid-1col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 28, alignItems: 'center', marginTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 76, lineHeight: 0.9, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
            {rotuloDoPeriodo(periodo).titulo}
            <span className="jp" style={{ fontSize: 30, color: 'var(--char-mute)', marginLeft: 10, verticalAlign: 14 }}>年</span>
          </div>
          <div style={{ ...kickerStyle, marginTop: 18 }}>a frase do ano</div>
          <CampoFoco ciclo={ciclo} periodo={periodo} store={store} tamanho={26} />
          <div style={{ fontSize: 13, color: 'var(--char-soft)', marginTop: 12, display: 'flex', gap: '4px 14px', flexWrap: 'wrap' }}>
            {dentro && <span>faltam <strong style={{ color: 'var(--ink)' }}>{diasRestantes(periodo, hoje)} dias</strong></span>}
            {total > 0 && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{atingidos}/{total} compromissos atingidos</span>}
            {terminados.length > 0 && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fechados.length} de {terminados.length} meses fechados</span>}
          </div>
        </div>
        <div>
          <AnelDoAno ano={periodo} hoje={hoje} store={store} onAbrir={onAbrir} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', fontSize: 10.5, color: 'var(--char-mute)', marginTop: 4 }}>
            <span>cor = nota do mês</span>
            <span style={{ color: 'var(--hanko)' }}>tracejado = sem fechamento</span>
          </div>
        </div>
      </div>

      {tituloSecao('Por área', 'o ano visto pelas áreas da vida')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 10, alignItems: 'start' }}>
        {grupos.map(g => {
          const daArea = itens.filter(i => g.id ? i.areaId === g.id : !i.areaId || !AREAS.some(a => a.id === i.areaId));
          const vazia = daArea.length === 0;
          const adicionando = novo?.areaId === g.id;
          return (
            <Card key={g.id || 'sem-area'} style={{
              padding: '14px 16px', borderTop: `3px solid ${g.cor}`,
              background: vazia && !adicionando ? 'transparent' : undefined,
              borderStyle: vazia && !adicionando ? 'dashed' : undefined, borderTopStyle: 'solid',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: vazia ? 6 : 0 }}>
                <span className="jp" style={{ fontSize: 18, color: g.cor }}>{g.kanji}</span>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{g.nome}</span>
                {!vazia && (
                  <span style={{ fontSize: 11, color: 'var(--char-mute)', fontVariantNumeric: 'tabular-nums' }}>
                    {daArea.filter(i => i.tipo === 'meta' ? itemAtingido(i) : ritmoBom(ritmoDoIndicador(i, periodo, hoje))).length}/{daArea.length}
                  </span>
                )}
              </div>
              {vazia && !adicionando && (
                <p style={{ fontSize: 12, color: 'var(--char-mute)', fontStyle: 'italic', margin: '0 0 4px' }}>
                  Nenhum compromisso pra {rotuloDoPeriodo(periodo).titulo}. Tudo bem, se for escolha.
                </p>
              )}
              <ListaDeItens
                itens={daArea}
                periodo={periodo}
                hoje={hoje}
                store={store}
                editandoId={editandoId}
                setEditandoId={id => { setEditandoId(id); setNovo(null); }}
              />
              {adicionando && novo ? (
                <ItemForm
                  tipo={novo.tipo}
                  areaInicial={g.id || undefined}
                  onCancelar={() => setNovo(null)}
                  onSalvar={data => { store.adicionarItem(periodo, { ...data, feito: novo.tipo === 'meta' ? false : undefined }); setNovo(null); }}
                />
              ) : (
                <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                  <button onClick={() => { setNovo({ areaId: g.id, tipo: 'meta' }); setEditandoId(null); }} style={{ ...botaoLink, fontSize: 12 }}>+ meta</button>
                  <button onClick={() => { setNovo({ areaId: g.id, tipo: 'indicador' }); setEditandoId(null); }} style={{ ...botaoLink, fontSize: 12 }}>+ indicador</button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {tituloSecao('Os dois semestres')}
      <div className="mobile-grid-1col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {subperiodos(periodo, 'semestre').map(s => (
          <CartaoDoSemestre key={s.inicio} semestre={s} hoje={hoje} store={store} onAbrir={onAbrir} />
        ))}
      </div>

      {tituloSecao('Início, meio e fim do ano')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 14, alignItems: 'start' }}>
        <CartoesDoTempo periodo={periodo} hoje={hoje} store={store} onAbrir={onAbrir} resumoMeio={resumo} />
      </div>
    </div>
  );
}
