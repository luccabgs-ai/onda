'use client';
import { useState, useCallback } from 'react';
import { AncoraTipo, Habito } from './types';
import { toDateStr } from './nutricao';
import { useRetryFetch } from './useRetryFetch';
import { gravar, jsonComNulos } from './gravacao';

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

/** Hábitos salvos antes do campo `ancoraTipo` existir tinham `ancoraRitual: 'manha' | 'noite' | null`. */
function migrateHabito(h: Habito & { ancoraRitual?: 'manha' | 'noite' | null }): Habito {
  if (h.ancoraTipo !== undefined) return h;
  const ancoraTipo: AncoraTipo =
    h.ancoraRitual === 'manha' ? 'ritual_manha' :
    h.ancoraRitual === 'noite' ? 'ritual_noite' :
    'nenhuma';
  const migrado: Habito & { ancoraRitual?: 'manha' | 'noite' | null } = { ...h, ancoraTipo };
  delete migrado.ancoraRitual;
  return migrado;
}

export function useHabitsStore() {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [loaded, setLoaded] = useState(false);

  const erro = useRetryFetch(async () => {
    try {
      const r = await fetch('/api/habitos');
      if (!r.ok) throw new Error('falha ao carregar hábitos');
      const data: Habito[] = await r.json();
      if (!Array.isArray(data)) throw new Error('formato inesperado');
      setHabitos(data.map(migrateHabito));
    } finally {
      setLoaded(true);
    }
  });

  const createHabito = useCallback((data: {
    identidade: string;
    areaId: string;
    acao: string;
    metaAtual: string;
    ancoraTipo: AncoraTipo;
    ancoraHabitoId?: string;
    ancoraTexto?: string;
    diasSemana: number[];
    horario?: string;
    local?: string;
  }) => {
    const h: Habito = {
      id: uid(),
      identidade: data.identidade,
      areaId: data.areaId,
      acao: data.acao,
      metaAtual: data.metaAtual,
      metaOriginal: data.metaAtual,
      ancoraTipo: data.ancoraTipo,
      ancoraHabitoId: data.ancoraTipo === 'habito' ? data.ancoraHabitoId : undefined,
      ancoraTexto: data.ancoraTipo === 'outro' ? data.ancoraTexto : undefined,
      diasSemana: data.diasSemana,
      horario: data.horario || undefined,
      local: data.local || undefined,
      votos: {},
      criadoEm: now(),
      atualizadoEm: now(),
    };
    setHabitos(prev => [...prev, h]);
    gravar('/api/habitos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos(h),
    });
  }, []);

  const updateHabito = useCallback((id: string, data: Partial<Omit<Habito, 'id' | 'votos' | 'criadoEm'>>) => {
    setHabitos(prev => prev.map(h => h.id === id ? { ...h, ...data, atualizadoEm: now() } : h));
    gravar(`/api/habitos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos(data),
    });
  }, []);

  const deleteHabito = useCallback((id: string) => {
    setHabitos(prev => prev.filter(h => h.id !== id));
    gravar(`/api/habitos/${id}`, { method: 'DELETE' });
  }, []);

  // Lê o hábito atual de `habitos` (não de dentro do updater do setState) antes de decidir o
  // novo valor — o callback de um setState pode ser chamado mais de uma vez pelo React, então
  // nenhum efeito colateral (como um fetch) pode morar ali dentro.
  const votar = useCallback((id: string, dateStr: string = toDateStr(new Date())) => {
    const alvo = habitos.find(h => h.id === id);
    if (!alvo) return;
    const jaVotou = !!alvo.votos[dateStr];
    const votos = { ...alvo.votos };
    if (jaVotou) delete votos[dateStr];
    else votos[dateStr] = true;

    setHabitos(prev => prev.map(h => h.id === id ? { ...h, votos, atualizadoEm: now() } : h));
    gravar(`/api/habitos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos({ votos }),
    });
  }, [habitos]);

  // Idempotente (diferente de votar, que alterna) — pra efeitos automáticos como o cronômetro
  // concluindo um hábito vinculado, onde rodar duas vezes não pode desmarcar o voto.
  const completarHabito = useCallback((id: string, dateStr: string = toDateStr(new Date())) => {
    const alvo = habitos.find(h => h.id === id);
    if (!alvo || alvo.votos[dateStr]) return;
    const votos = { ...alvo.votos, [dateStr]: true };

    setHabitos(prev => prev.map(h => h.id === id ? { ...h, votos, atualizadoEm: now() } : h));
    gravar(`/api/habitos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos({ votos }),
    });
  }, [habitos]);

  const aceitarEncolhimento = useCallback((id: string, novaMeta: string) => {
    setHabitos(prev => prev.map(h => h.id === id
      ? { ...h, metaAtual: novaMeta, encolhimentoDismissadoEm: undefined, atualizadoEm: now() }
      : h
    ));
    gravar(`/api/habitos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos({ metaAtual: novaMeta, encolhimentoDismissadoEm: null }),
    });
  }, []);

  const dispensarEncolhimento = useCallback((id: string, dateStr: string = toDateStr(new Date())) => {
    setHabitos(prev => prev.map(h => h.id === id
      ? { ...h, encolhimentoDismissadoEm: dateStr, atualizadoEm: now() }
      : h
    ));
    gravar(`/api/habitos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: jsonComNulos({ encolhimentoDismissadoEm: dateStr }),
    });
  }, []);

  return {
    habitos, loaded, erro,
    createHabito, updateHabito, deleteHabito,
    votar, completarHabito, aceitarEncolhimento, dispensarEncolhimento,
  };
}
