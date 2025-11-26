import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import RegisterView from '@/components/auth/RegisterView';
import { authOptions } from '@/lib/auth';

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const raw = resolvedSearchParams?.callbackUrl;
  const callbackUrl = Array.isArray(raw) ? raw[0] : raw ?? undefined;

  if (session?.user?.id) {
    redirect(callbackUrl ?? '/chat');
  }

  const providers = {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    facebook: Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET)
  };

  return <RegisterView callbackUrl={callbackUrl} providers={providers} />;
}

