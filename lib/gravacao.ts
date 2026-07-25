'use client';
import { useSyncExternalStore } from 'react';

// Contador global de gravações rejeitadas, fora do React — os stores disparam
// gravações de qualquer lugar e o aviso na página raiz precisa enxergar todas.
let falhas = 0;
const listeners = new Set<() => void>();
const emitir = () => listeners.forEach(l => l());

/**
 * Dispara uma gravação (POST/PATCH/DELETE) sem bloquear a UI, mas conferindo o
 * resultado: `fetch` não rejeita em HTTP 400/500, então um `.catch` sozinho
 * deixaria o banco rejeitar a operação em silêncio enquanto a tela mostra o
 * dado como salvo. Qualquer falha (rede ou status) incrementa o contador que
 * alimenta o aviso "alteração não salva" na página raiz.
 */
export function gravar(url: string, init?: RequestInit) {
  fetch(url, init)
    .then(r => { if (!r.ok) { falhas++; emitir(); } })
    .catch(() => { falhas++; emitir(); });
}

export function limparFalhasDeGravacao() {
  falhas = 0;
  emitir();
}

export function useFalhasDeGravacao(): number {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => falhas,
    () => 0,
  );
}
