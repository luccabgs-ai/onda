'use client';
import { useState } from 'react';
import { Project, SessaoFoco } from '@/lib/types';
import { blocosDoDia, blocosDaSemana, formatarMinutos, somaMinutos } from '@/lib/focoStore';
import { Card } from '@/components/ui/Card';
import { tinta } from '@/components/organizacao/estilo';

const hora = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Painel da tela de Cronômetros: foco de hoje bloco a bloco, e a semana por projeto. */
export default function TempoDeFoco({ sessoes, hoje, projects, destaqueId, onApagar }: {
  sessoes: SessaoFoco[];
  hoje: string;
  projects: Project[];
  destaqueId?: string;           // bloco recém-guardado, pra piscar na lista
  onApagar: (id: string) => void;
}) {
  const [apagandoId, setApagandoId] = useState<string | null>(null);
  const deHoje = blocosDoDia(sessoes, hoje);
  const daSemana = blocosDaSemana(sessoes, hoje);

  // Semana agrupada por projeto; sem projeto vira "Foco livre".
  const porProjeto = new Map<string, number>();
  for (const s of daSemana) porProjeto.set(s.projectId ?? '', (porProjeto.get(s.projectId ?? '') ?? 0) + s.minutos);
  const linhas = [...porProjeto.entries()].sort((a, b) => b[1] - a[1]);
  const maior = Math.max(1, ...linhas.map(([, m]) => m));

  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>
        tempo de foco
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0 4px' }}>
        <span className="serif" style={{ fontSize: 40, color: 'var(--ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {formatarMinutos(somaMinutos(deHoje))}
        </span>
        <span style={{ fontSize: 13, color: 'var(--char-soft)' }}>
          hoje{deHoje.length > 0 && `, em ${deHoje.length} ${deHoje.length === 1 ? 'bloco' : 'blocos'}`}
        </span>
      </div>

      {deHoje.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--char-mute)', fontStyle: 'italic', margin: '10px 0 0' }}>
          Nenhum bloco hoje ainda. Cada foco concluído aparece aqui.
        </p>
      ) : (
        <div style={{ marginTop: 10 }}>
          {[...deHoje].reverse().map(s => {
            const projeto = projects.find(p => p.id === s.projectId);
            return (
              <div
                key={s.id}
                onMouseLeave={() => setApagandoId(null)}
                style={{
                  display: 'grid', gridTemplateColumns: '42px minmax(0, 1fr) auto auto', gap: '2px 10px', alignItems: 'baseline',
                  padding: '9px 4px', borderTop: `1px solid ${tinta(7)}`, fontSize: 12.5,
                  animation: s.id === destaqueId ? 'focoNovo 2.4s ease' : undefined,
                }}
              >
                <span style={{ color: 'var(--char-mute)', fontVariantNumeric: 'tabular-nums' }}>{hora(s.inicio)}</span>
                <span style={{ minWidth: 0 }}>
                  {s.taskTitulo ?? <i>{s.rotulo ?? 'foco livre'}</i>}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--char-mute)' }}>{projeto?.title ?? (s.taskTitulo ? 'projeto apagado' : 'foco livre')}</span>
                </span>
                <span style={{ fontWeight: 600, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{formatarMinutos(s.minutos)}</span>
                {apagandoId === s.id ? (
                  <span style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                    <button onClick={() => onApagar(s.id)} style={{ color: 'var(--hanko)', fontWeight: 600 }}>apagar</button>
                    <button onClick={() => setApagandoId(null)} style={{ color: 'var(--char-mute)' }}>não</button>
                  </span>
                ) : (
                  <button onClick={() => setApagandoId(s.id)} title="apagar este bloco" aria-label="apagar este bloco" style={{ color: 'var(--char-mute)', fontSize: 14, width: 18 }}>×</button>
                )}
                {s.nota && (
                  <span className="serif" style={{ gridColumn: '2 / -1', fontStyle: 'italic', fontSize: 14, color: 'var(--char-soft)' }}>“{s.nota}”</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '20px 0 6px' }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--char-mute)' }}>esta semana, por projeto</span>
        <span style={{ fontSize: 12, color: 'var(--char-soft)', fontVariantNumeric: 'tabular-nums' }}>{formatarMinutos(somaMinutos(daSemana))}</span>
      </div>
      {linhas.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--char-mute)', fontStyle: 'italic', margin: 0 }}>Nada nesta semana ainda.</p>
      ) : linhas.map(([projectId, min]) => {
        const projeto = projects.find(p => p.id === projectId);
        return (
          <div key={projectId || 'livre'} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '3px 10px', padding: '5px 0', fontSize: 12.5 }}>
            <span>{projectId ? projeto?.title ?? 'projeto apagado' : 'Foco livre'}</span>
            <span style={{ color: 'var(--char-soft)', fontVariantNumeric: 'tabular-nums' }}>{formatarMinutos(min)}</span>
            <div style={{ gridColumn: '1 / -1', height: 5, borderRadius: 3, background: tinta(8), overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(min / maior) * 100}%`, borderRadius: 3, background: projeto?.color ?? 'var(--char-mute)' }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}
