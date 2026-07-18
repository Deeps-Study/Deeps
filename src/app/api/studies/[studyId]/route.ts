import { NextRequest, NextResponse } from 'next/server';
import { api, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';
import type { StudyDetailResponse } from '@/types/study';

interface RouteParams {
    params: Promise<{ studyId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const accessToken = await requireAccessToken();

    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { studyId } = await params;

    try {
        const { data } = await api.get<StudyDetailResponse>(
            `/studies/${studyId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        );

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: '스터디 상세 정보를 가져오는 데 실패했습니다.' },
            { status: backendErrorStatus(error) },
        );
    }
}
