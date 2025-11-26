import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import OnboardingForm from '@/components/onboarding/OnboardingForm';
import { authOptions } from '@/lib/auth';
import { getUserProfile, listHobbiesWithSelection } from '@/lib/user';

type OnboardingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/onboarding');
  }

  if (session.user.onboardingCompleted) {
    redirect('/chat');
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pendingLoginIdRaw = resolvedSearchParams?.loginId;
  const pendingLoginId = Array.isArray(pendingLoginIdRaw)
    ? pendingLoginIdRaw[0]
    : pendingLoginIdRaw ?? null;

  const [profile, hobbies] = await Promise.all([
    getUserProfile(session.user.id),
    listHobbiesWithSelection(session.user.id)
  ]);

  return (
    <OnboardingForm
      profile={{
        loginId: profile?.loginId ?? (pendingLoginId ? decodeURIComponent(pendingLoginId) : null)
      }}
      hobbies={hobbies}
    />
  );
}

