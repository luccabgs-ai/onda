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
import { usePrioridadesStore } from '@/lib/prioridadesStore';
import { useCronometrosStore } from '@/lib/cronometrosStore';
import { useCronometroSessao } from '@/lib/cronometroSessaoStore';
import { useObjetivosStore } from '@/lib/objetivosStore';
import { TODAY } from '@/lib/data';
import { Project } from '@/lib/types';

export default function Home() {
  const [screen, setScreen] = useState('hoje');
  const [didCheckIn] = useState(true);
  const [hour, setHour] = useState<number>(() => new Date().getHours());
  const store = useProjectsStore();
  const calendarStore = useCalendarStore();
  const habitsStore = useHabitsStore();
  const prioridadesStore = usePrioridadesStore();
  const cronometrosStore = useCronometrosStore();
  const cronometroSessao = useCronometroSessao();
  const objetivosStore = useObjetivosStore();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const erroConexao = store.erro || calendarStore.erro || habitsStore.erro
    || prioridadesStore.erro || cronometrosStore.erro || objetivosStore.erro;

  useEffect(() => {
    document.documentElement.setAttribute('data-night', hour >= 20 ? 'true' : 'false');
  }, [hour]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {erroConexao && (
        <div style={{
          position: 'fixed',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
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
            today={TODAY}
            didCheckIn={didCheckIn}
            hour={hour}
            habitsStore={habitsStore}
            projectsStore={store}
            prioridadesStore={prioridadesStore}
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
        {screen === 'ritual'      && <RitualScreen habitsStore={habitsStore} />}
        {screen === 'habitos'     && <HabitosScreen store={habitsStore} />}
        {screen === 'cronometros' && (
          <CronometrosScreen cronometrosStore={cronometrosStore} sessaoStore={cronometroSessao} />
        )}
        {screen === 'companheira' && <CompanheiraScreen />}
      </main>
    </div>
  );
}
