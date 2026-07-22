import { NextRequest, NextResponse } from 'next/server';
import { api, backendErrorMessage, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';

export async function POST(
    _request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ studyId: string; deepsId: string; answerId: string }>;
    },
) {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId, deepsId, answerId } = await params;

    try {
        const { data } = await api.post(
            `/studies/${studyId}/deeps/${deepsId}/answers/${answerId}/like`,
            {},
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: backendErrorMessage(error, 'Failed to toggle like') },
            { status: backendErrorStatus(error) },
        );
    }
}
