import { BACKEND_URL } from './env';

export interface BackendCall {
    method: string;
    path: string;
    search: string;
    authorization: string | null;
    body: unknown;
}

export interface FakeState {
    calls: BackendCall[];
    redisCommands: string[][];
    redis: Record<string, string>;
    refreshTokens: Record<string, { accessToken: string; refreshToken: string }>;
    rejectStatus: number;
    codes: Record<
        string,
        {
            accessToken: string;
            refreshToken: string;
            nickname: string | null;
            isNewUser: boolean;
        }
    >;
    accessTokens: string[];
    studies: unknown[];
    user: unknown;
    forcedStatus: number | null;
}

export async function resetFakes(state: Partial<FakeState> = {}) {
    const res = await fetch(`${BACKEND_URL}/__control/reset`, {
        method: 'POST',
        body: JSON.stringify(state),
    });
    if (!res.ok) throw new Error('가짜 서버 초기화 실패');
}

export async function readFakes(): Promise<FakeState> {
    const res = await fetch(`${BACKEND_URL}/__control/state`);
    return (await res.json()) as FakeState;
}

/** 토큰 발급(/auth/token)을 뺀 나머지 백엔드 호출 */
export function businessCalls(state: FakeState): BackendCall[] {
    return state.calls.filter((call) => call.path !== '/auth/token');
}
