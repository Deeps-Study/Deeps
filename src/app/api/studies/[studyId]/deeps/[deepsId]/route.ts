import { NextResponse } from 'next/server';
import { api, backendErrorMessage, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';
import type { DeepsDetailModel } from '@/types/deeps';

interface RouteParams {
    params: Promise<{ studyId: string; deepsId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
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

export async function PATCH(request: Request, { params }: RouteParams) {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId, deepsId } = await params;
    const body = await request.json();

    try {
        const { data } = await api.patch(
            `/studies/${studyId}/deeps/${deepsId}`,
            body,
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: backendErrorMessage(error, 'Failed to update deeps') },
            { status: backendErrorStatus(error) },
        );
    }
}
