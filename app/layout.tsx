import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Boletim Orçamentário AEB',
  description: 'Painel de controle — Newsletter automática sobre LOA, LDO e PPA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
