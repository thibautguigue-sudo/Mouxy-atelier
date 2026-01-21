import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Atelier Nom de Liste | Muxila',
  description: 'Application collaborative pour choisir le nom de votre liste municipale',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
