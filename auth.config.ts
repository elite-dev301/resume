import type { NextAuthConfig } from 'next-auth';
import { Role } from './types/member';

export const authConfig = {
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const user = auth?.user;
      const { nextUrl } = request;

      // Guest Mode
      if (!user) {
        return nextUrl.pathname.startsWith('/interview/');
      }

      if (user && nextUrl.pathname.startsWith('/auth/signin')) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      // Admin Mode
      if (user.role === Role.Admin) {
        return true;
      }

      // Member Mode
      if (user.role === Role.Member && (nextUrl.pathname.startsWith('/dashboard') 
        || nextUrl.pathname.startsWith('/interview/')
        || nextUrl.pathname.startsWith('/application')
      )) {
        return true;
      }

      return false;
    },
  },
  providers: []
} satisfies NextAuthConfig;