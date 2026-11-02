'use client';
import { useState, useEffect, useCallback } from 'react';
import { AlvoFoco, CronometroFase, CronometroPreset, CronometroSessao } from './types';

/** id de "cronômetro" das sessões avulsas — não existe na lista de cronômetros salvos. */
export const PRESET_AVULSO = 'avulso';

/**
 * O cronômetro de uma sessão: o salvo, ou um montado na hora pra sessão avulsa (bloco de foco do
 * calendário, com a duração do bloco). Use sempre isto em vez de procurar só na lista de salvos.
 */
export function presetDaSessao(sessao: CronometroSessao, presets: CronometroPreset[]): CronometroPreset | undefined {
  if (sessao.avulso) {
    return { id: PRESET_AVULSO, nome: sessao.avulso.nome, fases: sessao.avulso.fases, criadoEm: '', atualizadoEm: '' };
  }
  return presets.find(p => p.id === sessao.presetId);
}

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

  /** Começa uma sessão. `alvo` diz no que vai focar — tarefa ou foco livre (sem alvo = foco livre). */
  const iniciar = useCallback((preset: CronometroPreset, alvo?: AlvoFoco) => {
    const durMs = preset.fases[0].minutos * 60 * 1000;
    const agora = Date.now();
    setSessao({
      presetId: preset.id,
      faseIndex: 0,
      faseTerminaEm: new Date(agora + durMs).toISOString(),
      pausado: false,
      sessaoId: crypto.randomUUID(),
      faseIniciouEm: new Date(agora).toISOString(),
      taskId: alvo && 'taskId' in alvo ? alvo.taskId : undefined,
      rotulo: alvo && 'rotulo' in alvo ? alvo.rotulo?.trim() || undefined : undefined,
      habitoId: alvo?.habitoId,
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

  /**
   * Sessão avulsa, sem cronômetro salvo: um bloco único de `minutos` (bloco do calendário) ou as
   * fases montadas na hora (sessão rápida). Termina e some — não vira cronômetro.
   */
  const iniciarAvulso = useCallback((nome: string, duracao: number | CronometroFase[], alvo?: AlvoFoco) => {
    const fases: CronometroFase[] = typeof duracao === 'number' ? [{ tipo: 'foco', minutos: duracao }] : duracao;
    const agora = Date.now();
    setSessao({
      presetId: PRESET_AVULSO,
      faseIndex: 0,
      faseTerminaEm: new Date(agora + fases[0].minutos * 60 * 1000).toISOString(),
      pausado: false,
      sessaoId: crypto.randomUUID(),
      faseIniciouEm: new Date(agora).toISOString(),
      taskId: alvo && 'taskId' in alvo ? alvo.taskId : undefined,
      rotulo: alvo && 'rotulo' in alvo ? alvo.rotulo?.trim() || undefined : undefined,
      habitoId: alvo?.habitoId,
      avulso: { nome, fases },
    });
  }, []);

  /** Avança pra próxima fase do preset. Se a fase atual já era a última, encerra a sessão. */
  const avancarFase = useCallback((preset: CronometroPreset) => {
    setSessao(prev => {
      if (!prev) return prev;
      const proximoIndex = prev.faseIndex + 1;
      if (proximoIndex >= preset.fases.length) return null;
      const durMs = preset.fases[proximoIndex].minutos * 60 * 1000;
      const agora = Date.now();
      return {
        presetId: prev.presetId,
        faseIndex: proximoIndex,
        faseTerminaEm: new Date(agora + durMs).toISOString(),
        pausado: false,
        sessaoId: prev.sessaoId,
        faseIniciouEm: new Date(agora).toISOString(),
        taskId: prev.taskId,
        rotulo: prev.rotulo,
        avulso: prev.avulso,
        habitoId: prev.habitoId,
      };
    });
  }, []);

  const reiniciarFase = useCallback((preset: CronometroPreset) => {
    setSessao(prev => {
      if (!prev) return prev;
      const durMs = preset.fases[prev.faseIndex].minutos * 60 * 1000;
      const agora = Date.now();
      // Recomeçar a fase descarta o tempo feito nela — o bloco gravado conta a partir de agora.
      return {
        ...prev,
        faseTerminaEm: new Date(agora + durMs).toISOString(),
        faseIniciouEm: new Date(agora).toISOString(),
        pausado: false,
        pausadoRestanteMs: undefined,
      };
    });
  }, []);

  const parar = useCallback(() => setSessao(null), []);

  return { sessao, loaded, iniciar, iniciarAvulso, pausar, retomar, avancarFase, reiniciarFase, parar };
}
