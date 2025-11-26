import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import FacebookProvider from 'next-auth/providers/facebook';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { getServerSession, type NextAuthOptions } from 'next-auth';

import {
  ensureUserIdentifiers,
  generateUniqueUid,
  generateUniqueUsername,
  buildDisplayName,
  normalizeBase,
  normalizeLoginId
} from '@/lib/identifiers';
import { prisma } from '@/lib/prisma';

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value || value.length === 0) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/login'
  },
  providers: [
    GoogleProvider({
      clientId: requiredEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requiredEnv('GOOGLE_CLIENT_SECRET')
    }),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: requiredEnv('GITHUB_CLIENT_ID'),
            clientSecret: requiredEnv('GITHUB_CLIENT_SECRET')
          })
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: requiredEnv('FACEBOOK_CLIENT_ID'),
            clientSecret: requiredEnv('FACEBOOK_CLIENT_SECRET')
          })
        ]
      : []),
    CredentialsProvider({
      id: 'user-id',
      name: 'User ID',
      credentials: {
        loginId: {
          label: 'userID',
          type: 'text',
          placeholder: 'your_user_id'
        }
      },
      async authorize(credentials) {
        const raw = credentials?.loginId;
        if (!raw || raw.trim().length === 0) {
          return null;
        }

        const formatted = normalizeLoginId(raw);

        const user = await prisma.user.findFirst({
          where: {
            loginId: formatted
          }
        });

        if (!user) {
          return null;
        }

        await ensureUserIdentifiers(
          user.id,
          user.name ?? user.email ?? null
        );

        return user;
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.uid = typeof token.uid === 'string' ? token.uid : '';
        session.user.loginId =
          typeof token.loginId === 'string' || token.loginId === null
            ? token.loginId ?? null
            : null;
        session.user.username = typeof token.username === 'string' ? token.username : '';
        session.user.onboardingCompleted = Boolean(token.onboardingCompleted);
      }

      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const enriched = await ensureUserIdentifiers(
          user.id,
          user.name ?? user.email?.split('@')[0]
        );
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            onboardingCompleted: true,
            loginId: true
          }
        });

        if (enriched) {
          token.uid = enriched.uid;
          token.username = enriched.username;
        }

        if (dbUser) {
          token.loginId = dbUser.loginId ?? null;
          token.onboardingCompleted = dbUser.onboardingCompleted;
        }
      }

      if (trigger === 'update' && session?.user) {
        token.username = session.user.username;
        token.loginId = session.user.loginId ?? null;
        token.onboardingCompleted = session.user.onboardingCompleted;
      }

      if (!token.uid || !token.username) {
        const enriched = await ensureUserIdentifiers(
          token.sub ?? '',
          token.name ?? token.email
        );

        if (enriched) {
          token.uid = enriched.uid;
          token.username = enriched.username;
        }

        if (typeof token.onboardingCompleted === 'undefined') {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub ?? '' },
            select: {
              onboardingCompleted: true,
              loginId: true
            }
          });

          if (dbUser) {
            token.loginId = dbUser.loginId ?? null;
            token.onboardingCompleted = dbUser.onboardingCompleted;
          }
        }
      }

      return token;
    }
  },
  events: {
    async createUser({ user }) {
      const displayName = buildDisplayName(user.name);
      const baseFromProfile = normalizeBase(
        user.name ?? user.email?.split('@')[0]
      );
      const sanitizedUsername = await generateUniqueUsername(baseFromProfile);
      const uid = await generateUniqueUid(sanitizedUsername);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          uid,
          username: displayName,
          name: displayName,
          onboardingCompleted: false
        }
      });
    }
  }
};

export const getServerAuthSession = () => getServerSession(authOptions);
