'use client';
import { useState, useCallback } from 'react';
import { Ciclo, CicloItem } from './types';
import { useRetryFetch } from './useRetryFetch';
import { gravar, jsonComNulos } from './gravacao';
import { Periodo, idDoCiclo } from './ciclos';

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

type CamposEditaveis = Partial<Omit<Ciclo, 'id' | 'escala' | 'inicio' | 'fim' | 'criadoEm' | 'atualizadoEm'>>;

export function useCiclosStore() {
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [loaded, setLoaded] = useState(false);

  const erro = useRetryFetch(async () => {
    try {
      const r = await fetch('/api/ciclos');
      if (!r.ok) throw new Error('falha ao carregar ciclos');
      const data: Ciclo[] = await r.json();
      if (!Array.isArray(data)) throw new Error('formato inesperado');
      setCiclos(data);
    } finally {
      setLoaded(true);
    }
  });

  const cicloDe = useCallback((p: Periodo) => ciclos.find(c => c.id === idDoCiclo(p)), [ciclos]);

  /**
   * Grava campos de um período, criando o ciclo se ele ainda não existe. Lê o ciclo atual de
   * `ciclos` (não de dentro do updater do setState) — o callback pode rodar mais de uma vez.
   */
  const atualizar = useCallback((p: Periodo, campos: CamposEditaveis) => {
    const id = idDoCiclo(p);
    const existente = ciclos.find(c => c.id === id);
    const ciclo: Ciclo = existente
      ? { ...existente, ...campos, atualizadoEm: now() }
      : { id, escala: p.escala, inicio: p.inicio, fim: p.fim, itens: [], ...campos, criadoEm: now(), atualizadoEm: now() };
    setCiclos(prev => [...prev.filter(c => c.id !== id), ciclo]);
    gravar(`/api/ciclos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos({ escala: p.escala, inicio: p.inicio, fim: p.fim, ...campos }),
    });
  }, [ciclos]);

  const itensDe = useCallback((p: Periodo) => ciclos.find(c => c.id === idDoCiclo(p))?.itens ?? [], [ciclos]);

  const adicionarItem = useCallback((p: Periodo, item: Omit<CicloItem, 'id'>) => {
    atualizar(p, { itens: [...itensDe(p), { ...item, id: uid() }] });
  }, [atualizar, itensDe]);

  /** Copia itens de outro período (ex: o que não foi atingido na semana passada), zerando o progresso. */
  const trazerItens = useCallback((p: Periodo, itens: CicloItem[]) => {
    const copias = itens.map(i => ({ ...i, id: uid(), feito: i.tipo === 'meta' ? false : undefined, atual: undefined }));
    atualizar(p, { itens: [...itensDe(p), ...copias] });
  }, [atualizar, itensDe]);

  const editarItem = useCallback((p: Periodo, itemId: string, data: Partial<Omit<CicloItem, 'id'>>) => {
    atualizar(p, { itens: itensDe(p).map(i => i.id === itemId ? { ...i, ...data } : i) });
  }, [atualizar, itensDe]);

  const removerItem = useCallback((p: Periodo, itemId: string) => {
    atualizar(p, { itens: itensDe(p).filter(i => i.id !== itemId) });
  }, [atualizar, itensDe]);

  const ajustarIndicador = useCallback((p: Periodo, itemId: string, delta: number) => {
    const item = itensDe(p).find(i => i.id === itemId);
    if (!item) return;
    editarItem(p, itemId, { atual: Math.max(0, (item.atual ?? 0) + delta) });
  }, [itensDe, editarItem]);

  return {
    ciclos, loaded, erro,
    cicloDe, atualizar,
    adicionarItem, trazerItens, editarItem, removerItem, ajustarIndicador,
  };
}
