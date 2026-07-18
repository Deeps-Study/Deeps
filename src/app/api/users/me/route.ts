import { NextResponse } from 'next/server';
import { api, backendErrorStatus } from '@/api';
import { requireAccessToken, endSession } from '@/api/authSession';
import type { CurrentUserModel } from '@/types/user';

export async function GET() {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { data } = await api.get<CurrentUserModel>('/users/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { message: 'Failed to fetch user' },
            { status: backendErrorStatus(error) },
        );
    }
}

export async function DELETE() {
    const accessToken = await requireAccessToken();
    if (!accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    try {
        await api.delete('/users/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    } catch (error) {
        return NextResponse.json(
            { message: '회원 탈퇴에 실패했습니다.' },
            { status: backendErrorStatus(error) },
        );
    }
    await endSession();
    return NextResponse.json({ message: '회원 탈퇴가 완료되었습니다.' });
}
