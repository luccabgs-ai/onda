'use client';
import { useState, useCallback } from 'react';
import { PrioridadeManual } from './types';
import { useRetryFetch } from './useRetryFetch';
import { gravar, jsonComNulos } from './gravacao';

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export function usePrioridadesStore() {
  const [manuais, setManuais] = useState<PrioridadeManual[]>([]);
  const [loaded, setLoaded] = useState(false);

  const erro = useRetryFetch(async () => {
    try {
      const r = await fetch('/api/prioridades');
      if (!r.ok) throw new Error('falha ao carregar prioridades');
      const data: PrioridadeManual[] = await r.json();
      if (!Array.isArray(data)) throw new Error('formato inesperado');
      setManuais(data);
    } finally {
      setLoaded(true);
    }
  });

  const addManual = useCallback((data: { text: string; areaId?: string; data: string }) => {
    const p: PrioridadeManual = {
      id: uid(),
      text: data.text,
      areaId: data.areaId,
      done: false,
      data: data.data,
      createdAt: now(),
    };
    setManuais(prev => [...prev, p]);
    gravar('/api/prioridades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos(p),
    });
  }, []);

  // Lê o valor atual de `manuais` (não de dentro do updater do setState) antes de decidir o
  // novo valor — o callback de um setState pode ser chamado mais de uma vez pelo React, então
  // nenhum efeito colateral (como um fetch) pode morar ali dentro.
  const toggleManual = useCallback((id: string) => {
    const atual = manuais.find(p => p.id === id);
    if (!atual) return;
    const done = !atual.done;
    setManuais(prev => prev.map(p => p.id === id ? { ...p, done } : p));
    gravar(`/api/prioridades/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos({ done }),
    });
  }, [manuais]);

  const updateManual = useCallback((id: string, data: Partial<Pick<PrioridadeManual, 'text' | 'areaId'>>) => {
    setManuais(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    gravar(`/api/prioridades/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos(data),
    });
  }, []);

  const removeManual = useCallback((id: string) => {
    setManuais(prev => prev.filter(p => p.id !== id));
    gravar(`/api/prioridades/${id}`, { method: 'DELETE' });
  }, []);

  return { manuais, loaded, erro, addManual, toggleManual, updateManual, removeManual };
}
