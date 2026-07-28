'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import HojeScreen from '@/components/hoje/HojeScreen';
import AreasScreen from '@/components/areas/AreasScreen';
import RitualScreen from '@/components/ritual/RitualScreen';
import CompanheiraScreen from '@/components/companheira/CompanheiraScreen';
import ProjetosScreen from '@/components/projetos/ProjetosScreen';
import ProjectDetail from '@/components/projetos/ProjectDetail';
import CalendarioScreen from '@/components/calendario/CalendarioScreen';
import HabitosScreen from '@/components/habitos/HabitosScreen';
import CronometrosScreen from '@/components/cronometros/CronometrosScreen';
import CronometroNotificacao from '@/components/cronometros/CronometroNotificacao';
import ObjetivosScreen from '@/components/objetivos/ObjetivosScreen';
import { useProjectsStore } from '@/lib/projectsStore';
import { useCalendarStore } from '@/lib/calendarStore';
import { useHabitsStore } from '@/lib/habitsStore';
import { useCronometrosStore } from '@/lib/cronometrosStore';
import { useCronometroSessao } from '@/lib/cronometroSessaoStore';
import { useObjetivosStore } from '@/lib/objetivosStore';
import { useRituaisStore } from '@/lib/rituaisStore';
import { useFalhasDeGravacao, limparFalhasDeGravacao } from '@/lib/gravacao';
import { toDateStr } from '@/lib/nutricao';
import { Project } from '@/lib/types';

export default function Home() {
  const [screen, setScreen] = useState('hoje');
  const [hour, setHour] = useState<number>(() => new Date().getHours());
  const [hojeStr] = useState(() => toDateStr(new Date()));
  // Data real por extenso — o TODAY estático de lib/data.ts trazia uma data decorativa de maio.
  const [dataExtensa] = useState(() =>
    new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  );
  const store = useProjectsStore();
  const calendarStore = useCalendarStore();
  const habitsStore = useHabitsStore();
  const cronometrosStore = useCronometrosStore();
  const cronometroSessao = useCronometroSessao();
  const objetivosStore = useObjetivosStore();
  const rituaisStore = useRituaisStore();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Check-in real: existe registro do ritual da manhã de hoje?
  const didCheckIn = !!rituaisStore.registroDe(hojeStr, 'manha');

  const erroConexao = store.erro || calendarStore.erro || habitsStore.erro
    || cronometrosStore.erro || objetivosStore.erro || rituaisStore.erro;
  const falhasGravacao = useFalhasDeGravacao();

  useEffect(() => {
    document.documentElement.setAttribute('data-night', hour >= 20 ? 'true' : 'false');
  }, [hour]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {(erroConexao || falhasGravacao > 0) && (
        <div style={{
          position: 'fixed',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          {erroConexao && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 20,
              background: 'var(--ink)',
              color: 'var(--washi)',
              fontSize: 12.5,
              boxShadow: '0 8px 20px -6px rgba(20,38,74,0.4)',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--hanko)',
                animation: 'pulse 1.4s ease-in-out infinite',
              }} />
              Não consegui carregar os dados agora — tentando de novo automaticamente…
            </div>
          )}
          {falhasGravacao > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              borderRadius: 20,
              background: 'var(--hanko)',
              color: 'white',
              fontSize: 12.5,
              boxShadow: '0 8px 20px -6px rgba(162,58,46,0.45)',
            }}>
              {falhasGravacao === 1
                ? 'Uma alteração não foi salva'
                : `${falhasGravacao} alterações não foram salvas`}
              {' '}— recarregue pra ver o que ficou gravado.
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 11.5, fontWeight: 600,
                  background: 'rgba(255,255,255,0.22)', color: 'white', flexShrink: 0,
                }}
              >
                Recarregar
              </button>
              <button
                onClick={limparFalhasDeGravacao}
                title="dispensar aviso"
                style={{ fontSize: 14, lineHeight: 1, opacity: 0.75, flexShrink: 0, color: 'white' }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
      <CronometroNotificacao
        cronometrosStore={cronometrosStore}
        sessaoStore={cronometroSessao}
        onAbrirCronometros={() => setScreen('cronometros')}
      />
      <Sidebar
        active={screen}
        onChange={setScreen}
        didCheckIn={didCheckIn}
        isNight={hour >= 20}
        onToggleNight={() => setHour(h => h >= 20 ? 9 : 21)}
      />
      <main
        style={{
          flex: 1,
          height: '100vh',
          overflow: screen === 'companheira' ? 'hidden' : 'auto',
        }}
        className="washi-bg"
      >
        {screen === 'hoje'        && (
          <HojeScreen
            dataExtensa={dataExtensa}
            rituaisStore={rituaisStore}
            onIrParaRitual={() => setScreen('ritual')}
            onIrParaObjetivos={() => setScreen('objetivos')}
            hour={hour}
            habitsStore={habitsStore}
            projectsStore={store}
            objetivosStore={objetivosStore}
            calendarStore={calendarStore}
          />
        )}
        {screen === 'areas'       && (
          <AreasScreen
            habitos={habitsStore.habitos}
            projects={store.projects}
            tasks={store.tasks}
            objetivos={objetivosStore.objetivos}
            metas={objetivosStore.metas}
          />
        )}
        {screen === 'objetivos' && (
          <ObjetivosScreen objetivosStore={objetivosStore} habitsStore={habitsStore} />
        )}
        {screen === 'projetos' && !activeProject && (
          <ProjetosScreen onOpenProject={setActiveProject} store={store} />
        )}
        {screen === 'projetos' && activeProject && (
          <ProjectDetail
            project={activeProject}
            onBack={() => setActiveProject(null)}
            store={store}
          />
        )}
        {screen === 'calendario' && (
          <CalendarioScreen calendarStore={calendarStore} projectsStore={store} />
        )}
        {screen === 'ritual'      && (
          <RitualScreen habitsStore={habitsStore} rituaisStore={rituaisStore} projectsStore={store} calendarStore={calendarStore} />
        )}
        {screen === 'habitos'     && <HabitosScreen store={habitsStore} />}
        {screen === 'cronometros' && (
          <CronometrosScreen cronometrosStore={cronometrosStore} sessaoStore={cronometroSessao} />
        )}
        {screen === 'companheira' && <CompanheiraScreen />}
      </main>
    </div>
  );
}
