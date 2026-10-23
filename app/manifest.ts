import type { MetadataRoute } from 'next';

// Faz o Onda virar app na tela inicial do celular: abre em tela cheia, com o selo como ícone.
// Os arquivos citados aqui (ícones, sw.js) precisam estar liberados no matcher do proxy.ts —
// o navegador busca o manifest sem o cookie de login.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Onda',
    short_name: 'Onda',
    description: 'Organização da vida do Lucca',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F5EFE0',
    theme_color: '#F5EFE0',
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
