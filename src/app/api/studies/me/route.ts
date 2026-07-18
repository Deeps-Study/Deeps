import { NextResponse } from 'next/server';
import { api, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';
import type { StudyResponse } from '@/types/study';

export async function GET() {
    const accessToken = await requireAccessToken();

    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data } = await api.get<StudyResponse[]>('/studies/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: '스터디 목록을 가져오는 데 실패했습니다.' },
            { status: backendErrorStatus(error) },
        );
    }
}
