import { cache } from 'react';
import { cookies } from 'next/headers';
import { clearSession, getAccessToken, cacheAccessToken } from './session';

export const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30일

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: REFRESH_MAX_AGE,
    path: '/',
};

// auth/callback 등 다른 파일에서 쓸 수 있도록 재수출
export { cacheAccessToken };

export const requireAccessToken = cache(async (): Promise<string | null> => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) return null;

    // Redis 기반 getAccessToken 호출
    const result = await getAccessToken(refreshToken);
    if (!result) {
        return null;
    }

    // Server Component 렌더링 중 cookieStore.set 호출 시 크래시 방지
    if (result.refreshToken !== refreshToken) {
        try {
            cookieStore.set(REFRESH_COOKIE, result.refreshToken, cookieOptions);
        } catch {
            // Server Component 렌더링 컨텍스트에서는 쿠키 수정 무시
        }
    }

    return result.accessToken;
});

export async function setSessionCookie(refreshToken: string): Promise<void> {
    const cookieStore = await cookies();
    try {
        cookieStore.set(REFRESH_COOKIE, refreshToken, cookieOptions);
    } catch (e) {
        console.error('쿠키 설정 실패:', e);
    }
}

export async function endSession(): Promise<void> {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
        // Redis 삭제 함수 비동기 호출
        await clearSession(refreshToken);
    }
    try {
        cookieStore.delete(REFRESH_COOKIE);
    } catch (e) {
        console.error('쿠키 삭제 실패:', e);
    }
}
