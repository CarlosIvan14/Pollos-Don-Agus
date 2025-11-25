// components/auth/ProtectedRoute.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

type Props = {
  children: ReactNode;
  allowedRoles?: ('admin' | 'caja')[];
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    const role = (session?.user as any)?.role as 'admin' | 'caja' | 'none' | undefined;

    if (allowedRoles) {
      if (!role || role === 'none' || !allowedRoles.includes(role)) {
        router.replace('/');
      }
    }
  }, [status, session, allowedRoles, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-zinc-400">
        Cargando sesión…
      </div>
    );
  }

  return <>{children}</>;
}
