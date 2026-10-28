'use client';
import { useEffect, useState } from 'react';
import { useProjectsStore } from '@/lib/projectsStore';
import { useCalendarStore } from '@/lib/calendarStore';
import { useHabitsStore } from '@/lib/habitsStore';
import { useCronometrosStore } from '@/lib/cronometrosStore';
import { useCronometroSessao, presetDaSessao } from '@/lib/cronometroSessaoStore';
import { useObjetivosStore } from '@/lib/objetivosStore';
import { useRituaisStore } from '@/lib/rituaisStore';
import { useCiclosStore } from '@/lib/ciclosStore';
import HojeCelular from './HojeCelular';
import FocoCelular from './FocoCelular';
import ProjetosCelular from './ProjetosCelular';
import RumoCelular from './RumoCelular';

export type AbaCelular = 'hoje' | 'foco' | 'projetos' | 'rumo';

const ABAS: { id: AbaCelular; rotulo: string; kanji: string }[] = [
  { id: 'hoje', rotulo: 'Hoje', kanji: '今' },
  { id: 'foco', rotulo: 'Foco', kanji: '集' },
  { id: 'projetos', rotulo: 'Projetos', kanji: '企' },
  { id: 'rumo', rotulo: 'Rumo', kanji: '道' },
];

interface Props {
  aba: AbaCelular;
  onAba: (aba: AbaCelular) => void;
  hour: number;
  projectsStore: ReturnType<typeof useProjectsStore>;
  calendarStore: ReturnType<typeof useCalendarStore>;
  habitsStore: ReturnType<typeof useHabitsStore>;
  cronometrosStore: ReturnType<typeof useCronometrosStore>;
  sessaoStore: ReturnType<typeof useCronometroSessao>;
  objetivosStore: ReturnType<typeof useObjetivosStore>;
  rituaisStore: ReturnType<typeof useRituaisStore>;
  ciclosStore: ReturnType<typeof useCiclosStore>;
}

/** Faixa fina acima da barra de abas enquanto um cronômetro roda — um toque volta pro Foco. */
function FaixaCronometro({ sessaoStore, cronometrosStore, onAbrir }: Pick<Props, 'sessaoStore' | 'cronometrosStore'> & { onAbrir: () => void }) {
  const { sessao } = sessaoStore;
  const [restante, setRestante] = useState('');
  useEffect(() => {
    const tick = () => {
      if (!sessao) return;
      const ms = sessao.pausado ? sessao.pausadoRestanteMs ?? 0 : new Date(sessao.faseTerminaEm).getTime() - Date.now();
      const s = Math.max(0, Math.ceil(ms / 1000));
      setRestante(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessao]);

  const preset = sessao ? presetDaSessao(sessao, cronometrosStore.presets) : undefined;
  if (!sessao || !preset) return null;
  const fase = preset.fases[sessao.faseIndex];
  return (
    <button onClick={onAbrir} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px max(18px, env(safe-area-inset-left))',
      background: 'var(--ink)', color: 'var(--washi)', fontSize: 13, textAlign: 'left',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: 'var(--hanko)', flexShrink: 0,
        animation: sessao.pausado ? 'none' : 'pulse 1.4s ease-in-out infinite',
      }} />
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {preset.nome} · {fase?.tipo === 'descanso' ? 'descanso' : 'foco'}{sessao.pausado ? ' · pausado' : ''}
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{restante}</span>
    </button>
  );
}

export default function AppCelular(props: Props) {
  const { aba, onAba, hour } = props;

  // A barra de status do celular acompanha o tema da noite do app (que liga às 20h).
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', hour >= 20 ? '#1A1208' : '#F5EFE0');
  }, [hour]);

  // Reforço contra o zoom de pinça: o Safari do iPhone às vezes ignora o viewport e o
  // touch-action, mas respeita cancelar o próprio evento de gesto (só existe no Safari).
  useEffect(() => {
    const bloquear = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', bloquear);
    return () => document.removeEventListener('gesturestart', bloquear);
  }, []);

  // Trocar de aba volta pro topo — cada aba tem a própria rolagem.
  const [rolagem, setRolagem] = useState<HTMLElement | null>(null);
  const trocar = (nova: AbaCelular) => {
    if (nova === aba) rolagem?.scrollTo({ top: 0, behavior: 'smooth' });
    else { onAba(nova); rolagem?.scrollTo({ top: 0 }); }
  };

  return (
    <div className="washi-bg" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <main
        ref={setRolagem}
        style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
          paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
          paddingBottom: 28,
          paddingLeft: 'max(18px, env(safe-area-inset-left))',
          paddingRight: 'max(18px, env(safe-area-inset-right))',
        }}
      >
        {aba === 'hoje' && (
          <HojeCelular
            hour={hour}
            habitsStore={props.habitsStore}
            projectsStore={props.projectsStore}
            calendarStore={props.calendarStore}
            rituaisStore={props.rituaisStore}
          />
        )}
        {aba === 'foco' && (
          <FocoCelular cronometrosStore={props.cronometrosStore} sessaoStore={props.sessaoStore} habitsStore={props.habitsStore} />
        )}
        {aba === 'projetos' && <ProjetosCelular store={props.projectsStore} />}
        {aba === 'rumo' && (
          <RumoCelular objetivosStore={props.objetivosStore} habitsStore={props.habitsStore} ciclosStore={props.ciclosStore} />
        )}
      </main>

      {aba !== 'foco' && (
        <FaixaCronometro sessaoStore={props.sessaoStore} cronometrosStore={props.cronometrosStore} onAbrir={() => trocar('foco')} />
      )}

      <nav
        aria-label="abas"
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', flexShrink: 0,
          paddingTop: 6, paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)',
          paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)',
          borderTop: '1px solid var(--card-border)',
          background: 'color-mix(in srgb, var(--washi) 92%, transparent)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {ABAS.map(a => {
          const ativa = a.id === aba;
          return (
            <button
              key={a.id}
              onClick={() => trocar(a.id)}
              aria-current={ativa ? 'page' : undefined}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minHeight: 48, justifyContent: 'center',
                color: ativa ? 'var(--ink)' : 'var(--char-mute)',
              }}
            >
              <span className="jp" style={{ fontSize: 18, lineHeight: 1.2, color: ativa ? 'var(--hanko)' : 'inherit' }}>{a.kanji}</span>
              <span style={{ fontSize: 10.5, fontWeight: ativa ? 600 : 500 }}>{a.rotulo}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
