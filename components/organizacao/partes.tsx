'use client';
import React, { useState } from 'react';
import { Ciclo, CicloItem, CicloItemTipo } from '@/lib/types';
import { useCiclosStore } from '@/lib/ciclosStore';
import {
  Periodo, ESCALAS, ESCALA_FILHA, MomentoCiclo, periodoDe, periodoAnterior, periodoSeguinte,
  rotuloDoPeriodo, meioDoPeriodo, diasRestantes, dataCurta, itemAtingido, placarDoCiclo,
  momentoDoCiclo, ritmoDoIndicador, ritmoBom,
} from '@/lib/ciclos';
import { toDateStr, addDays } from '@/lib/nutricao';
import { Card } from '@/components/ui/Card';
import { Hanko } from '@/components/ui/Hanko';
import { ItemForm, ItemLinha, descreverAlvo } from './ItemCiclo';
import { tinta, campoStyle, kickerStyle, tituloCardStyle, botaoPrimario, botaoSecundario, botaoLink } from './estilo';

export type Store = ReturnType<typeof useCiclosStore>;

/** O que toda tela de escala recebe de OrganizacaoScreen. */
export interface TelaProps {
  periodo: Periodo;
  hoje: string;
  store: Store;
  ehAtual: boolean;
  onNavegar: (p: Periodo) => void;
  onVoltarAtual: () => void;
  /** Abre outro período em outra escala — ex: clicar numa semana dentro do mês. */
  onAbrir: (p: Periodo) => void;
}

// ── Peças pequenas ────────────────────────────────────────────────────────────

/** Texto livre que grava ao sair do campo — não a cada tecla. */
export function CampoTexto({ valor, onSalvar, placeholder, rows = 3, style }: {
  valor?: string;
  onSalvar: (v: string | undefined) => void;
  placeholder: string;
  rows?: number;
  style?: React.CSSProperties;
}) {
  const [rascunho, setRascunho] = useState(valor ?? '');
  return (
    <textarea
      value={rascunho}
      onChange={e => setRascunho(e.target.value)}
      onBlur={() => { const v = rascunho.trim(); if (v !== (valor ?? '')) onSalvar(v || undefined); }}
      placeholder={placeholder}
      rows={rows}
      style={{ ...campoStyle, ...style }}
    />
  );
}

export function Rotulo({ kicker, titulo, extra, corKicker }: { kicker: string; titulo: string; extra?: React.ReactNode; corKicker?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...kickerStyle, color: corKicker ?? kickerStyle.color }}>{kicker}</div>
        <h3 className="serif" style={tituloCardStyle}>{titulo}</h3>
      </div>
      {extra}
    </div>
  );
}

export function Etiqueta({ children, cor = 'var(--char-mute)' }: { children: React.ReactNode; cor?: string }) {
  return (
    <span style={{
      fontSize: 10.5, padding: '1px 7px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0,
      color: cor, background: `color-mix(in srgb, ${cor} 11%, transparent)`,
    }}>
      {children}
    </span>
  );
}

/** Selo 終 pequeno — período fechado. */
export const SeloFechado = ({ size = 18 }: { size?: number }) => <Hanko size={size} label="終" />;

/** Pontinhos do placar — um por item, cheio quando atingido. */
export function Placar({ itens, alinhar = 'flex-end' }: { itens: CicloItem[]; alinhar?: React.CSSProperties['justifyContent'] }) {
  if (itens.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: alinhar }}>
      {itens.map(i => (
        <span key={i.id} title={i.titulo} style={{
          width: 9, height: 9, borderRadius: '50%',
          background: itemAtingido(i) ? 'var(--moss)' : 'transparent',
          border: `1.5px solid ${itemAtingido(i) ? 'var(--moss)' : tinta(25)}`,
        }} />
      ))}
    </div>
  );
}

