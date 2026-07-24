import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Onda — Organização da Vida',
  description: 'App pessoal de organização com estética japonesa',
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
