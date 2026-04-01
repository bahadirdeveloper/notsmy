import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { workspaces, workspaceMembers } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      // Add user.id to session
      session.user.id = user.id;
      return session;
    },
    // NOTE: isNewUser is not available in the signIn callback in NextAuth v5 beta.30.
    // Automatic workspace creation on first login is handled in the main app page
    // by checking if the user has any workspaces and creating one if not.
  },
  pages: {
    signIn: '/login',
  },
});
