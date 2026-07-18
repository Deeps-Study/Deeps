import { NextRequest, NextResponse } from 'next/server';
import { api, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';

export async function POST(request: NextRequest) {
    const accessToken = await requireAccessToken();

    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const { data } = await api.post('/studies', body, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { message: '스터디를 생성하는 데 실패했습니다.' },
            { status: backendErrorStatus(error) },
        );
    }
}
