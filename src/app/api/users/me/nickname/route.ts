import { NextRequest, NextResponse } from 'next/server';
import { api, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';

export async function PATCH(request: NextRequest) {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    try {
        await api.patch('/users/me/nickname', body, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return NextResponse.json({ message: 'ok' });
    } catch (error) {
        return NextResponse.json(
            { message: 'Failed to update nickname' },
            { status: backendErrorStatus(error) },
        );
    }
}
