'use client';
import { useState, useCallback } from 'react';
import { RitualRegistro, RitualTipo } from './types';
import { useRetryFetch } from './useRetryFetch';
import { gravar, jsonComNulos } from './gravacao';

const now = () => new Date().toISOString();

export function useRituaisStore() {
  const [registros, setRegistros] = useState<RitualRegistro[]>([]);
  const [loaded, setLoaded] = useState(false);

  const erro = useRetryFetch(async () => {
    try {
      const r = await fetch('/api/rituais');
      if (!r.ok) throw new Error('falha ao carregar rituais');
      const data: RitualRegistro[] = await r.json();
      if (!Array.isArray(data)) throw new Error('formato inesperado');
      setRegistros(data);
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
    vitorias?: string[];
    funcionou?: string;
    carrega?: string;
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

  return { registros, loaded, erro, salvarRitual, registroDe };
}
