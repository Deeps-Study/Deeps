import { NextRequest, NextResponse } from 'next/server';
import { api, backendErrorMessage, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';

interface RouteParams {
    params: Promise<{ studyId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();

    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId } = await params;

    try {
        await api.delete(`/studies/${studyId}/members/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        // 204 No Content 반환
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json(
            {
                message: backendErrorMessage(
                    error,
                    '스터디 나가기에 실패했습니다.',
                ),
            },
            { status: backendErrorStatus(error) },
        );
    }
}
