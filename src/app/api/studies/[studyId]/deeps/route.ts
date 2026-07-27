import { NextRequest, NextResponse } from 'next/server';
import { api, backendErrorMessage, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';
import type { DeepsItemResponse } from '@/types/deeps';

interface RouteParams {
    params: Promise<{ studyId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId } = await params;
    const body = await request.json();

    try {
        const { data } = await api.post(`/studies/${studyId}/deeps`, body, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: backendErrorMessage(error, 'Failed to create deeps') },
            { status: backendErrorStatus(error) },
        );
    }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();

    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId } = await params;

    try {
        const { data } = await api.get<DeepsItemResponse[]>(
            `/studies/${studyId}/deeps`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        );

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            {
                message: backendErrorMessage(
                    error,
                    '딥스 목록을 가져오는 데 실패했습니다.',
                ),
            },
            { status: backendErrorStatus(error) },
        );
    }
}
