'use client';
import React, { useEffect, useState } from 'react';
import { CronometroPreset } from '@/lib/types';
import { AREAS } from '@/lib/data';
import { useCronometrosStore, duracaoTotalMin } from '@/lib/cronometrosStore';
import { useCronometroSessao } from '@/lib/cronometroSessaoStore';
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
  onAbrirCronometros: () => void;
}

/**
 * Dono único do relógio do cronômetro: roda sempre, independente da tela ativa, avançando de
 * fase e tocando o sino no horário certo mesmo se o usuário estiver em outra página — antes
 * isso só acontecia enquanto a tela de Cronômetros estava montada. Quando o tempo estoura,
 * mostra um aviso flutuante em qualquer lugar do app.
 */
export default function CronometroNotificacao({ cronometrosStore, sessaoStore, onAbrirCronometros }: Props) {
  const { presets } = cronometrosStore;
  const { sessao, avancarFase } = sessaoStore;
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!sessao || sessao.pausado) return;
    const preset = presets.find(p => p.id === sessao.presetId);
    if (!preset) return;

    const tick = () => {
      const remaining = new Date(sessao.faseTerminaEm).getTime() - Date.now();
      if (remaining > 0) return;

      playBeep();
      const isLastFase = sessao.faseIndex === preset.fases.length - 1;
      const mensagem = isLastFase
        ? `${preset.nome} concluído — ${formatarDuracao(duracaoTotalMin(preset.fases))} de dedicação.`
        : preset.fases[sessao.faseIndex].tipo === 'foco'
          ? `${preset.nome} — foco concluído, hora do descanso.`
          : `${preset.nome} — descanso concluído, hora do foco.`;
      setToast({ preset, tipo: isLastFase ? 'fim' : 'fase', mensagem });
      avancarFase(preset);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [sessao, presets, avancarFase]);

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
