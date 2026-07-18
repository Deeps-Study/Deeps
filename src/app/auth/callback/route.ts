import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/api';
import { cacheAccessToken } from '@/api/session';
import { setSessionCookie } from '@/api/authSession';

interface ExchangeResult {
    accessToken: string;
    refreshToken: string;
    nickname: string | null;
    isNewUser: boolean;
}

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code');
    if (!code) {
        return NextResponse.redirect(
            new URL('/login?error=oauth_failed', request.url),
        );
    }

    try {
        const { data } = await api.post<ExchangeResult>('/auth/exchange', {
            code,
        });
        cacheAccessToken(data.refreshToken, data.accessToken);
        await setSessionCookie(data.refreshToken);
        const redirectPath = data.nickname ? '/home' : '/nickname';
        return NextResponse.redirect(new URL(redirectPath, request.url));
    } catch {
        return NextResponse.redirect(
            new URL('/login?error=oauth_failed', request.url),
        );
    }
}
