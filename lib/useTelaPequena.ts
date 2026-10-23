'use client';
import { useSyncExternalStore } from 'react';

/** Mesma largura em que o celular vira um app de abas — abaixo disso o layout de PC não cabe. */
const CONSULTA = '(max-width: 768px)';

/**
 * true em tela de celular. No servidor (e no primeiro render antes de hidratar) responde false,
 * então o PC nunca pisca a versão de celular; o celular troca logo depois de hidratar.
 */
export function useTelaPequena(): boolean {
  return useSyncExternalStore(
    avisar => {
      const m = window.matchMedia(CONSULTA);
      m.addEventListener('change', avisar);
      return () => m.removeEventListener('change', avisar);
    },
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  );
}
