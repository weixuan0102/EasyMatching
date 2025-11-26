import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export type MatchingResult = {
  user: {
    id: string;
    uid: string;
    loginId: string | null;
    username: string;
    name: string | null;
    image: string | null;
    bio: string | null;
  };
  sharedHobbies: {
    id: string;
    name: string;
    slug: string;
  }[];
  otherHobbies: {
    id: string;
    name: string;
    slug: string;
  }[];
  sharedCount: number;
};

const userWithHobbiesInclude = {
  hobbies: {
    include: {
      hobby: true
    }
  }
} satisfies Prisma.UserInclude;

export const findMatchingUsers = async (userId: string, search?: string) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: userWithHobbiesInclude
  });

  if (!currentUser) {
    throw new Error('USER_NOT_FOUND');
  }

  const userHobbyIds = new Set(
    currentUser.hobbies.map((link) => link.hobbyId)
  );

  const where: Prisma.UserWhereInput = {
    id: {
      not: userId
    },
    onboardingCompleted: true
  };

  if (search && search.trim().length > 0) {
    const normalized = search.trim();
    where.AND = [
      {
        OR: [
          {
            loginId: {
              contains: normalized,
              mode: 'insensitive'
            }
          },
          {
            username: {
              contains: normalized,
              mode: 'insensitive'
            }
          }
        ]
      }
    ];
  }

  const candidates = await prisma.user.findMany({
    where,
    include: userWithHobbiesInclude,
    orderBy: {
      updatedAt: 'desc'
    },
    take: search && search.trim().length > 0 ? 20 : 50
  });

  const results: MatchingResult[] = candidates
    .map((user) => {
      const shared = user.hobbies.filter((link) =>
        userHobbyIds.has(link.hobbyId)
      );
      const sharedHobbyIds = new Set(shared.map((link) => link.hobbyId));

      return {
        user: {
          id: user.id,
          uid: user.uid,
          loginId: user.loginId,
          username: user.username,
          name: user.name,
          image: user.image,
          bio: user.bio
        },
        sharedHobbies: shared.map((link) => ({
          id: link.hobby.id,
          name: link.hobby.name,
          slug: link.hobby.slug
        })),
        otherHobbies: user.hobbies
          .filter((link) => !sharedHobbyIds.has(link.hobbyId))
          .map((link) => ({
            id: link.hobby.id,
            name: link.hobby.name,
            slug: link.hobby.slug
          })),
        sharedCount: shared.length
      };
    })
    .filter((entry) =>
      search && search.trim().length > 0 ? true : entry.sharedCount > 0
    )
    .sort((a, b) => {
      if (b.sharedCount !== a.sharedCount) {
        return b.sharedCount - a.sharedCount;
      }

      const aName = a.user.username?.toLowerCase() ?? '';
      const bName = b.user.username?.toLowerCase() ?? '';
      return aName.localeCompare(bName);
    });

  return results;
};


