'use client';
import { useState, useCallback } from 'react';
import { CronometroPreset, CronometroSessao, Project, SessaoFoco, Task } from './types';
import { useRetryFetch } from './useRetryFetch';
import { gravar, jsonComNulos } from './gravacao';
import { MINIMO_MIN_BLOCO_INTERROMPIDO, minutosFeitosNaFase, montarBloco } from './foco';

// As regras e somas moram em foco.ts; reexportadas aqui pra quem já importa do store.
export * from './foco';

export function useFocoStore() {
  const [sessoes, setSessoes] = useState<SessaoFoco[]>([]);
  const [loaded, setLoaded] = useState(false);
  // A sessão que acabou e ainda espera o "o que avançou?". Só em memória — se recarregar, a
  // pergunta some, mas o tempo já está gravado.
  const [aAnotar, setAAnotar] = useState<{ sessaoId: string; encerradaCedo: boolean } | null>(null);

  const erro = useRetryFetch(async () => {
    try {
      const r = await fetch('/api/foco');
      if (!r.ok) throw new Error('falha ao carregar as sessões de foco');
      const data: SessaoFoco[] = await r.json();
      if (!Array.isArray(data)) throw new Error('formato inesperado');
      setSessoes(data);
    } finally {
      setLoaded(true);
    }
  });

  const registrar = useCallback((bloco: SessaoFoco) => {
    setSessoes(prev => [...prev.filter(s => s.id !== bloco.id), bloco]);
    gravar('/api/foco', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos(bloco),
    });
  }, []);

  /**
   * Grava a fase de foco em andamento. `cheia` = acabou sozinha (o fim é o horário previsto,
   * mesmo que o app tenha ficado fechado). Interrompida, só grava se passou de 5 min.
   * Descanso nunca é gravado. Devolve o bloco gravado, ou null.
   */
  const registrarFaseAtual = useCallback((params: {
    sessao: CronometroSessao;
    preset: CronometroPreset;
    cheia: boolean;
    tasks: Task[];
    projects: Project[];
  }): SessaoFoco | null => {
    const { sessao, preset, cheia, tasks, projects } = params;
    if (preset.fases[sessao.faseIndex]?.tipo !== 'foco') return null;
    const agora = Date.now();
    const minutos = minutosFeitosNaFase(sessao, preset, agora, cheia);
    if (!cheia && minutos < MINIMO_MIN_BLOCO_INTERROMPIDO) return null;
    const fimMs = cheia ? new Date(sessao.faseTerminaEm).getTime() : agora;
    const bloco = montarBloco({ sessao, preset, minutos, fimMs, tasks, projects });
    registrar(bloco);
    return bloco;
  }, [registrar]);

  const anotar = useCallback((id: string, nota: string | undefined) => {
    setSessoes(prev => prev.map(s => s.id === id ? { ...s, nota } : s));
    gravar(`/api/foco/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos({ nota }),
    });
  }, []);

  const apagar = useCallback((id: string) => {
    setSessoes(prev => prev.filter(s => s.id !== id));
    gravar(`/api/foco/${id}`, { method: 'DELETE' });
  }, []);

  const pedirAnotacao = useCallback((sessaoId: string, encerradaCedo: boolean) => setAAnotar({ sessaoId, encerradaCedo }), []);
  const dispensarAnotacao = useCallback(() => setAAnotar(null), []);

  /** Blocos gravados de uma sessão, na ordem. */
  const blocosDaSessao = useCallback((sessaoId: string) =>
    sessoes.filter(s => s.id.startsWith(`${sessaoId}-`)).sort((a, b) => a.inicio.localeCompare(b.inicio)), [sessoes]);

  return {
    sessoes, loaded, erro,
    registrar, registrarFaseAtual, anotar, apagar, blocosDaSessao,
    aAnotar, pedirAnotacao, dispensarAnotacao,
  };
}
