import { NextRequest, NextResponse } from 'next/server';
import { api, backendErrorMessage, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ studyId: string }> },
) {
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
