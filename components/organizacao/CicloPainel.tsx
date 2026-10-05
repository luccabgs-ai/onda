'use client';
import React, { useState } from 'react';
import { CicloItem, CicloItemTipo } from '@/lib/types';
import { useCiclosStore } from '@/lib/ciclosStore';
import {
  Periodo, ESCALAS, MomentoCiclo, periodoDe, periodoAnterior, rotuloDoPeriodo, meioDoPeriodo,
  fracaoDecorrida, diasRestantes, diasEntre, dataCurta, itemAtingido, placarDoCiclo, momentoDoCiclo, MOMENTO_LABEL,
} from '@/lib/ciclos';
import { toDateStr } from '@/lib/nutricao';
import { Card } from '@/components/ui/Card';
import { Hanko } from '@/components/ui/Hanko';
import { ItemForm, ItemLinha, descreverAlvo } from './ItemCiclo';
import { tinta, campoStyle, kickerStyle, tituloCardStyle, botaoPrimario, botaoSecundario, botaoLink } from './estilo';

type Store = ReturnType<typeof useCiclosStore>;

/** Texto livre que grava ao sair do campo — não a cada tecla. */
function CampoTexto({ valor, onSalvar, placeholder, rows = 3, destaque = false }: {
  valor?: string;
  onSalvar: (v: string | undefined) => void;
  placeholder: string;
  rows?: number;
  destaque?: boolean;
}) {
  const [rascunho, setRascunho] = useState(valor ?? '');
  return (
    <textarea
      value={rascunho}
      onChange={e => setRascunho(e.target.value)}
      onBlur={() => { const v = rascunho.trim(); if (v !== (valor ?? '')) onSalvar(v || undefined); }}
      placeholder={placeholder}
      rows={rows}
      style={{ ...campoStyle, ...(destaque ? { fontSize: 16, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' } : {}) }}
    />
  );
}

function Rotulo({ kicker, titulo, extra }: { kicker: string; titulo: string; extra?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
      <div>
        <div style={kickerStyle}>{kicker}</div>
        <h3 className="serif" style={tituloCardStyle}>{titulo}</h3>
      </div>
      {extra}
    </div>
  );
}

/** Pontinhos do placar — um por item, cheio quando atingido. */
function Placar({ itens }: { itens: CicloItem[] }) {
  if (itens.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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

// ── Linha do tempo: início, meio e linha de chegada ───────────────────────────

const CHAMADA: Record<MomentoCiclo, (artigo: string, meio: string) => string> = {
  futuro: () => 'Ainda não começou — dá pra deixar a linha de chegada pronta desde já.',
  sem_plano: artigo => `Comece pelo início: defina como quer que ${artigo} termine e o que vai medir.`,
  em_curso: (_a, meio) => `Siga o plano. O ponto de redirecionamento é em ${meio}.`,
  meio: () => 'Você passou do meio. Pare um minuto: o que precisa mudar de rota até a chegada?',
  fechar: () => 'A linha de chegada está perto. Atualize os números, revise e feche o ciclo.',
  em_aberto: () => 'Este período terminou sem fechamento. Feche pra levar o aprendizado adiante.',
  fechado: () => 'Ciclo fechado. O que ficou de aprendizado já pode guiar o próximo.',
};

function LinhaDoTempo({ periodo, momento, hoje }: { periodo: Periodo; momento: MomentoCiclo; hoje: string }) {
  const fracao = fracaoDecorrida(periodo, hoje);
  const meio = meioDoPeriodo(periodo);
  const restantes = diasRestantes(periodo, hoje);
  const dentro = hoje >= periodo.inicio && hoje <= periodo.fim;
  const alerta = momento === 'meio' || momento === 'fechar' || momento === 'em_aberto';

  const situacao = hoje < periodo.inicio
    ? (diasEntre(hoje, periodo.inicio) === 1 ? 'começa amanhã' : `começa em ${diasEntre(hoje, periodo.inicio)} dias`)
    : hoje > periodo.fim ? 'terminou'
    : restantes === 1 ? 'último dia' : `faltam ${restantes} dias`;

  const marco = (pos: number, rotulo: string, data: string, ativo: boolean) => (
    <div style={{ position: 'absolute', left: `${pos * 100}%`, top: 0, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{
        width: 11, height: 11, borderRadius: '50%', marginTop: -4,
        background: ativo ? 'var(--ink)' : 'var(--washi)',
        border: `2px solid ${ativo ? 'var(--ink)' : tinta(30)}`,
      }} />
      <span style={{ ...kickerStyle, fontSize: 8.5, marginTop: 6, color: ativo ? 'var(--ink)' : 'var(--char-mute)' }}>{rotulo}</span>
      <span style={{ fontSize: 10.5, color: 'var(--char-mute)', whiteSpace: 'nowrap' }}>{dataCurta(data)}</span>
    </div>
  );

  return (
    <Card style={{ padding: '18px 26px 20px', marginBottom: 14, borderColor: alerta ? 'var(--hanko)' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <span style={{ fontSize: 13.5, color: alerta ? 'var(--hanko)' : 'var(--char-soft)', lineHeight: 1.5 }}>
          {CHAMADA[momento](ESCALAS[periodo.escala].artigo, dataCurta(meio))}
        </span>
        <span style={{ fontSize: 11, color: 'var(--char-mute)', whiteSpace: 'nowrap' }}>
          {MOMENTO_LABEL[momento]} · {situacao}
        </span>
      </div>
      <div style={{ position: 'relative', height: 3, borderRadius: 2, background: tinta(10), margin: '0 18px 44px' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${fracao * 100}%`, background: 'var(--ink)', borderRadius: 2, opacity: 0.55 }} />
        {marco(0, 'início', periodo.inicio, fracao > 0)}
        {marco(0.5, 'meio', meio, hoje >= meio)}
        {marco(1, 'chegada', periodo.fim, hoje > periodo.fim || momento === 'fechado')}
        {dentro && (
          <span title="hoje" style={{
            position: 'absolute', left: `${fracao * 100}%`, top: -7, transform: 'translateX(-50%)',
            width: 4, height: 17, borderRadius: 2, background: 'var(--hanko)',
          }} />
        )}
      </div>
    </Card>
  );
}

// ── Painel do período ─────────────────────────────────────────────────────────

export default function CicloPainel({ periodo, hoje, store }: { periodo: Periodo; hoje: string; store: Store }) {
  const [novoTipo, setNovoTipo] = useState<CicloItemTipo | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const cfg = ESCALAS[periodo.escala];
  const ciclo = store.cicloDe(periodo);
  const itens = ciclo?.itens ?? [];
  const momento = momentoDoCiclo(periodo, ciclo, hoje);
  const { atingidos, total } = placarDoCiclo(ciclo);

  const anterior = periodoAnterior(periodo);
  const cicloAnterior = store.cicloDe(anterior);
  const itensAnteriores = cicloAnterior?.itens ?? [];
  const placarAnterior = placarDoCiclo(cicloAnterior);
  const jaTrazido = (i: CicloItem) => itens.some(x => x.tipo === i.tipo && x.titulo.trim().toLowerCase() === i.titulo.trim().toLowerCase());
  const pendentesAnteriores = itensAnteriores.filter(i => !itemAtingido(i) && !jaTrazido(i));

  const pai = cfg.pai ? periodoDe(cfg.pai, periodo.inicio) : null;
  const cicloPai = pai ? store.cicloDe(pai) : undefined;

  const salvar = (campos: Parameters<Store['atualizar']>[1]) => store.atualizar(periodo, campos);

  const secaoItens = (tipo: CicloItemTipo) => {
    const lista = itens.filter(i => i.tipo === tipo);
    return (
      <Card style={{ padding: '18px 22px', marginBottom: 14 }}>
        <Rotulo
          kicker={tipo === 'meta' ? 'o que vou cumprir' : 'o que vou medir'}
          titulo={tipo === 'meta' ? 'Metas' : 'Indicadores'}
          extra={lista.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--char-mute)' }}>
              {lista.filter(itemAtingido).length}/{lista.length} {tipo === 'meta' ? 'cumpridas' : 'no alvo'}
            </span>
          )}
        />
        {lista.length === 0 && novoTipo !== tipo && (
          <p style={{ fontSize: 12.5, color: 'var(--char-mute)', fontStyle: 'italic', margin: '0 0 4px' }}>
            {tipo === 'meta'
              ? 'Coisas que, feitas, deixam o período ganho. Poucas — três a cinco.'
              : 'Números que mostram se o período está indo pro lado certo — ex: treinos, horas de sono, gasto.'}
          </p>
        )}
        {lista.map(item => editandoId === item.id ? (
          <ItemForm
            key={item.id}
            tipo={tipo}
            inicial={item}
            onCancelar={() => setEditandoId(null)}
            onSalvar={data => { store.editarItem(periodo, item.id, data); setEditandoId(null); }}
          />
        ) : (
          <ItemLinha
            key={item.id}
            item={item}
            onAlternar={() => store.editarItem(periodo, item.id, { feito: !item.feito })}
            onDefinirAtual={v => store.editarItem(periodo, item.id, { atual: v })}
            onAjustar={delta => store.ajustarIndicador(periodo, item.id, delta)}
            onEditar={() => { setEditandoId(item.id); setNovoTipo(null); }}
            onRemover={() => store.removerItem(periodo, item.id)}
          />
        ))}
        {novoTipo === tipo ? (
          <ItemForm
            tipo={tipo}
            onCancelar={() => setNovoTipo(null)}
            onSalvar={data => { store.adicionarItem(periodo, { ...data, feito: tipo === 'meta' ? false : undefined }); setNovoTipo(null); }}
          />
        ) : (
          <button onClick={() => { setNovoTipo(tipo); setEditandoId(null); }} style={{ ...botaoLink, marginTop: 8 }}>
            + {tipo === 'meta' ? 'nova meta' : 'novo indicador'}
          </button>
        )}
      </Card>
    );
  };

  return (
    <div>
      <LinhaDoTempo periodo={periodo} momento={momento} hoje={hoje} />

      {pai && (
        <p style={{ fontSize: 12.5, color: 'var(--char-mute)', margin: '0 4px 18px', lineHeight: 1.5 }}>
          dentro de <strong style={{ fontWeight: 600, color: 'var(--char-soft)' }}>
            {rotuloDoPeriodo(pai).titulo}
          </strong>
          {cicloPai?.foco
            ? <> — <em className="serif" style={{ fontSize: 14.5, color: 'var(--ink)' }}>“{cicloPai.foco}”</em></>
            : <> — ainda sem linha de chegada definida pro {ESCALAS[pai.escala].label.toLowerCase()}.</>}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        {/* Coluna da esquerda — o plano */}
        <div>
          <Card style={{ padding: '18px 22px', marginBottom: 14 }}>
            <Rotulo kicker="início · a linha de chegada" titulo={cfg.perguntaFoco} />
            <CampoTexto
              valor={ciclo?.foco}
              onSalvar={v => salvar({ foco: v })}
              placeholder="Escreve em uma ou duas frases…"
              rows={2}
              destaque
            />
          </Card>
          {secaoItens('meta')}
          {secaoItens('indicador')}
        </div>

        {/* Coluna da direita — olhar pra trás, redirecionar, fechar */}
        <div>
          <Card style={{ padding: '18px 22px', marginBottom: 14 }}>
            <Rotulo
              kicker="como foi o período anterior"
              titulo={rotuloDoPeriodo(anterior).titulo}
              extra={placarAnterior.total > 0 && (
                <span style={{ fontSize: 12, color: 'var(--char-soft)' }}>
                  <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{placarAnterior.atingidos}</strong>/{placarAnterior.total} atingidos
                </span>
              )}
            />
            {itensAnteriores.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>
                Nada foi planejado em {rotuloDoPeriodo(anterior).titulo.toLowerCase()}.
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
                {pendentesAnteriores.length > 1 && (
                  <button onClick={() => store.trazerItens(periodo, pendentesAnteriores)} style={{ ...botaoLink, marginTop: 6 }}>
                    ↻ trazer os {pendentesAnteriores.length} pendentes pra cá
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
          </Card>

          <Card style={{ padding: '18px 22px', marginBottom: 14, borderColor: momento === 'meio' ? 'var(--hanko)' : undefined }}>
            <Rotulo
              kicker={`meio · ${dataCurta(meioDoPeriodo(periodo))}`}
              titulo="Ponto de redirecionamento"
              extra={ciclo?.meioEm && (
                <span style={{ fontSize: 11, color: 'var(--moss)' }}>feito em {dataCurta(toDateStr(new Date(ciclo.meioEm)))}</span>
              )}
            />
            <CampoTexto
              valor={ciclo?.meioNota}
              onSalvar={v => salvar({ meioNota: v })}
              placeholder="Como está o caminho até aqui? O que muda de rota, o que corta, o que acelera?"
            />
            {!ciclo?.meioEm && (
              <button
                onClick={() => salvar({ meioEm: new Date().toISOString() })}
                style={{ ...(momento === 'meio' ? botaoPrimario : botaoSecundario), marginTop: 10 }}
              >
                Registrar ponto do meio
              </button>
            )}
          </Card>

          <Card style={{
            padding: '18px 22px',
            borderColor: momento === 'fechar' || momento === 'em_aberto' ? 'var(--hanko)' : undefined,
          }}>
            <Rotulo
              kicker={`fim · ${dataCurta(periodo.fim)}`}
              titulo="Linha de chegada"
              extra={ciclo?.fechadoEm && <Hanko size={34} label="終" />}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 12.5, color: 'var(--char-soft)' }}>
                {total === 0 ? 'Nenhum item pra conferir.' : <><strong style={{ color: 'var(--ink)' }}>{atingidos}</strong> de {total} atingidos</>}
              </span>
              <Placar itens={itens} />
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
                  style={{
                    ...(momento === 'fechar' || momento === 'em_aberto' ? botaoPrimario : botaoSecundario),
                    opacity: hoje < periodo.inicio ? 0.4 : 1,
                  }}
                >
                  Fechar {cfg.label.toLowerCase()}
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
