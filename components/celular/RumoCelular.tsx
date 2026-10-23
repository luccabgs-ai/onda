'use client';
import { useState } from 'react';
import { AREAS } from '@/lib/data';
import { useObjetivosStore } from '@/lib/objetivosStore';
import { useHabitsStore } from '@/lib/habitsStore';
import { useCiclosStore } from '@/lib/ciclosStore';
import { valorAtualDeMeta, progressoDeMeta, metaConcluida } from '@/lib/metas';
import { periodoDe, rotuloDoPeriodo, itemAtingido, placarDoCiclo, Periodo } from '@/lib/ciclos';
import { toDateStr } from '@/lib/nutricao';
import { Checkbox } from '@/components/ui/Checkbox';
import { tinta } from '@/components/organizacao/estilo';
import { cartao, kicker, Cabecalho, Secao, Vazio, NotaPc } from './ui';

interface Props {
  objetivosStore: ReturnType<typeof useObjetivosStore>;
  habitsStore: ReturnType<typeof useHabitsStore>;
  ciclosStore: ReturnType<typeof useCiclosStore>;
}

const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/** Linha de chegada de um período + metas (toque marca) e indicadores (+/−). */
function CicloResumo({ periodo, store, compacto = false }: { periodo: Periodo; store: Props['ciclosStore']; compacto?: boolean }) {
  const ciclo = store.cicloDe(periodo);
  const rotulo = rotuloDoPeriodo(periodo);
  const itens = ciclo?.itens ?? [];
  const { atingidos, total } = placarDoCiclo(ciclo);

  return (
    <div style={cartao}>
      <div style={{ ...kicker, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>{rotulo.titulo} · {rotulo.sub}</span>
        {total > 0 && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{atingidos}/{total}</span>}
      </div>
      {ciclo?.foco ? (
        <p className="serif" style={{ fontStyle: 'italic', fontSize: compacto ? 16 : 18.5, color: 'var(--char)', margin: '6px 0 0', lineHeight: 1.35 }}>
          “{ciclo.foco}”
        </p>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--char-mute)', margin: '6px 0 0' }}>Sem linha de chegada. Ela se define na Organização, no computador.</p>
      )}
      {!compacto && itens.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {itens.map((i, idx) => (
            i.tipo === 'meta' ? (
              // A linha inteira alterna; o Checkbox fica sem onChange.
              <div key={i.id} onClick={() => store.editarItem(periodo, i.id, { feito: !i.feito })} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', cursor: 'pointer',
                borderTop: idx > 0 ? `1px solid ${tinta(6)}` : 'none',
              }}>
                <Checkbox checked={!!i.feito} size={20} />
                <span style={{ flex: 1, fontSize: 14, color: i.feito ? 'var(--char-mute)' : 'var(--char)', textDecoration: i.feito ? 'line-through' : 'none' }}>{i.titulo}</span>
              </div>
            ) : (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: idx > 0 ? `1px solid ${tinta(6)}` : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: 'var(--char)' }}>{i.titulo}</div>
                  <div style={{ fontSize: 12, color: itemAtingido(i) ? 'var(--moss)' : 'var(--char-mute)', fontVariantNumeric: 'tabular-nums' }}>
                    {i.atual !== undefined ? fmt(i.atual) : '–'} {i.sentido === 'menos' ? '≤' : 'de'} {fmt(i.alvo ?? 0)}{i.unidade ? ` ${i.unidade}` : ''}
                  </div>
                </div>
                {[-1, 1].map(d => (
                  <button key={d} onClick={() => store.ajustarIndicador(periodo, i.id, d)} aria-label={d > 0 ? 'aumentar' : 'diminuir'} style={{
                    width: 36, height: 36, borderRadius: 10, border: `1px solid ${tinta(20)}`, color: 'var(--ink)', fontSize: 17, fontWeight: 600,
                  }}>{d > 0 ? '+' : '−'}</button>
                ))}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default function RumoCelular({ objetivosStore, habitsStore, ciclosStore }: Props) {
  const [hoje] = useState(() => toDateStr(new Date()));
  const { objetivos, metas, loaded } = objetivosStore;
  const { habitos } = habitsStore;
  const ativos = objetivos.filter(o => o.status === 'ativo');

  return (
    <div>
      <Cabecalho sobre="por que eu faço o que faço" titulo="Rumo" />

      <Secao titulo="esta semana" primeira>
        <CicloResumo periodo={periodoDe('semana', hoje)} store={ciclosStore} />
        <div style={{ marginTop: 10 }}>
          <CicloResumo periodo={periodoDe('mes', hoje)} store={ciclosStore} compacto />
        </div>
      </Secao>

      <Secao titulo="objetivos" extra={ativos.length > 0 ? `${ativos.length} ativos` : undefined}>
        {!loaded ? <Vazio>carregando…</Vazio> : ativos.length === 0 ? <Vazio>Nenhum objetivo ativo.</Vazio> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ativos.map(o => {
              const area = AREAS.find(a => a.id === o.areaId);
              const metasDoObj = metas.filter(m => m.objetivoId === o.id);
              const habitosDoObj = habitos.filter(h => o.habitoIds.includes(h.id));
              return (
                <div key={o.id} style={cartao}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {area && <span className="jp" style={{ fontSize: 20, color: area.color, lineHeight: 1.2 }}>{area.kanji}</span>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="serif" style={{ fontSize: 19, color: 'var(--char)', lineHeight: 1.25 }}>{o.titulo}</div>
                      {o.descricao && <div style={{ fontSize: 12.5, color: 'var(--char-soft)', marginTop: 3, lineHeight: 1.45 }}>{o.descricao}</div>}
                    </div>
                  </div>
                  {metasDoObj.map(m => {
                    const atual = valorAtualDeMeta(m, habitos);
                    const ok = metaConcluida(m, habitos);
                    return (
                      <div key={m.id} style={{ marginTop: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
                          <span style={{ color: 'var(--char)', minWidth: 0 }}>{m.titulo}</span>
                          <span style={{ color: ok ? 'var(--moss)' : 'var(--char-soft)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                            {fmt(atual)}/{fmt(m.valorAlvo)}{m.unidade ? ` ${m.unidade}` : ''}
                          </span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: tinta(9), overflow: 'hidden', marginTop: 5 }}>
                          <div style={{ height: '100%', width: `${progressoDeMeta(m, habitos) * 100}%`, background: ok ? 'var(--moss)' : area?.color ?? 'var(--ink)' }} />
                        </div>
                      </div>
                    );
                  })}
                  {habitosDoObj.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                      {habitosDoObj.map(h => (
                        <span key={h.id} style={{
                          fontSize: 12, padding: '3px 9px', borderRadius: 12,
                          background: h.votos[hoje] ? 'color-mix(in srgb, var(--moss) 16%, transparent)' : tinta(6),
                          color: h.votos[hoje] ? 'var(--moss)' : 'var(--char-soft)',
                        }}>
                          {h.votos[hoje] ? '✓ ' : '↻ '}{h.acao}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Secao>

      <NotaPc>Áreas, hábitos e os ciclos de mês, semestre e ano continuam no computador, por enquanto.</NotaPc>
    </div>
  );
}
