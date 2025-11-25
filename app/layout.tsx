// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Header from './components/Header';
import AuthSessionProvider from '@/components/auth/SessionProvider';

export const metadata: Metadata = {
  title: 'Pollos Don Agus - POS & Pedidos',
  description: 'Punto de venta y pedidos a domicilio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthSessionProvider>
          <div className="bg-fire min-h-screen">
            <div className="max-w-6xl mx-auto p-4 md:p-6">
              <Header />
              {children}
            </div>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
