// lib/auth/options.ts
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { resolveRole } from './roles';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    // 1) Aquí metemos el rol dentro del token JWT
    async jwt({ token, user }) {
      if (user?.email) {
        const role = resolveRole(user.email);
        (token as any).role = role;
        console.log('[JWT]', { email: user.email, role });
      }
      return token;
    },

    // 2) Aquí construimos bien la sesión que llega al cliente
    async session({ session, token }) {
      if (session.user) {
        // Copiamos lo que viene del token (NextAuth lo pone ahí)
        session.user.name = token.name as string | undefined;
        session.user.email = token.email as string | undefined;
        (session.user as any).role = (token as any).role ?? 'none';
      }

      console.log('[SESSION]', {
        email: session.user?.email,
        role: (session.user as any)?.role,
      });

      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
};
