// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized({ token }) {
      // Sin token -> NO autorizado
      if (!token) return false;

      const role = (token as any).role ?? 'none';

      // Solo admin o caja pueden pasar a las rutas protegidas
      if (role === 'admin' || role === 'caja') {
        return true;
      }

      // Rol "none" u otro -> NO autorizado
      return false;
    },
  },
});

// Muy importante: NO incluir /login aquí
export const config = {
  matcher: [
    '/admin/:path*',
    '/caja/:path*',
    '/corte/:path*',
  ],
};
