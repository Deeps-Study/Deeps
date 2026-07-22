import { NextRequest, NextResponse } from 'next/server';
import { api, backendErrorMessage, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';

interface RouteParams {
    params: Promise<{ studyId: string; deepsId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId, deepsId } = await params;

    try {
        const { data } = await api.get(
            `/studies/${studyId}/deeps/${deepsId}/answers`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: backendErrorMessage(error, 'Failed to fetch answers') },
            { status: backendErrorStatus(error) },
        );
    }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId, deepsId } = await params;
    const body = await request.json();

    try {
        const { data } = await api.post(
            `/studies/${studyId}/deeps/${deepsId}/answers`,
            body,
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: backendErrorMessage(error, 'Failed to submit answer') },
            { status: backendErrorStatus(error) },
        );
    }
}
