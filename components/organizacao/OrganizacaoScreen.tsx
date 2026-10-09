'use client';
import { useState } from 'react';
import { CicloEscala } from '@/lib/types';
import { useCiclosStore } from '@/lib/ciclosStore';
import { useHabitsStore } from '@/lib/habitsStore';
import { useCalendarStore } from '@/lib/calendarStore';
import { useRituaisStore } from '@/lib/rituaisStore';
import { useProjectsStore } from '@/lib/projectsStore';
import {
  Periodo, ESCALAS, ORDEM_ESCALAS, periodoDe, idDoCiclo,
  rotuloDoPeriodo, fracaoDecorrida, placarDoCiclo, momentoDoCiclo, MOMENTO_LABEL, hojeStr,
} from '@/lib/ciclos';
import { Card } from '@/components/ui/Card';
import SemanaTela from './SemanaTela';
import MesTela from './MesTela';
import SemestreTela from './SemestreTela';
import AnoTela from './AnoTela';
import { TelaProps } from './partes';
import { tinta, kickerStyle } from './estilo';

interface Props {
  ciclosStore: ReturnType<typeof useCiclosStore>;
  habitsStore: ReturnType<typeof useHabitsStore>;
  calendarStore: ReturnType<typeof useCalendarStore>;
  rituaisStore: ReturnType<typeof useRituaisStore>;
  projectsStore: ReturnType<typeof useProjectsStore>;
}

const periodosAtuais = (hoje: string) =>
  Object.fromEntries(ORDEM_ESCALAS.map(e => [e, periodoDe(e, hoje)])) as Record<CicloEscala, Periodo>;

export default function OrganizacaoScreen({ ciclosStore, habitsStore, calendarStore, rituaisStore, projectsStore }: Props) {
  const [hoje] = useState(hojeStr);
  const [escala, setEscala] = useState<CicloEscala>('semana');
  // Período aberto em cada escala — começa no atual; as setas andam pra trás e pra frente.
  const [abertos, setAbertos] = useState(() => periodosAtuais(hoje));

  const atuais = periodosAtuais(hoje);
  const periodo = abertos[escala];
  const ehAtual = periodo.inicio === atuais[escala].inicio;

  const navegar = (p: Periodo) => setAbertos(a => ({ ...a, [escala]: p }));
  /** Pula pra outra escala já no período pedido — ex: clicar numa semana dentro do mês. */
  const abrir = (p: Periodo) => {
    setAbertos(a => ({ ...a, [p.escala]: p }));
    setEscala(p.escala);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tela: TelaProps = {
    periodo, hoje, store: ciclosStore, ehAtual,
    onNavegar: navegar,
    onVoltarAtual: () => navegar(atuais[escala]),
    onAbrir: abrir,
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

      {!ciclosStore.loaded ? (
        <p style={{ fontSize: 13, color: 'var(--char-mute)', fontStyle: 'italic' }}>carregando…</p>
      ) : (
        // A key remonta a tela ao trocar de período (os rascunhos dos campos recomeçam do
        // valor salvo) e também quando uma recarga depois de erro traz os dados de verdade.
        <div key={`${idDoCiclo(periodo)}-${ciclosStore.erro}`}>
          {escala === 'semana' && (
            <SemanaTela
              {...tela}
              habitos={habitsStore.habitos}
              tasks={projectsStore.tasks}
              eventosDoDia={calendarStore.getEventsForDate}
              registroDe={rituaisStore.registroDe}
            />
          )}
          {escala === 'mes' && <MesTela {...tela} habitos={habitsStore.habitos} eventosDoDia={calendarStore.getEventsForDate} />}
          {escala === 'semestre' && <SemestreTela {...tela} />}
          {escala === 'ano' && <AnoTela {...tela} />}
        </div>
      )}
    </div>
  );
}
