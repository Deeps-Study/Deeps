import { NextResponse } from 'next/server';
import { api, backendErrorMessage, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';
import type { DeepsDetailModel } from '@/types/deeps';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ studyId: string; deepsId: string }> },
) {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId, deepsId } = await params;
    const awaitReveal = new URL(request.url).searchParams.get('awaitReveal');

    try {
        const { data } = await api.get<DeepsDetailModel>(
            `/studies/${studyId}/deeps/${deepsId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: awaitReveal ? { awaitReveal } : undefined,
            },
        );
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: backendErrorMessage(error, 'Failed to fetch deeps') },
            { status: backendErrorStatus(error) },
        );
    }
}
