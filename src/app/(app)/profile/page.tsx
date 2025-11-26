import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import ProfileForm from '@/components/profile/ProfileForm';
import { authOptions } from '@/lib/auth';
import { getUserProfile, listHobbiesWithSelection } from '@/lib/user';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/profile');
  }

  const [profile, hobbies] = await Promise.all([
    getUserProfile(session.user.id),
    listHobbiesWithSelection(session.user.id)
  ]);

  if (!profile) {
    redirect('/onboarding');
  }

  return (
    <ProfileForm
      profile={{
        username: profile.username,
        loginId: profile.loginId ?? null,
        bio: profile.bio ?? '',
        image: profile.image ?? null
      }}
      hobbies={hobbies}
    />
  );
}

