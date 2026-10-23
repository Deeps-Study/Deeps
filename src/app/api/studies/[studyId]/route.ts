import { NextRequest, NextResponse } from 'next/server';
import { api, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';
import type { StudyResponse } from '@/types/study';

interface RouteParams {
    params: Promise<{ studyId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();

    if (!accessToken) {
        return NextResponse.json(
            { message: '인증이 필요합니다.' },
            { status: 401 },
        );
    }

    const { studyId } = await params;

    try {
        const { data } = await api.get<StudyResponse>(`/studies/${studyId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: '스터디 상세 정보를 가져오는 데 실패했습니다.' },
            { status: backendErrorStatus(error) },
        );
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();

    if (!accessToken) {
        return NextResponse.json(
            { message: '인증이 필요합니다.' },
            { status: 401 },
        );
    }

    const { studyId } = await params;

    try {
        const body = await request.json();

        const { data } = await api.patch(`/studies/${studyId}`, body, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: '스터디 정보를 수정하는 데 실패했습니다.' },
            { status: backendErrorStatus(error) },
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();

    if (!accessToken) {
        return NextResponse.json(
            { message: '인증이 필요합니다.' },
            { status: 401 },
        );
    }

    const { studyId } = await params;

    try {
        await api.delete(`/studies/${studyId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { messgae: '스터디를 삭제하는 데 실패했습니다.' },
            { status: backendErrorStatus(error) },
        );
    }
}
