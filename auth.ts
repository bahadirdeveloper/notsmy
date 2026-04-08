import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { users, accounts, sessions, verificationTokens } from '@/db/schema';

// Keep users signed in for a long time. The default NextAuth lifetime is
// 30 days, which felt too aggressive — once installed as a PWA on a phone
// the user expects the app to "just stay open" like a native app.
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

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
  // Database session strategy is required by the Drizzle adapter. maxAge here
  // controls both the DB row's `expires` value and the cookie's Max-Age.
  // updateAge means we only re-stamp the row at most once per day, even on
  // very chatty traffic, to keep the DB writes cheap.
  session: {
    strategy: 'database',
    maxAge: ONE_YEAR_IN_SECONDS,
    updateAge: 60 * 60 * 24, // refresh the expires field at most once a day
  },
  // Cookie tweaks: persistent (not "session" cookies that die on tab close),
  // matching the long maxAge above so PWA users stay signed in for real.
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: ONE_YEAR_IN_SECONDS,
      },
    },
  },
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
