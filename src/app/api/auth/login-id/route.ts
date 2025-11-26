import { NextResponse } from 'next/server';
import { z } from 'zod';

import { normalizeLoginId } from '@/lib/identifiers';
import { prisma } from '@/lib/prisma';
import { LOGIN_ID_SCHEMA } from '@/lib/user';

const REQUEST_SCHEMA = z.object({
  loginId: z.string().trim()
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { loginId } = REQUEST_SCHEMA.parse(json);

    const formatted = normalizeLoginId(loginId);
    LOGIN_ID_SCHEMA.parse(formatted);

    const existing = await prisma.user.findFirst({
      where: {
        loginId: formatted
      },
      select: {
        id: true
      }
    });

    return NextResponse.json({ available: existing ? false : true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'userID 格式不正確',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '檢查 userID 時發生錯誤' },
      { status: 500 }
    );
  }
}


