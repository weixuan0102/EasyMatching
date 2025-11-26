import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { findMatchingUsers } from '@/lib/matching';

const unauthorized = NextResponse.json({ error: '未授權' }, { status: 401 });

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? undefined;

  const matches = await findMatchingUsers(session.user.id, search ?? undefined);

  return NextResponse.json({ matches });
}


