import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { api } from '@/api';
import {
    requireAccessToken,
    endSession,
    REFRESH_COOKIE,
} from '@/api/authSession';

export async function POST() {
    const accessToken = await requireAccessToken();
    if (accessToken) {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
        try {
            await api.post(
                '/auth/logout',
                { refreshToken },
                { headers: { Authorization: `Bearer ${accessToken}` } },
            );
        } catch {}
    }
    await endSession();
    return NextResponse.json({ message: '로그아웃 되었습니다.' });
}
