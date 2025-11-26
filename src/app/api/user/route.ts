import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { ZodError } from 'zod';

import { authOptions } from '@/lib/auth';
import { getUserProfile, updateUserProfile } from '@/lib/user';

const unauthorized = NextResponse.json({ error: '未授權' }, { status: 401 });

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorized;
  }

  const profile = await getUserProfile(session.user.id);

  if (!profile) {
    return NextResponse.json({ error: '找不到使用者' }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const result = await updateUserProfile(session.user.id, body);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: '驗證失敗', details: error.issues },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: '更新失敗' }, { status: 500 });
  }
}

