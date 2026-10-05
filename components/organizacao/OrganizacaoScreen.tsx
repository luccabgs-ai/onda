'use client';
import React, { useState } from 'react';
import { CicloEscala } from '@/lib/types';
import { useCiclosStore } from '@/lib/ciclosStore';
import {
  Periodo, ESCALAS, ORDEM_ESCALAS, periodoDe, periodoAnterior, periodoSeguinte, idDoCiclo,
  rotuloDoPeriodo, fracaoDecorrida, placarDoCiclo, momentoDoCiclo, MOMENTO_LABEL, hojeStr,
} from '@/lib/ciclos';
import { Card } from '@/components/ui/Card';
import CicloPainel from './CicloPainel';
import { tinta, kickerStyle } from './estilo';

interface Props {
  ciclosStore: ReturnType<typeof useCiclosStore>;
}

const periodosAtuais = (hoje: string) =>
  Object.fromEntries(ORDEM_ESCALAS.map(e => [e, periodoDe(e, hoje)])) as Record<CicloEscala, Periodo>;

export default function OrganizacaoScreen({ ciclosStore }: Props) {
  const [hoje] = useState(hojeStr);
  const [escala, setEscala] = useState<CicloEscala>('semana');
  // Período aberto em cada escala — começa no atual; as setas andam pra trás e pra frente.
  const [abertos, setAbertos] = useState(() => periodosAtuais(hoje));

  const atuais = periodosAtuais(hoje);
  const periodo = abertos[escala];
  const ehAtual = periodo.inicio === atuais[escala].inicio;
  const rotulo = rotuloDoPeriodo(periodo);

  const navegar = (p: Periodo) => setAbertos(a => ({ ...a, [escala]: p }));

  const seta: React.CSSProperties = {
    width: 32, height: 32, borderRadius: '50%', border: `1px solid ${tinta(18)}`,
    color: 'var(--ink)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  return (
    <div style={{ padding: '40px 56px 80px', maxWidth: 1080, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ ...kickerStyle, fontSize: 10, marginBottom: 6 }}>
          início, meio e fim — uma linha de chegada de cada vez
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h1 className="serif" style={{ fontSize: 40, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>Organização</h1>
          <span className="jp" style={{ fontSize: 22, color: 'var(--char-mute)', fontWeight: 400 }}>節目</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--char-soft)', maxWidth: 600, marginTop: 12, lineHeight: 1.65 }}>
          Cada período tem começo, meio e fim. No <em>início</em> você define a linha de chegada,
          as metas e os indicadores; no <em>meio</em> para e redireciona; no <em>fim</em> confere
          o que atingiu e leva o aprendizado pro próximo.
        </p>
      </div>

      {/* As quatro escalas — sempre mostrando o período corrente de cada uma */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 26 }}>
        {ORDEM_ESCALAS.map(e => {
          const p = atuais[e];
          const c = ciclosStore.cicloDe(p);
          const momento = momentoDoCiclo(p, c, hoje);
          const { atingidos, total } = placarDoCiclo(c);
          const ativo = e === escala;
          const alerta = momento === 'meio' || momento === 'fechar' || momento === 'sem_plano';
          return (
            <Card
              key={e}
              onClick={() => setEscala(e)}
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                borderColor: ativo ? 'var(--ink)' : undefined,
                boxShadow: ativo ? `0 0 0 1px var(--ink)` : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: ativo ? 'var(--ink)' : 'var(--char)' }}>{ESCALAS[e].label}</span>
                <span className="jp" style={{ fontSize: 13, color: 'var(--char-mute)' }}>{ESCALAS[e].jp}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--char-mute)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rotuloDoPeriodo(p).titulo} · {rotuloDoPeriodo(p).sub}
              </div>
              <div style={{ height: 3, borderRadius: 2, background: tinta(10), margin: '10px 0 8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${fracaoDecorrida(p, hoje) * 100}%`, background: 'var(--ink)', opacity: 0.55 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 10.5 }}>
                <span style={{ color: alerta ? 'var(--hanko)' : momento === 'fechado' ? 'var(--moss)' : 'var(--char-mute)' }}>
                  {MOMENTO_LABEL[momento]}
                </span>
                {total > 0 && <span style={{ color: 'var(--char-soft)' }}>{atingidos}/{total}</span>}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Navegação entre períodos da escala escolhida */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <button onClick={() => navegar(periodoAnterior(periodo))} style={seta} title="período anterior">‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <h2 className="serif" style={{ fontSize: 28, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>{rotulo.titulo}</h2>
            <span style={{ fontSize: 13, color: 'var(--char-mute)' }}>{rotulo.sub}</span>
            {!ehAtual && (
              <button onClick={() => navegar(atuais[escala])} style={{ fontSize: 11.5, color: 'var(--ink)', textDecoration: 'underline' }}>
                voltar pro atual
              </button>
            )}
          </div>
        </div>
        <button onClick={() => navegar(periodoSeguinte(periodo))} style={seta} title="próximo período">›</button>
      </div>

      {!ciclosStore.loaded ? (
        <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic' }}>carregando…</p>
      ) : (
        // A key remonta o painel ao trocar de período (os rascunhos dos campos recomeçam do
        // valor salvo) e também quando uma recarga depois de erro traz os dados de verdade.
        <CicloPainel
          key={`${idDoCiclo(periodo)}-${ciclosStore.erro}`}
          periodo={periodo}
          hoje={hoje}
          store={ciclosStore}
        />
      )}
    </div>
  );
}
