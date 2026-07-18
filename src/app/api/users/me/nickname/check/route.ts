import { NextRequest, NextResponse } from 'next/server';
import { api, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';

export async function GET(request: NextRequest) {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const nickname = request.nextUrl.searchParams.get('nickname') ?? '';
    try {
        const { data } = await api.get('/users/me/nickname/check', {
            params: { nickname },
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: 'Failed to check nickname' },
            { status: backendErrorStatus(error) },
        );
    }
}
