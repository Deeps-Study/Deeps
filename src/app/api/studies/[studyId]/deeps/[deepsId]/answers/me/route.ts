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
            `/studies/${studyId}/deeps/${deepsId}/answers/me`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            {
                message: backendErrorMessage(
                    error,
                    'Failed to fetch my answer',
                ),
            },
            { status: backendErrorStatus(error) },
        );
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId, deepsId } = await params;
    const body = await request.json();

    try {
        const { data } = await api.patch(
            `/studies/${studyId}/deeps/${deepsId}/answers/me`,
            body,
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            {
                message: backendErrorMessage(
                    error,
                    'Failed to update my answer',
                ),
            },
            { status: backendErrorStatus(error) },
        );
    }
}
