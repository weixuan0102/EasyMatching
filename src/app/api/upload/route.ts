import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB in bytes

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: '未上傳檔案' }, { status: 400 });
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `檔案大小超過限制 (最大 3MB)` },
                { status: 400 }
            );
        }

        // Convert file to Base64
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');
        const mimeType = file.type;

        // Create data URL for direct use in <img>, <video>, <audio> tags
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return NextResponse.json({ url: dataUrl });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: '檔案上傳失敗' },
            { status: 500 }
        );
    }
}
