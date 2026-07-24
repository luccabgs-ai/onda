'use client';
import { useState, useCallback } from 'react';
import { Meta, MetaRastreio, Objetivo, ObjetivoStatus } from './types';
import { useRetryFetch } from './useRetryFetch';

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

interface StoreState {
  objetivos: Objetivo[];
  metas: Meta[];
}

const patchMeta = (id: string, data: Record<string, unknown>) => {
  fetch(`/api/metas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
};

export function useObjetivosStore() {
  const [state, setState] = useState<StoreState>({ objetivos: [], metas: [] });
  const [loaded, setLoaded] = useState(false);

  const erro = useRetryFetch(async () => {
    try {
      const r = await fetch('/api/objetivos');
      if (!r.ok) throw new Error('falha ao carregar objetivos');
      const data: StoreState = await r.json();
      const valido = data && Array.isArray(data.objetivos) && Array.isArray(data.metas);
      if (!valido) throw new Error('formato inesperado');
      setState(data);
    } finally {
      setLoaded(true);
    }
  });

  const createObjetivo = useCallback((data: { titulo: string; descricao?: string; areaId?: string; habitoIds: string[] }) => {
    const o: Objetivo = {
      id: uid(),
      titulo: data.titulo,
      descricao: data.descricao,
      areaId: data.areaId,
      habitoIds: data.habitoIds,
      status: 'ativo',
      criadoEm: now(),
      atualizadoEm: now(),
    };
    setState(s => ({ ...s, objetivos: [...s.objetivos, o] }));
    fetch('/api/objetivos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(o),
    }).catch(() => {});
  }, []);

  const updateObjetivo = useCallback((id: string, data: Partial<Omit<Objetivo, 'id' | 'criadoEm'>>) => {
    setState(s => ({ ...s, objetivos: s.objetivos.map(o => o.id === id ? { ...o, ...data, atualizadoEm: now() } : o) }));
    fetch(`/api/objetivos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  }, []);

  const setObjetivoStatus = useCallback((id: string, status: ObjetivoStatus) => {
    setState(s => ({ ...s, objetivos: s.objetivos.map(o => o.id === id ? { ...o, status, atualizadoEm: now() } : o) }));
    fetch(`/api/objetivos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  }, []);

  const deleteObjetivo = useCallback((id: string) => {
    setState(s => ({
      objetivos: s.objetivos.filter(o => o.id !== id),
      metas: s.metas.filter(m => m.objetivoId !== id),
    }));
    // apaga o objetivo — as metas somem juntas por causa do ON DELETE CASCADE no banco
    fetch(`/api/objetivos/${id}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const createMeta = useCallback((objetivoId: string, data: {
    titulo: string;
    unidade?: string;
    valorAlvo: number;
    rastreio: MetaRastreio;
    habitoId?: string;
    valorManual?: number;
    prazo?: string;
  }) => {
    const m: Meta = {
      id: uid(),
      objetivoId,
      titulo: data.titulo,
      unidade: data.unidade,
      valorAlvo: data.valorAlvo,
      rastreio: data.rastreio,
      habitoId: data.rastreio === 'habito' ? data.habitoId : undefined,
      valorManual: data.rastreio === 'manual' ? (data.valorManual ?? 0) : undefined,
      prazo: data.prazo,
      criadoEm: now(),
      atualizadoEm: now(),
    };
    setState(s => ({ ...s, metas: [...s.metas, m] }));
    fetch('/api/metas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m),
    }).catch(() => {});
  }, []);

  const updateMeta = useCallback((id: string, data: Partial<Omit<Meta, 'id' | 'objetivoId' | 'criadoEm'>>) => {
    setState(s => ({ ...s, metas: s.metas.map(m => m.id === id ? { ...m, ...data, atualizadoEm: now() } : m) }));
    patchMeta(id, data);
  }, []);

  const deleteMeta = useCallback((id: string) => {
    setState(s => ({ ...s, metas: s.metas.filter(m => m.id !== id) }));
    fetch(`/api/metas/${id}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  // Lê o valor manual atual de `state.metas` (não de dentro do updater do setState) antes de
  // aplicar o delta — o callback de um setState pode ser chamado mais de uma vez pelo React.
  const ajustarValorManual = useCallback((id: string, delta: number) => {
    const meta = state.metas.find(m => m.id === id);
    if (!meta) return;
    const valorManual = Math.max(0, (meta.valorManual ?? 0) + delta);
    setState(s => ({ ...s, metas: s.metas.map(m => m.id === id ? { ...m, valorManual, atualizadoEm: now() } : m) }));
    patchMeta(id, { valorManual });
  }, [state.metas]);

  const getMetasByObjetivo = useCallback((objetivoId: string) => {
    return state.metas.filter(m => m.objetivoId === objetivoId);
  }, [state.metas]);

  return {
    objetivos: state.objetivos,
    metas: state.metas,
    loaded,
    erro,
    createObjetivo, updateObjetivo, setObjetivoStatus, deleteObjetivo,
    createMeta, updateMeta, deleteMeta, ajustarValorManual,
    getMetasByObjetivo,
  };
}
