import { cache } from 'react';
import { cookies } from 'next/headers';
import { clearSession, getAccessToken } from './session';

export const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: REFRESH_MAX_AGE,
};

export const requireAccessToken = cache(async (): Promise<string | null> => {
    console.log('🔑 [Token Log] 백엔드 토큰 검증 API 실행!');
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) return null;

    const result = await getAccessToken(refreshToken);
    if (!result) {
        cookieStore.delete(REFRESH_COOKIE);
        return null;
    }
    if (result.refreshToken !== refreshToken) {
        cookieStore.set(REFRESH_COOKIE, result.refreshToken, cookieOptions);
    }
    return result.accessToken;
});

export async function setSessionCookie(refreshToken: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(REFRESH_COOKIE, refreshToken, cookieOptions);
}

export async function endSession(): Promise<void> {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (refreshToken) clearSession(refreshToken);
    cookieStore.delete(REFRESH_COOKIE);
}
