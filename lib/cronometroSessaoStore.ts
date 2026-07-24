'use client';
import { useState, useEffect, useCallback } from 'react';
import { CronometroPreset, CronometroSessao } from './types';

const STORAGE_KEY = 'onda-cronometro-sessao-v1';

/**
 * Sessão ativa de cronômetro. Guarda só o instante em que a fase atual termina (não um
 * contador que precisa de tick pra ser correto) — assim o tempo restante fica certo mesmo
 * se a aba ficar em segundo plano, o navegador atrasar o timer, ou a página for recarregada.
 */
export function useCronometroSessao() {
  const [sessao, setSessao] = useState<CronometroSessao | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setSessao(raw ? JSON.parse(raw) : null);
    } catch { setSessao(null); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (sessao) localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
    else localStorage.removeItem(STORAGE_KEY);
  }, [sessao, loaded]);

  const iniciar = useCallback((preset: CronometroPreset) => {
    const durMs = preset.fases[0].minutos * 60 * 1000;
    setSessao({
      presetId: preset.id,
      faseIndex: 0,
      faseTerminaEm: new Date(Date.now() + durMs).toISOString(),
      pausado: false,
    });
  }, []);

  const pausar = useCallback(() => {
    setSessao(prev => {
      if (!prev || prev.pausado) return prev;
      const restanteMs = Math.max(0, new Date(prev.faseTerminaEm).getTime() - Date.now());
      return { ...prev, pausado: true, pausadoRestanteMs: restanteMs };
    });
  }, []);

  const retomar = useCallback(() => {
    setSessao(prev => {
      if (!prev || !prev.pausado) return prev;
      const restanteMs = prev.pausadoRestanteMs ?? 0;
      return {
        ...prev,
        pausado: false,
        faseTerminaEm: new Date(Date.now() + restanteMs).toISOString(),
        pausadoRestanteMs: undefined,
      };
    });
  }, []);

  /** Avança pra próxima fase do preset. Se a fase atual já era a última, encerra a sessão. */
  const avancarFase = useCallback((preset: CronometroPreset) => {
    setSessao(prev => {
      if (!prev) return prev;
      const proximoIndex = prev.faseIndex + 1;
      if (proximoIndex >= preset.fases.length) return null;
      const durMs = preset.fases[proximoIndex].minutos * 60 * 1000;
      return {
        presetId: prev.presetId,
        faseIndex: proximoIndex,
        faseTerminaEm: new Date(Date.now() + durMs).toISOString(),
        pausado: false,
      };
    });
  }, []);

  const reiniciarFase = useCallback((preset: CronometroPreset) => {
    setSessao(prev => {
      if (!prev) return prev;
      const durMs = preset.fases[prev.faseIndex].minutos * 60 * 1000;
      return { ...prev, faseTerminaEm: new Date(Date.now() + durMs).toISOString(), pausado: false, pausadoRestanteMs: undefined };
    });
  }, []);

  const parar = useCallback(() => setSessao(null), []);

  return { sessao, loaded, iniciar, pausar, retomar, avancarFase, reiniciarFase, parar };
}
