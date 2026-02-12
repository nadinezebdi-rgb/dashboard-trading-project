import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'Trading AI Platform - Assistant IA pour Traders',
  description: 'Plateforme IA pour traders avec assistant intelligent, journal de trading, et coaching personnalisé',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <AuthProvider>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#18181B',
                border: '1px solid #27272A',
                color: '#FAFAFA',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
