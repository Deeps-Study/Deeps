import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/api';
import { isAxiosError } from 'axios';
import { requireAccessToken } from '@/api/authSession';

interface RouteParams {
    params: Promise<{ studyId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();

    if (!accessToken) {
        return NextResponse.json(
            { message: '로그인이 필요합니다.' },
            { status: 401 },
        );
    }

    const { studyId } = await params;

    try {
        const body = await request.json();

        // POST /studies/:studyId/members
        const response = await api.post(
            `/studies/${studyId}/members`,
            { password: body.password },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        return NextResponse.json(response.data, { status: 201 });
    } catch (error) {
        let status = 500;
        let message = '스터디 참여 처리에 실패했습니다.';

        if (isAxiosError<{ message?: string }>(error)) {
            status = error.response?.status ?? 500;
            message = error.response?.data?.message ?? message;
        }

        return NextResponse.json({ message }, { status });
    }
}
