import { prisma } from '@/lib/prisma';

export const normalizeBase = (value: string | null | undefined): string => {
  const sanitized = (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');

  return sanitized.length > 0 ? sanitized.slice(0, 24) : 'user';
};

export const buildDisplayName = (value: string | null | undefined): string => {
  const trimmed = (value ?? '').trim();
  if (trimmed.length > 0) {
    return trimmed.slice(0, 24);
  }
  return 'EasyMatcher';
};

export const generateUniqueUsername = async (baseInput: string): Promise<string> => {
  const base = normalizeBase(baseInput);
  let candidate = base;
  let attempt = 0;

  while (true) {
    const existing = await prisma.user.findFirst({
      where: { username: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}${attempt}`;
  }
};

export const generateUniqueUid = async (username: string): Promise<string> => {
  let counter = 0;

  while (true) {
    const candidate = `${username}_${counter}`;
    const existing = await prisma.user.findUnique({
      where: { uid: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }

    counter += 1;
  }
};

export const ensureUserIdentifiers = async (
  userId: string,
  nameLike: string | null | undefined
) => {
  if (!userId) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      uid: true,
      username: true,
      name: true
    }
  });

  if (!existing) {
    return null;
  }

  let { uid, username, name } = existing;

  if (!username || username.trim().length === 0) {
    const base = normalizeBase(nameLike ?? existing.name ?? '');
    username = await generateUniqueUsername(base);
  }

  if (!uid || uid.trim().length === 0) {
    uid = await generateUniqueUid(username);
  }

  if (!name || name.trim().length === 0) {
    name = buildDisplayName(nameLike ?? existing.name);
  }

  if (
    uid !== existing.uid ||
    username !== existing.username ||
    name !== existing.name
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        uid,
        username,
        name
      }
    });
  }

  return {
    uid,
    username,
    name
  };
};

export const normalizeLoginId = (value: string): string => {
  return value.trim().toLowerCase();
};

