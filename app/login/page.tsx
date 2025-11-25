// app/login/page.tsx
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'admin' | 'caja' | 'none';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const email = session?.user?.email ?? '—';
  const role = ((session?.user as any)?.role as Role | undefined) ?? 'none';
  const isPrivileged = role === 'admin' || role === 'caja';

  // 🔁 En cuanto haya sesión, decidimos a dónde mandarlo
  useEffect(() => {
    if (status !== 'authenticated') return;

    if (role === 'admin') {
      router.replace('/admin');
      return;
    }

    if (role === 'caja') {
      router.replace('/caja');
      return;
    }

    // Si el rol es "none" -> sesión no válida para el sistema
    // Cerramos sesión y lo mandamos al inicio público
    if (role === 'none') {
      signOut({ callbackUrl: '/' });
    }
  }, [status, role, router]);

  // Solo para que tú veas qué está leyendo NextAuth
  const stateLine = useMemo(
    () => `Estado: ${status} · Correo: ${email} · Rol: ${role}`,
    [status, email, role]
  );

  const showGoogleButton =
    status === 'unauthenticated' || (status === 'authenticated' && role === 'none');

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
          <p className="text-sm text-zinc-400">
            Accede con tu cuenta de Google autorizada para usar el sistema.
          </p>
        </div>

        <p className="text-[11px] text-zinc-500">{stateLine}</p>

        {/* Cargando */}
        {status === 'loading' && (
          <div className="text-sm text-zinc-400">Verificando sesión…</div>
        )}

        {/* Sin sesión o rol none → botón Google */}
        {showGoogleButton && (
          <div className="space-y-3">
            <button
              type="button"
              className="btn h-11 w-full flex items-center justify-center gap-2 text-sm md:text-base"
              onClick={() =>
                signIn('google', {
                  callbackUrl: '/login',
                  prompt: 'select_account',
                })
              }
            >
              <span>🔐</span>
              <span>Entrar con Google</span>
            </button>

            {status === 'authenticated' && role === 'none' && (
              <p className="text-xs text-amber-300">
                Esta cuenta está autenticada pero <b>no tiene permisos</b> en la app.
                Cierra sesión y entra con una cuenta autorizada.
              </p>
            )}
          </div>
        )}

        {/* Si quieres, puedes dejar esta parte solo como info cuando llegue a /login
            ya autenticado (aunque normalmente lo redirigimos antes) */}
        {status === 'authenticated' && isPrivileged && (
          <div className="space-y-3">
            <div className="text-sm text-left bg-black/40 rounded-lg px-3 py-2">
              <div>
                <span className="text-zinc-400">Correo: </span>
                <span className="font-medium">{email}</span>
              </div>
              <div>
                <span className="text-zinc-400">Rol en la app: </span>
                <span className="font-medium">{role}</span>
              </div>
            </div>

            <button
              className="btn h-11 w-full text-sm bg-red-600 hover:bg-red-500"
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Cerrar sesión
            </button>
          </div>
        )}

        <p className="text-[11px] text-zinc-500 pt-2">
          Solo correos autorizados pueden entrar como <b>admin</b> o <b>caja</b>.
        </p>
      </div>
    </main>
  );
}
