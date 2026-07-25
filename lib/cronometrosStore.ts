'use client';
import { useState, useCallback } from 'react';
import { CronometroFase, CronometroPreset } from './types';
import { useRetryFetch } from './useRetryFetch';
import { gravar } from './gravacao';

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export const duracaoTotalMin = (fases: CronometroFase[]) =>
  fases.reduce((soma, f) => soma + f.minutos, 0);

const PRESETS_PRONTOS: CronometroPreset[] = [
  {
    id: 'pronto-pomodoro',
    nome: 'Pomodoro clássico',
    fases: [
      { tipo: 'foco', minutos: 25 }, { tipo: 'descanso', minutos: 5 },
      { tipo: 'foco', minutos: 25 }, { tipo: 'descanso', minutos: 5 },
      { tipo: 'foco', minutos: 25 }, { tipo: 'descanso', minutos: 5 },
      { tipo: 'foco', minutos: 25 },
    ],
    pronto: true,
    criadoEm: now(),
    atualizadoEm: now(),
  },
  {
    id: 'pronto-foco-profundo',
    nome: 'Foco profundo',
    fases: [{ tipo: 'foco', minutos: 50 }],
    pronto: true,
    criadoEm: now(),
    atualizadoEm: now(),
  },
  {
    id: 'pronto-sessao-rapida',
    nome: 'Sessão rápida',
    fases: [{ tipo: 'foco', minutos: 15 }],
    pronto: true,
    criadoEm: now(),
    atualizadoEm: now(),
  },
];

export function useCronometrosStore() {
  const [presets, setPresets] = useState<CronometroPreset[]>([]);
  const [loaded, setLoaded] = useState(false);

  const erro = useRetryFetch(async () => {
    try {
      const r = await fetch('/api/cronometros');
      if (!r.ok) throw new Error('falha ao carregar cronômetros');
      const raw: CronometroPreset[] = await r.json();
      const data = Array.isArray(raw) ? raw : [];
      // semeia só os prontos que ainda não existem — idempotente, sobrevive a uma
      // semeadura anterior interrompida no meio (em vez de checar só "tabela vazia?")
      const idsExistentes = new Set(data.map(p => p.id));
      const faltando = PRESETS_PRONTOS.filter(p => !idsExistentes.has(p.id));
      if (faltando.length > 0) {
        await Promise.all(faltando.map(p =>
          fetch('/api/cronometros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          })
        ));
        setPresets([...data, ...faltando]);
      } else {
        setPresets(data);
      }
    } catch (e) {
      setPresets(PRESETS_PRONTOS);
      throw e;
    } finally {
      setLoaded(true);
    }
  });

  const createPreset = useCallback((data: { nome: string; fases: CronometroFase[]; areaId?: string }) => {
    const p: CronometroPreset = {
      id: uid(),
      nome: data.nome,
      fases: data.fases,
      areaId: data.areaId,
      criadoEm: now(),
      atualizadoEm: now(),
    };
    setPresets(prev => [...prev, p]);
    gravar('/api/cronometros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    });
  }, []);

  const updatePreset = useCallback((id: string, data: Partial<Omit<CronometroPreset, 'id' | 'pronto' | 'criadoEm'>>) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, ...data, atualizadoEm: now() } : p));
    gravar(`/api/cronometros/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    gravar(`/api/cronometros/${id}`, { method: 'DELETE' });
  }, []);

  return { presets, loaded, erro, createPreset, updatePreset, deletePreset };
}
