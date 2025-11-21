'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Session = { role: 'admin' | 'caja' } | null

export default function Header() {
  const [session, setSession] = useState<Session>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // lee sesión desde un endpoint ligero
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setSession(j?.session ?? null))
      .catch(() => setSession(null))
  }, [])

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
        {/* Público: solo Ordenar */}
        {!session && (
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
            {session ? '👤' : '🔐'}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-neutral-900 p-2 shadow-xl z-50">
              {!session ? (
                // 👉 Aquí cambiamos Link por button + router.push
                <button
                  type="button"
                  className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                  onClick={() => {
                    setMenuOpen(false)
                    router.push('/login')
                  }}
                >
                  Iniciar sesión (PIN)
                </button>
              ) : (
                <>
                  <div className="px-3 py-2 text-sm text-zinc-400">
                    Sesión: <b>{session.role}</b>
                  </div>

                  {session.role === 'caja' && (
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

                  {session.role === 'admin' && (
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

                  <form action="/api/auth/logout" method="post" className="mt-1">
                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm">
                      Cerrar sesión
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
