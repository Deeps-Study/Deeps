import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/api';
import { cacheAccessToken } from '@/api/session';
import { REFRESH_COOKIE } from '@/api/authSession';

interface ExchangeResult {
    accessToken: string;
    refreshToken: string;
    nickname: string | null;
    isNewUser: boolean;
}

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

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

        // await를 붙여 Redis에 토큰이 100% 저장된 후 다음 줄로 넘어가도록 보장
        await cacheAccessToken(data.refreshToken, data.accessToken);

        const savedRedirect = request.cookies.get('auth_redirect')?.value;
        const targetPath = data.nickname
            ? savedRedirect
                ? decodeURIComponent(savedRedirect)
                : '/home'
            : '/nickname';

        // 리다이렉트 응답 객체를 먼저 생성
        const response = NextResponse.redirect(
            new URL(targetPath, request.nextUrl.origin),
        );

        // 응답 객체(response)의 헤더에 Set-Cookie를 직접 심어서 브라우저로 전송
        response.cookies.set(REFRESH_COOKIE, data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: REFRESH_MAX_AGE,
            path: '/',
        });

        if (data.nickname && savedRedirect) {
            response.cookies.delete('auth_redirect');
        }

        return response;
    } catch (error) {
        console.error('OAuth 콜백 교환 실패:', error);
        return NextResponse.redirect(
            new URL('/login?error=oauth_failed', request.url),
        );
    }
}
