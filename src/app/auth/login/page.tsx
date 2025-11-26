import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import LoginView from '@/components/auth/LoginView';
import { authOptions } from '@/lib/auth';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_REDIRECT = '/chat';

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const raw = resolvedSearchParams?.callbackUrl;
  const callbackUrl = Array.isArray(raw) ? raw[0] : raw ?? undefined;

  if (session?.user?.id) {
    redirect(callbackUrl ?? DEFAULT_REDIRECT);
  }

  return <LoginView callbackUrl={callbackUrl} />;
}

