import NextAuth from "next-auth";
import { AuthConfig } from "./auth.config";

export default NextAuth(AuthConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};