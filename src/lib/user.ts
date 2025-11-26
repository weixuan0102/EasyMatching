import { Prisma } from '@prisma/client';
import { z, ZodError } from 'zod';

import {
  ensureUserIdentifiers,
  generateUniqueUid,
  normalizeBase,
  normalizeLoginId
} from '@/lib/identifiers';
import { prisma } from '@/lib/prisma';

const USERNAME_SCHEMA = z
  .string()
  .trim()
  .min(2, '使用者名稱至少需要 2 個字元')
  .max(24, '使用者名稱不可超過 24 個字元')
  .regex(
    /^[\p{L}\p{N}_\- ]+$/u,
    '使用者名稱僅能包含文字、數字、空白、底線或連字號'
  );

const BIO_SCHEMA = z
  .string()
  .trim()
  .max(100, '自我簡介不可超過 100 個字元');

const IMAGE_SCHEMA = z
  .union([z.string().trim().url('頭像需為有效的 URL'), z.literal('')])
  .optional();

const PROFILE_UPDATE_SCHEMA = z
  .object({
    username: USERNAME_SCHEMA.optional(),
    bio: z.union([BIO_SCHEMA, z.literal('')]).optional(),
    image: IMAGE_SCHEMA,
    loginId: z
      .union([z.literal(''), z.string()])
      .optional()
  })
  .refine(
    (value) =>
      value.username !== undefined ||
      value.bio !== undefined ||
      value.image !== undefined ||
      value.loginId !== undefined,
    '未提供任何可更新的欄位'
  );

export const LOGIN_ID_SCHEMA = z
  .string()
  .trim()
  .min(4, 'userID 至少需要 4 個字元')
  .max(24, 'userID 不可超過 24 個字元')
  .regex(/^[a-zA-Z0-9_]+$/, 'userID 僅能包含英數字與底線');

const HOBBY_UPDATE_SCHEMA = z.object({
  hobbies: z.array(z.string().trim()).max(20).default([]),
  completeOnboarding: z.boolean().optional()
});

const USER_WITH_HOBBIES_INCLUDE = {
  hobbies: {
    include: {
      hobby: true
    }
  }
} satisfies Prisma.UserInclude;

type UserWithHobbies = Prisma.UserGetPayload<{
  include: typeof USER_WITH_HOBBIES_INCLUDE;
}>;

const serializeUser = (user: UserWithHobbies) => ({
  id: user.id,
  uid: user.uid,
  loginId: user.loginId,
  username: user.username,
  name: user.name,
  email: user.email,
  image: user.image,
  bio: user.bio ?? '',
  onboardingCompleted: user.onboardingCompleted,
  hobbies: user.hobbies.map((link) => ({
    id: link.hobby.id,
    name: link.hobby.name,
    slug: link.hobby.slug
  })),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_WITH_HOBBIES_INCLUDE
  });

  if (!user) {
    return null;
  }

  await ensureUserIdentifiers(userId, user.name ?? user.email ?? null);

  return serializeUser(user);
};

export const updateUserProfile = async (userId: string, input: unknown) => {
  const payload = PROFILE_UPDATE_SCHEMA.parse(input);

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      loginId: true
    }
  });

  if (!currentUser) {
    throw new Error('使用者不存在');
  }

  const updates: Prisma.UserUpdateInput = {};

  if (payload.username !== undefined) {
    const desired = payload.username;

    if (desired !== currentUser.username) {
      updates.username = desired;
      updates.uid = await generateUniqueUid(normalizeBase(desired));
    }
  }

  if (payload.loginId !== undefined) {
    const desiredRaw = payload.loginId.trim();

    if (desiredRaw.length === 0) {
      updates.loginId = null;
    } else {
      const formatted = normalizeLoginId(LOGIN_ID_SCHEMA.parse(desiredRaw));

      if (formatted !== currentUser.loginId) {
        const existing = await prisma.user.findFirst({
          where: {
            loginId: formatted,
            NOT: {
              id: userId
            }
          },
          select: {
            id: true
          }
        });

        if (existing) {
          throw new ZodError([
            {
              code: z.ZodIssueCode.custom,
              message: 'userID 已被使用',
              path: ['loginId']
            }
          ]);
        }

        updates.loginId = formatted;
      }
    }
  }

  if (payload.bio !== undefined) {
    updates.bio = payload.bio.length > 0 ? payload.bio : null;
  }

  if (payload.image !== undefined) {
    updates.image =
      payload.image && payload.image.length > 0 ? payload.image : null;
  }

  if (Object.keys(updates).length === 0) {
    return getUserProfile(userId);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updates,
    include: USER_WITH_HOBBIES_INCLUDE
  });

  await ensureUserIdentifiers(
    updatedUser.id,
    updatedUser.name ?? updatedUser.email ?? null
  );

  return serializeUser(updatedUser);
};

export const updateUserHobbies = async (userId: string, input: unknown) => {
  const payload = HOBBY_UPDATE_SCHEMA.parse(input);

  const hobbies = await prisma.hobby.findMany({
    where: {
      slug: {
        in: payload.hobbies
      }
    }
  });

  const hobbyIds = hobbies.map((hobby) => hobby.id);

  await prisma.$transaction(async (tx) => {
    const existingLinks = await tx.userHobby.findMany({
      where: { userId },
      select: {
        hobbyId: true
      }
    });

    const existingSet = new Set(existingLinks.map((link) => link.hobbyId));
    const incomingSet = new Set(hobbyIds);

    const toDelete = existingLinks
      .filter((link) => !incomingSet.has(link.hobbyId))
      .map((link) => link.hobbyId);

    const toCreate = hobbyIds.filter((id) => !existingSet.has(id));

    if (toDelete.length > 0) {
      await tx.userHobby.deleteMany({
        where: {
          userId,
          hobbyId: {
            in: toDelete
          }
        }
      });
    }

    if (toCreate.length > 0) {
      await tx.userHobby.createMany({
        data: toCreate.map((hobbyId) => ({
          userId,
          hobbyId
        }))
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted:
          payload.completeOnboarding ??
          (hobbyIds.length > 0 ? true : undefined)
      }
    });
  });

  return getUserProfile(userId);
};

export const listHobbiesWithSelection = async (userId: string) => {
  const [allHobbies, userHobbies] = await Promise.all([
    prisma.hobby.findMany({
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.userHobby.findMany({
      where: { userId },
      select: { hobbyId: true }
    })
  ]);

  const selectedSet = new Set(userHobbies.map((link) => link.hobbyId));

  return allHobbies.map((hobby) => ({
    id: hobby.id,
    name: hobby.name,
    slug: hobby.slug,
    selected: selectedSet.has(hobby.id)
  }));
};

