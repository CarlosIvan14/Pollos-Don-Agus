// app/components/Header.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';

type Role = 'admin' | 'caja' | 'none';

export default function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const role: Role =
    ((session?.user as any)?.role as Role | undefined) ?? 'none';

  const isPrivileged = useMemo(
    () => role === 'admin' || role === 'caja',
    [role]
  );

  return (
    <header className="flex items-center justify-between mb-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-2xl md:text-3xl font-bold"
      >
        <Image src="/logo.png" alt="Pollos Don Agus" width={40} height={40} />
        <span>Pollos Don Agus</span>
      </Link>

      <nav className="flex items-center gap-2">
        {/* Público: botón Ordenar SI NO hay rol válido */}
        {!isPrivileged && (
          <Link className="btn" href="/orden">
            Ordenar
          </Link>
        )}

        {/* Icono usuario */}
        <div className="relative">
          <button
            className="btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Usuario"
          >
            {isPrivileged ? '👤' : '🔐'}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-neutral-900 p-2 shadow-xl z-50">
              {!isPrivileged ? (
                <>
                  {/* Invitado o rol none → ir a /login */}
                  <Link
                    href="/login"
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-3 py-2 text-sm text-zinc-400">
                    Sesión: <b>{role}</b>
                  </div>

                  {role === 'caja' && (
                    <>
                      <Link
                        className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                        href="/caja"
                        onClick={() => setMenuOpen(false)}
                      >
                        Caja
                      </Link>
                      <Link
                        className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                        href="/corte"
                        onClick={() => setMenuOpen(false)}
                      >
                        Corte de caja
                      </Link>
                    </>
                  )}

                  {role === 'admin' && (
                    <>
                      <Link
                        className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin
                      </Link>
                      <Link
                        className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                        href="/caja"
                        onClick={() => setMenuOpen(false)}
                      >
                        Caja
                      </Link>
                      <Link
                        className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                        href="/corte"
                        onClick={() => setMenuOpen(false)}
                      >
                        Corte de caja
                      </Link>
                    </>
                  )}

                  <button
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm mt-1"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: '/login' });
                    }}
                  >
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