/** Pontinhos da nota de 1 a 5 dada no fechamento. */
export function NotaPontos({ nota }: { nota: number }) {
  return (
    <span title={`nota ${nota} de 5`} style={{ display: 'inline-flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: n <= nota ? 'var(--ink)' : tinta(13) }} />
      ))}
    </span>
  );
}

/** Números grandes lado a lado (resumo do ponto do meio, ritmo do semestre). */
export function Numeros({ itens }: { itens: [React.ReactNode, string][] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(92px, 1fr))`, gap: 8 }}>
      {itens.map(([valor, legenda]) => (
        <div key={legenda} style={{ padding: '8px 10px', borderRadius: 4, background: tinta(4) }}>
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{valor}</div>
          <div style={{ fontSize: 10.5, color: 'var(--char-mute)', lineHeight: 1.3 }}>{legenda}</div>
        </div>
      ))}
    </div>
  );
}

/** Cartão que dobra: só o cabeçalho aparece até ser aberto. */
export function Dobra({ kicker, titulo, extra, abertoInicial = false, destaque = false, children }: {
  kicker: string;
  titulo: string;
  extra?: React.ReactNode;
  abertoInicial?: boolean;
  destaque?: boolean;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(abertoInicial);
  return (
    <Card style={{ padding: '18px 22px', borderColor: destaque ? 'var(--hanko)' : undefined }}>
      <div
        onClick={() => setAberto(a => !a)}
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, cursor: 'pointer', marginBottom: aberto ? 12 : 0 }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ ...kickerStyle, color: destaque ? 'var(--hanko)' : kickerStyle.color }}>{kicker}</div>
          <h3 className="serif" style={tituloCardStyle}>{titulo}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {extra}
          <span aria-hidden style={{
            fontSize: 13, color: 'var(--char-mute)', display: 'inline-block',
            transform: aberto ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s',
          }}>›</span>
        </div>
      </div>
      {aberto && children}
    </Card>
  );
}

// ── Cabeçalho: navegação + linha de chegada + placar ──────────────────────────

const setaStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%', border: `1px solid ${tinta(18)}`,
  color: 'var(--ink)', fontSize: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

export function NavPeriodo({ periodo, ehAtual, onNavegar, onVoltarAtual, titulo = true }: Pick<TelaProps, 'periodo' | 'ehAtual' | 'onNavegar' | 'onVoltarAtual'> & { titulo?: boolean }) {
  const rotulo = rotuloDoPeriodo(periodo);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <button onClick={() => onNavegar(periodoAnterior(periodo))} style={setaStyle} title="período anterior">‹</button>
      {titulo && <h2 className="serif" style={{ fontSize: 30, color: 'var(--ink)', margin: 0, fontWeight: 500, lineHeight: 1.1 }}>{rotulo.titulo}</h2>}
      <span style={{ fontSize: 13, color: 'var(--char-mute)' }}>{rotulo.sub}</span>
      <button onClick={() => onNavegar(periodoSeguinte(periodo))} style={setaStyle} title="próximo período">›</button>
      {!ehAtual && (
        <button onClick={onVoltarAtual} style={{ fontSize: 11.5, color: 'var(--ink)', textDecoration: 'underline' }}>
          voltar pro atual
        </button>
      )}
    </div>
  );
}

/** A linha de chegada, editável no próprio lugar — sem caixa em volta, como uma frase escrita. */
export function CampoFoco({ ciclo, periodo, store, tamanho = 21 }: { ciclo?: Ciclo; periodo: Periodo; store: Store; tamanho?: number }) {
  const [rascunho, setRascunho] = useState(ciclo?.foco ?? '');
  const linhas = Math.max(1, Math.ceil(rascunho.length / (tamanho > 22 ? 40 : 58)));
  return (
    <textarea
      value={rascunho}
      onChange={e => setRascunho(e.target.value)}
      onBlur={() => {
        const v = rascunho.trim();
        if (v !== (ciclo?.foco ?? '')) store.atualizar(periodo, { foco: v || undefined });
      }}
      placeholder={ESCALAS[periodo.escala].perguntaFoco}
      rows={linhas}
      style={{
        width: '100%', maxWidth: 720, display: 'block', resize: 'none', border: 'none',
        borderBottom: `1px dashed ${tinta(rascunho ? 10 : 22)}`, background: 'transparent',
        padding: '4px 0 6px', margin: '4px 0 0',
        fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: tamanho, lineHeight: 1.35,
        color: 'var(--char)',
      }}
    />
  );
}

/** "dentro de Outubro — “foco do mês”": liga o período à escala maior. */
export function LinhaPai({ periodo, store }: { periodo: Periodo; store: Store }) {
  const paiEscala = ESCALAS[periodo.escala].pai;
  if (!paiEscala) return null;
  const pai = periodoDe(paiEscala, periodo.inicio);
  const foco = store.cicloDe(pai)?.foco;
  return (
    <p style={{ fontSize: 12.5, color: 'var(--char-mute)', margin: '10px 0 0', lineHeight: 1.5 }}>
      dentro de <strong style={{ fontWeight: 600, color: 'var(--char-soft)' }}>{rotuloDoPeriodo(pai).titulo}</strong>
      {foco
        ? <> — <em className="serif" style={{ fontSize: 14.5, color: 'var(--ink)' }}>“{foco}”</em></>
        : <> — ainda sem linha de chegada pro {ESCALAS[paiEscala].label.toLowerCase()}.</>}
    </p>
  );
}

export function PlacarGrande({ ciclo }: { ciclo?: Ciclo }) {
  const { atingidos, total } = placarDoCiclo(ciclo);
  return (
    <div className="organizacao-placar" style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={kickerStyle}>atingidos</div>
      <div className="serif" style={{ fontSize: 34, color: 'var(--ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {atingidos}<span style={{ fontSize: 20, color: 'var(--char-mute)' }}>/{total}</span>
      </div>
      <div style={{ marginTop: 6 }}><Placar itens={ciclo?.itens ?? []} /></div>
    </div>
  );
}

export function CabecalhoCiclo(props: TelaProps) {
  const { periodo, store } = props;
  const ciclo = store.cicloDe(periodo);
  return (
    <div className="mobile-stack" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '18px 28px', marginBottom: 18 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <NavPeriodo {...props} />
        <div style={{ ...kickerStyle, marginTop: 14 }}>linha de chegada</div>
        <CampoFoco ciclo={ciclo} periodo={periodo} store={store} />
        <LinhaPai periodo={periodo} store={store} />
      </div>
      <PlacarGrande ciclo={ciclo} />
    </div>
  );
}

// ── Metas e indicadores ───────────────────────────────────────────────────────

export function SecaoItens({ tipo, periodo, hoje, store, kicker }: {
  tipo: CicloItemTipo;
  periodo: Periodo;
  hoje: string;
  store: Store;
  kicker?: string;
}) {
  const [novo, setNovo] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const lista = (store.cicloDe(periodo)?.itens ?? []).filter(i => i.tipo === tipo);
  const bons = tipo === 'meta'
    ? lista.filter(itemAtingido).length
    : lista.filter(i => ritmoBom(ritmoDoIndicador(i, periodo, hoje))).length;

  return (
    <Card style={{ padding: '18px 22px' }}>
      <Rotulo
        kicker={kicker ?? (tipo === 'meta' ? 'o que vou cumprir' : 'o que vou medir')}
        titulo={tipo === 'meta' ? 'Metas' : 'Indicadores'}
        extra={lista.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--char-mute)', fontVariantNumeric: 'tabular-nums' }}>
            {bons}/{lista.length} {tipo === 'meta' ? 'cumpridas' : 'no ritmo'}
          </span>
        )}
      />
      {lista.length === 0 && !novo && (
        <p style={{ fontSize: 12.5, color: 'var(--char-mute)', fontStyle: 'italic', margin: '0 0 4px' }}>
          {tipo === 'meta'
            ? 'Coisas que, feitas, deixam o período ganho. Poucas — três a cinco.'
            : 'Números que mostram se o período está indo pro lado certo — ex: treinos, horas de sono, gasto.'}
        </p>
      )}
      <ListaDeItens itens={lista} periodo={periodo} hoje={hoje} store={store} editandoId={editandoId} setEditandoId={id => { setEditandoId(id); setNovo(false); }} />
      {novo ? (
        <ItemForm
          tipo={tipo}
          onCancelar={() => setNovo(false)}
          onSalvar={data => { store.adicionarItem(periodo, { ...data, feito: tipo === 'meta' ? false : undefined }); setNovo(false); }}
        />
      ) : (
        <button onClick={() => { setNovo(true); setEditandoId(null); }} style={{ ...botaoLink, marginTop: 8 }}>
          + {tipo === 'meta' ? 'nova meta' : 'novo indicador'}
        </button>
      )}
    </Card>
  );
}

/** Linhas de item com edição no lugar — usada nas seções e nos cartões de área do ano. */
export function ListaDeItens({ itens, periodo, hoje, store, editandoId, setEditandoId }: {
  itens: CicloItem[];
  periodo: Periodo;
  hoje: string;
  store: Store;
  editandoId: string | null;
  setEditandoId: (id: string | null) => void;
}) {
  return (
    <>
      {itens.map(item => editandoId === item.id ? (
        <ItemForm
          key={item.id}
          tipo={item.tipo}
          inicial={item}
          onCancelar={() => setEditandoId(null)}
          onSalvar={data => { store.editarItem(periodo, item.id, data); setEditandoId(null); }}
        />
      ) : (
        <ItemLinha
          key={item.id}
          item={item}
          ritmo={ritmoDoIndicador(item, periodo, hoje)}
          onAlternar={() => store.editarItem(periodo, item.id, { feito: !item.feito })}
          onDefinirAtual={v => store.editarItem(periodo, item.id, { atual: v })}
          onAjustar={delta => store.ajustarIndicador(periodo, item.id, delta)}
          onEditar={() => setEditandoId(item.id)}
          onRemover={() => store.removerItem(periodo, item.id)}
        />
      ))}
    </>
  );
}

// ── Olhar pra trás, redirecionar, fechar ──────────────────────────────────────

function CardAnterior({ periodo, hoje, store, abertoInicial }: { periodo: Periodo; hoje: string; store: Store; abertoInicial: boolean }) {
  const itens = store.cicloDe(periodo)?.itens ?? [];
  const anterior = periodoAnterior(periodo);
  const cicloAnterior = store.cicloDe(anterior);
  const itensAnteriores = cicloAnterior?.itens ?? [];
  const placar = placarDoCiclo(cicloAnterior);
  const jaTrazido = (i: CicloItem) => itens.some(x => x.tipo === i.tipo && x.titulo.trim().toLowerCase() === i.titulo.trim().toLowerCase());
  const pendentes = itensAnteriores.filter(i => !itemAtingido(i) && !jaTrazido(i));
  const nomeAnterior = rotuloDoPeriodo(anterior).titulo;

  return (
    <Dobra
      kicker="como foi o período anterior"
      titulo={nomeAnterior}
      abertoInicial={abertoInicial}
      extra={<>
        {placar.total > 0 && (
          <span style={{ fontSize: 12, color: 'var(--char-soft)', fontVariantNumeric: 'tabular-nums' }}>
            <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{placar.atingidos}</strong>/{placar.total}
          </span>
        )}
        {cicloAnterior?.nota && <NotaPontos nota={cicloAnterior.nota} />}
      </>}
    >
      {itensAnteriores.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
          Nada foi planejado em {nomeAnterior.toLowerCase()}.
        </p>
      ) : (
        <>
          {itensAnteriores.map(i => {
            const ok = itemAtingido(i);
            const semMedida = i.tipo === 'indicador' && i.atual === undefined;
            return (
              <div key={i.id} style={{ display: 'flex', alignItems: 'baseline', gap: 9, padding: '6px 0', borderBottom: `1px solid ${tinta(5)}` }}>
                <span style={{ width: 14, fontSize: 12, fontWeight: 700, color: ok ? 'var(--moss)' : semMedida ? 'var(--char-mute)' : 'var(--hanko)', flexShrink: 0 }}>
                  {ok ? '✓' : semMedida ? '–' : '✕'}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: ok ? 'var(--char-soft)' : 'var(--char)' }}>
                  {i.titulo}
                  {i.tipo === 'indicador' && (
                    <span style={{ fontSize: 11, color: 'var(--char-mute)' }}>
                      {' '}· {i.atual ?? 'sem medição'}{i.atual !== undefined && i.unidade ? ` ${i.unidade}` : ''} ({descreverAlvo(i)})
                    </span>
                  )}
                </span>
                {!ok && (jaTrazido(i)
                  ? <span style={{ fontSize: 10.5, color: 'var(--char-mute)', flexShrink: 0 }}>já trazido</span>
                  : <button onClick={() => store.trazerItens(periodo, [i])} style={{ fontSize: 11, color: 'var(--ink)', flexShrink: 0 }}>↻ trazer</button>)}
              </div>
            );
          })}
          {pendentes.length > 1 && (
            <button onClick={() => store.trazerItens(periodo, pendentes)} style={{ ...botaoLink, marginTop: 6 }}>
              ↻ trazer os {pendentes.length} pendentes pra cá
            </button>
          )}
        </>
      )}
      {cicloAnterior?.levar && (
        <div style={{ marginTop: 12, padding: '10px 12px', borderLeft: '2px solid var(--hanko)', background: tinta(4), borderRadius: '0 4px 4px 0' }}>
          <div style={{ ...kickerStyle, fontSize: 8.5, marginBottom: 3 }}>você disse que levaria pra cá</div>
          <div style={{ fontSize: 12.5, color: 'var(--char)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{cicloAnterior.levar}</div>
        </div>
      )}
      {cicloAnterior && !cicloAnterior.fechadoEm && hoje > anterior.fim && (
        <p style={{ fontSize: 11, color: 'var(--hanko)', margin: '10px 0 0' }}>
          Esse período ficou sem fechamento — dá pra fechar navegando pra ele (‹).
        </p>
      )}
    </Dobra>
  );
}

function CardMeio({ periodo, store, momento, resumo }: { periodo: Periodo; store: Store; momento: MomentoCiclo; resumo?: React.ReactNode }) {
  const ciclo = store.cicloDe(periodo);
  const agora = momento === 'meio';
  return (
    <Dobra
      kicker={agora ? 'agora · meio do período' : `meio · ${dataCurta(meioDoPeriodo(periodo))}`}
      titulo="Ponto de redirecionamento"
      abertoInicial={agora || !!ciclo?.meioNota}
      destaque={agora}
      extra={ciclo?.meioEm && <Etiqueta cor="var(--moss)">feito em {dataCurta(toDateStr(new Date(ciclo.meioEm)))}</Etiqueta>}
    >
      {agora && resumo && <div style={{ marginBottom: 12 }}>{resumo}</div>}
      <CampoTexto
        valor={ciclo?.meioNota}
        onSalvar={v => store.atualizar(periodo, { meioNota: v })}
        placeholder="Como está o caminho até aqui? O que muda de rota, o que corta, o que acelera?"
      />
      {!ciclo?.meioEm && (
        <button
          onClick={() => store.atualizar(periodo, { meioEm: new Date().toISOString() })}
          style={{ ...(agora ? botaoPrimario : botaoSecundario), marginTop: 10 }}
        >
          Registrar ponto do meio
        </button>
      )}
    </Dobra>
  );
}

function CardFechamento({ periodo, hoje, store, momento }: { periodo: Periodo; hoje: string; store: Store; momento: MomentoCiclo }) {
  const ciclo = store.cicloDe(periodo);
  const cfg = ESCALAS[periodo.escala];
  const { atingidos, total } = placarDoCiclo(ciclo);
  const agora = momento === 'fechar' || momento === 'em_aberto';
  const salvar = (campos: Parameters<Store['atualizar']>[1]) => store.atualizar(periodo, campos);
  const abreEm = addDays(periodo.fim, -(cfg.diasParaFechar - 1));

  return (
    <Dobra
      kicker={agora ? `agora · fim em ${dataCurta(periodo.fim)}` : `fim · ${dataCurta(periodo.fim)}`}
      titulo={`Fechamento ${periodo.escala === 'semana' ? 'da' : 'do'} ${cfg.label.toLowerCase()}`}
      abertoInicial={agora || momento === 'fechado'}
      destaque={agora}
      extra={ciclo?.fechadoEm && <SeloFechado size={26} />}
    >
      {!agora && !ciclo?.fechadoEm && hoje < abreEm && (
        <p style={{ fontSize: 12, color: 'var(--char-mute)', fontStyle: 'italic', margin: '0 0 12px' }}>
          A hora de fechar é a partir de {dataCurta(abreEm)} — mas dá pra ir anotando antes.
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 12.5, color: 'var(--char-soft)' }}>
          {total === 0 ? 'Nenhum item pra conferir.' : <><strong style={{ color: 'var(--ink)' }}>{atingidos}</strong> de {total} atingidos</>}
        </span>
        <Placar itens={ciclo?.itens ?? []} />
      </div>

      <div style={{ ...kickerStyle, fontSize: 8.5, marginBottom: 6 }}>como foi {cfg.artigo}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5].map(n => {
          const ativo = ciclo?.nota === n;
          return (
            <button
              key={n}
              onClick={() => salvar({ nota: ativo ? undefined : n })}
              style={{
                width: 30, height: 30, borderRadius: '50%', fontSize: 12.5, fontWeight: 600,
                border: `1.5px solid ${ativo ? 'var(--ink)' : tinta(20)}`,
                background: ativo ? 'var(--ink)' : 'transparent',
                color: ativo ? 'var(--washi)' : 'var(--char-soft)',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CampoTexto valor={ciclo?.funcionou} onSalvar={v => salvar({ funcionou: v })} placeholder="O que funcionou?" rows={2} />
        <CampoTexto valor={ciclo?.naoFuncionou} onSalvar={v => salvar({ naoFuncionou: v })} placeholder="O que não funcionou?" rows={2} />
        <CampoTexto valor={ciclo?.levar} onSalvar={v => salvar({ levar: v })} placeholder="O que levo pro próximo período?" rows={2} />
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        {ciclo?.fechadoEm ? (
          <>
            <span style={{ fontSize: 11.5, color: 'var(--char-mute)' }}>
              fechado em {dataCurta(toDateStr(new Date(ciclo.fechadoEm)))}
            </span>
            <button onClick={() => salvar({ fechadoEm: undefined })} style={{ ...botaoLink, color: 'var(--char-mute)', fontWeight: 400 }}>
              reabrir
            </button>
          </>
        ) : (
          <button
            onClick={() => salvar({ fechadoEm: new Date().toISOString() })}
            disabled={hoje < periodo.inicio}
            style={{ ...(agora ? botaoPrimario : botaoSecundario), opacity: hoje < periodo.inicio ? 0.4 : 1 }}
          >
            Fechar {cfg.label.toLowerCase()}
          </button>
        )}
      </div>
    </Dobra>
  );
}

/**
 * Pra mês, semestre e ano: aponta a próxima ação concreta na escala de baixo — planejar a
 * semana/mês/semestre atual (ou o seguinte) que ainda não tem linha de chegada.
 */
function CardAgoraFilho({ periodo, hoje, store, onAbrir }: { periodo: Periodo; hoje: string; store: Store; onAbrir: (p: Periodo) => void }) {
  const filha = ESCALA_FILHA[periodo.escala];
  if (!filha || hoje < periodo.inicio || hoje > periodo.fim) return null;
  const atual = periodoDe(filha, hoje);
  const seguinte = periodoSeguinte(atual);
  const temPlano = (p: Periodo) => { const c = store.cicloDe(p); return !!c && (!!c.foco?.trim() || c.itens.length > 0); };
  const nome = (p: Periodo) => rotuloDoPeriodo(p).titulo;
  const artigoFilha = filha === 'semana' ? 'a' : 'o';

  let texto: React.ReactNode;
  let acao: { rotulo: string; alvo: Periodo };
  if (!temPlano(atual)) {
    texto = <>{nome(atual)} ainda não tem linha de chegada.</>;
    acao = { rotulo: `Planejar ${nome(atual).toLowerCase()}`, alvo: atual };
  } else if (seguinte.inicio <= periodo.fim && !temPlano(seguinte) && diasRestantes(atual, hoje) <= ESCALAS[filha].diasParaFechar + 1) {
    texto = <>{nome(atual)} está acabando. Planejar {artigoFilha} seguinte agora deixa o começo livre pra agir.</>;
    acao = { rotulo: `Planejar ${nome(seguinte).toLowerCase()}`, alvo: seguinte };
  } else {
    const foco = store.cicloDe(atual)?.foco;
    texto = foco
      ? <>{nome(atual)}: <em className="serif" style={{ fontSize: 15, color: 'var(--ink)' }}>“{foco}”</em></>
      : <>{nome(atual)} já tem plano.</>;
    acao = { rotulo: `Abrir ${nome(atual).toLowerCase()}`, alvo: atual };
  }

  const restantes = diasRestantes(periodo, hoje);
  return (
    <Card style={{ padding: '18px 22px' }}>
      <Rotulo kicker="agora" titulo={restantes === 1 ? 'Último dia' : `Faltam ${restantes} dias`} />
      <p style={{ fontSize: 13, color: 'var(--char-soft)', margin: '0 0 10px', lineHeight: 1.55 }}>{texto}</p>
      <button onClick={() => onAbrir(acao.alvo)} style={botaoSecundario}>{acao.rotulo}</button>
    </Card>
  );
}

/**
 * Os cartões do tempo do ciclo, na ordem que importa agora: o que pede ação primeiro (ponto do
 * meio no meio, fechamento no fim), depois o período anterior, depois o resto, dobrado.
 */
export function CartoesDoTempo({ periodo, hoje, store, onAbrir, resumoMeio, extra }: {
  periodo: Periodo;
  hoje: string;
  store: Store;
  onAbrir: (p: Periodo) => void;
  resumoMeio?: React.ReactNode;
  extra?: React.ReactNode;   // cartão próprio da escala (ex: ritmo do semestre)
}) {
  const momento = momentoDoCiclo(periodo, store.cicloDe(periodo), hoje);
  const inicioDoPeriodo = momento === 'sem_plano' || momento === 'futuro';
  const meio = <CardMeio key="meio" periodo={periodo} store={store} momento={momento} resumo={resumoMeio} />;
  const fim = <CardFechamento key="fim" periodo={periodo} hoje={hoje} store={store} momento={momento} />;
  const anterior = <CardAnterior key="ant" periodo={periodo} hoje={hoje} store={store} abertoInicial={inicioDoPeriodo} />;
  const agoraFilho = momento === 'em_curso' || momento === 'sem_plano'
    ? <CardAgoraFilho key="filho" periodo={periodo} hoje={hoje} store={store} onAbrir={onAbrir} />
    : null;

  const ordem = momento === 'meio' ? [meio, extra, anterior, fim]
    : momento === 'fechar' || momento === 'em_aberto' || momento === 'fechado' ? [fim, extra, meio, anterior]
    : [agoraFilho, extra, anterior, meio, fim];
  return <>{ordem.map((c, i) => c && <React.Fragment key={i}>{c}</React.Fragment>)}</>;
}
