import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { users, accounts, sessions, verificationTokens } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      // Return a fresh object so we don't mutate a possibly-frozen session
      return {
        ...session,
        user: { ...session.user, id: user.id },
      };
    },
    // NOTE: isNewUser is not available in the signIn callback in NextAuth v5 beta.30.
    // Automatic workspace creation on first login is handled in the main app page
    // by checking if the user has any workspaces and creating one if not.
  },
  pages: {
    signIn: '/login',
  },
});
