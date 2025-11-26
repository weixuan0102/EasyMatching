import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z, ZodError } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const unauthorized = NextResponse.json({ error: '未授權' }, { status: 401 });

const reportSchema = z.object({
    reportedUserId: z.string(),
    conversationId: z.string().optional(),
    reason: z.enum(['harassment', 'spam', 'inappropriate_content', 'fake_profile', 'other']),
    description: z.string().optional()
});

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return unauthorized;
    }

    try {
        const json = await request.json();
        const payload = reportSchema.parse(json);

        // Prevent self-reporting
        if (payload.reportedUserId === session.user.id) {
            return NextResponse.json(
                { error: '無法舉報自己' },
                { status: 400 }
            );
        }

        // Create report
        const report = await prisma.report.create({
            data: {
                reporterId: session.user.id,
                reportedUserId: payload.reportedUserId,
                conversationId: payload.conversationId,
                reason: payload.reason,
                description: payload.description || null
            }
        });

        return NextResponse.json({ success: true, reportId: report.id });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: '資料驗證失敗', details: error.issues },
                { status: 422 }
            );
        }

        console.error('Report error:', error);
        return NextResponse.json(
            { error: '舉報失敗，請稍後再試' },
            { status: 500 }
        );
    }
}
