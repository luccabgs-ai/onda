'use client';
import { useState, useCallback } from 'react';
import { RitualRegistro, RitualTipo, PrioridadeRitual } from './types';
import { useRetryFetch } from './useRetryFetch';
import { gravar, jsonComNulos } from './gravacao';

const now = () => new Date().toISOString();

/** Registros antigos guardavam `vitorias` como string[] simples — vira 3 slots manuais. */
function normalizarVitorias(vitorias: unknown): PrioridadeRitual[] | undefined {
  if (!Array.isArray(vitorias)) return undefined;
  return vitorias.map((v): PrioridadeRitual =>
    typeof v === 'string' ? { origem: 'manual', texto: v, done: false } : v as PrioridadeRitual
  );
}

export function useRituaisStore() {
  const [registros, setRegistros] = useState<RitualRegistro[]>([]);
  const [loaded, setLoaded] = useState(false);

  const erro = useRetryFetch(async () => {
    try {
      const r = await fetch('/api/rituais');
      if (!r.ok) throw new Error('falha ao carregar rituais');
      const data: RitualRegistro[] = await r.json();
      if (!Array.isArray(data)) throw new Error('formato inesperado');
      setRegistros(data.map(reg => ({ ...reg, vitorias: normalizarVitorias(reg.vitorias) })));
    } finally {
      setLoaded(true);
    }
  });

  // Lê o registro existente de `registros` (não de dentro do updater do setState) antes de
  // decidir o novo valor — o callback de um setState pode ser chamado mais de uma vez pelo React.
  const salvarRitual = useCallback((dados: {
    data: string;
    tipo: RitualTipo;
    energia: number;
    intencao?: string;
    vitorias?: PrioridadeRitual[];
    funcionou?: string;
    carrega?: string;
    levar?: PrioridadeRitual[];
  }) => {
    const id = `${dados.data}-${dados.tipo}`;
    const existente = registros.find(r => r.id === id);
    const registro: RitualRegistro = {
      id,
      data: dados.data,
      tipo: dados.tipo,
      energia: dados.energia,
      intencao: dados.intencao,
      vitorias: dados.vitorias,
      funcionou: dados.funcionou,
      carrega: dados.carrega,
      levar: dados.levar,
      criadoEm: existente?.criadoEm ?? now(),
      atualizadoEm: now(),
    };
    setRegistros(prev => [...prev.filter(r => r.id !== id), registro]);
    gravar('/api/rituais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos(registro),
    });
  }, [registros]);

  const registroDe = useCallback((data: string, tipo: RitualTipo) => {
    return registros.find(r => r.data === data && r.tipo === tipo);
  }, [registros]);

  /**
   * Atualiza só as 3 prioridades do ritual da manhã de um dia — usado pela tela Hoje pra
   * editar/trocar um dos slots ao longo do dia, sem precisar refazer o ritual inteiro.
   * Não faz nada se aquele dia ainda não tem check-in matinal (nada pra atualizar).
   */
  const atualizarVitorias = useCallback((data: string, vitorias: PrioridadeRitual[]) => {
    const id = `${data}-manha`;
    const existente = registros.find(r => r.id === id);
    if (!existente) return;
    const registro: RitualRegistro = { ...existente, vitorias, atualizadoEm: now() };
    setRegistros(prev => prev.map(r => r.id === id ? registro : r));
    gravar(`/api/rituais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos(registro),
    });
  }, [registros]);

  return { registros, loaded, erro, salvarRitual, registroDe, atualizarVitorias };
}
