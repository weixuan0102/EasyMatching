'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

const STORAGE_KEY = 'easymatching:savedLogins';
const MAX_SAVED = 5;

type SavedAccount = {
  loginId: string;
  name?: string | null;
  image?: string | null;
};

export default function SessionTracker() {
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const loginId = session?.user?.loginId;
    if (!loginId || loginId.length === 0) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const existing: SavedAccount[] = raw ? JSON.parse(raw) : [];

      const filtered = (Array.isArray(existing) ? existing : []).filter(
        (item) => item && item.loginId !== loginId
      );

      filtered.unshift({
        loginId,
        name: session.user.name ?? session.user.username ?? null,
        image: session.user.image ?? null
      });

      const limited = filtered.slice(0, MAX_SAVED);

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch {
      // ignore localStorage errors
    }
  }, [session?.user?.loginId, session?.user?.name, session?.user?.username, session?.user?.image]);

  return null;
}


