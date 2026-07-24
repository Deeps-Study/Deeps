import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/api/authSession';
import { BACKEND_URL } from '@/constants/api';

interface RouteParams {
    params: Promise<{ studyId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId } = await params;
    const formData = await request.formData();

    try {
        const res = await fetch(
            `${BACKEND_URL}/studies/${studyId}/deeps/images`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                body: formData,
            },
        );
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch {
        return NextResponse.json(
            { message: '이미지 업로드에 실패했습니다.' },
            { status: 502 },
        );
    }
}
