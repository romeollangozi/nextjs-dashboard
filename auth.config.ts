import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
export const AuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isInDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isInDashboard) {
        if (isLoggedIn) return true;
        else return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [Credentials({})],
} satisfies NextAuthConfig;
