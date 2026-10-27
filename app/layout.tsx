import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Onda — Organização da Vida',
  description: 'App pessoal de organização com estética japonesa',
  // No iPhone, "Adicionar à Tela de Início" abre o app em tela cheia com esse nome.
  appleWebApp: { capable: true, title: 'Onda', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Sem zoom de pinça no celular — o Lucca dava zoom sem querer. No computador o navegador
  // ignora essas duas opções, então o zoom do teclado (Ctrl/Cmd +) continua funcionando.
  maximumScale: 1,
  userScalable: false,
  // cover: o app desenha atrás da barra de status e do indicador de início; o app de celular
  // compensa com env(safe-area-inset-*).
  viewportFit: 'cover',
  // A noite do app vem da hora (20h), não do modo escuro do celular — o app de celular troca
  // essa cor sozinho quando o tema noturno liga.
  themeColor: '#F5EFE0',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="washi-bg">{children}</body>
    </html>
  );
}
