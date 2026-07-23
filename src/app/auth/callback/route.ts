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
        const savedRedirect = request.cookies.get('auth_redirect')?.value;

        if (data.nickname) {
            const targetRedirect = savedRedirect
                ? decodeURIComponent(savedRedirect)
                : '/home';
            const response = NextResponse.redirect(
                new URL(targetRedirect, request.nextUrl.origin),
            );
            response.cookies.delete('auth_redirect');
            return response;
        }

        return NextResponse.redirect(
            new URL('/nickname', request.nextUrl.origin),
        );
    } catch {
        return NextResponse.redirect(
            new URL('/login?error=oauth_failed', request.url),
        );
    }
}
