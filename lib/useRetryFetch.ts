'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Dispara `carregar` no mount e, se ela falhar (rede instável, blip transitório do Supabase
 * etc.), tenta de novo automaticamente com backoff (3s, 6s, 12s... até 30s) em vez de deixar
 * o estado vazio parado pra sempre. Foi assim que os cards de um projeto sumiram da tela numa
 * vez em que os dados nunca saíram do banco — só a primeira tentativa de conexão falhou.
 */
export function useRetryFetch(carregar: () => Promise<void>) {
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const carregarRef = useRef(carregar);

  useEffect(() => {
    carregarRef.current = carregar;
  });

  useEffect(() => {
    let cancelado = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    carregarRef.current()
      .then(() => { if (!cancelado) setErro(false); })
      .catch(() => {
        if (cancelado) return;
        setErro(true);
        const espera = Math.min(3000 * 2 ** tentativa, 30000);
        timeoutId = setTimeout(() => { if (!cancelado) setTentativa(t => t + 1); }, espera);
      });

    return () => {
      cancelado = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [tentativa]);

  return erro;
}
