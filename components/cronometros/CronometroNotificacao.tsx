'use client';
import React, { useEffect, useState } from 'react';
import { CronometroPreset } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useCronometrosStore, duracaoTotalMin } from '@/lib/cronometrosStore';
import { useCronometroSessao, presetDaSessao } from '@/lib/cronometroSessaoStore';
import { useHabitsStore } from '@/lib/habitsStore';
import { useProjectsStore } from '@/lib/projectsStore';
import { useFocoStore, formatarMinutos, somaMinutos } from '@/lib/focoStore';
import { playBeep } from '@/lib/cronometroSom';
import { IcClose } from '@/components/ui/icons';

function formatarDuracao(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

interface Toast {
  preset: CronometroPreset;
  tipo: 'fase' | 'fim';
  mensagem: string;
}

interface Props {
  cronometrosStore: ReturnType<typeof useCronometrosStore>;
  sessaoStore: ReturnType<typeof useCronometroSessao>;
  habitsStore: ReturnType<typeof useHabitsStore>;
  projectsStore: ReturnType<typeof useProjectsStore>;
  focoStore: ReturnType<typeof useFocoStore>;
  onAbrirCronometros: () => void;
}

/**
 * Dono único do relógio do cronômetro: roda sempre, independente da tela ativa, avançando de
 * fase e tocando o sino no horário certo mesmo se o usuário estiver em outra página — antes
 * isso só acontecia enquanto a tela de Cronômetros estava montada. Quando o tempo estoura,
 * mostra um aviso flutuante em qualquer lugar do app.
 */
export default function CronometroNotificacao({ cronometrosStore, sessaoStore, habitsStore, projectsStore, focoStore, onAbrirCronometros }: Props) {
  const { presets } = cronometrosStore;
  const { sessao, avancarFase } = sessaoStore;
  const { completarHabito } = habitsStore;
  const { tasks, projects } = projectsStore;
  const { registrarFaseAtual, blocosDaSessao, pedirAnotacao } = focoStore;
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!sessao || sessao.pausado) return;
    const preset = presetDaSessao(sessao, presets);
    if (!preset) return;

    const tick = () => {
      const remaining = new Date(sessao.faseTerminaEm).getTime() - Date.now();
      if (remaining > 0) return;

      playBeep();
      const isLastFase = sessao.faseIndex === preset.fases.length - 1;
      // Fase de foco que acabou sozinha vira um bloco gravado (o fim é o horário previsto,
      // mesmo que o app tenha ficado fechado). Descanso não é gravado.
      const bloco = registrarFaseAtual({ sessao, preset, cheia: true, tasks, projects });
      let mensagem: string;
      if (isLastFase) {
        const anteriores = sessao.sessaoId ? blocosDaSessao(sessao.sessaoId).filter(b => b.id !== bloco?.id) : [];
        const total = somaMinutos(anteriores) + (bloco?.minutos ?? 0);
        const emQue = bloco?.taskTitulo ?? sessao.rotulo;
        mensagem = total > 0
          ? `${formatarMinutos(total)}${emQue ? ` em ${emQue}` : ' de foco'}. Clique pra anotar o que avançou.`
          : `${preset.nome} concluído — ${formatarDuracao(duracaoTotalMin(preset.fases))} de dedicação.`;
        if (preset.habitoId) {
          completarHabito(preset.habitoId);
          mensagem += ' Hábito marcado como feito.';
        }
        if (sessao.sessaoId && total > 0) pedirAnotacao(sessao.sessaoId, false);
      } else {
        mensagem = preset.fases[sessao.faseIndex].tipo === 'foco'
          ? `${preset.nome} — foco concluído, hora do descanso.`
          : `${preset.nome} — descanso concluído, hora do foco.`;
      }
      setToast({ preset, tipo: isLastFase ? 'fim' : 'fase', mensagem });
      avancarFase(preset);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [sessao, presets, avancarFase, completarHabito, registrarFaseAtual, blocosDaSessao, pedirAnotacao, tasks, projects]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!toast) return null;
  const area = AREAS.find(a => a.id === toast.preset.areaId);
  const color = area?.color ?? 'var(--ink)';

  return (
    <div
      onClick={() => { onAbrirCronometros(); setToast(null); }}
      style={{
        position: 'fixed',
        top: 14,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        maxWidth: 300,
        padding: '12px 14px',
        borderRadius: 8,
        borderLeft: `4px solid ${color}`,
        background: 'var(--ink)',
        color: 'var(--washi)',
        boxShadow: '0 12px 28px -10px rgba(20,38,74,0.45)',
        cursor: 'pointer',
      }}
    >
      <span className="jp" style={{ fontSize: 18, opacity: 0.85, lineHeight: 1 }}>了</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65, marginBottom: 3 }}>
          {toast.tipo === 'fim' ? 'Sessão concluída' : 'Tempo esgotado'}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>{toast.mensagem}</div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); setToast(null); }}
        title="fechar"
        style={{ flexShrink: 0, opacity: 0.65, padding: 2 }}
      >
        <IcClose size={13} stroke="var(--washi)" />
      </button>
    </div>
  );
}
