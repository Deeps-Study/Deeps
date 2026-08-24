import { api } from './index';
import { redis } from '@/lib/redis';

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

// Redis 자체의 만료 기능(EX)을 사용하므로 초 단위 TTL 정의
const ACCESS_TOKEN_TTL_SEC = 50 * 60; // 50분 (3000초)

// 단일 인스턴스 내에서 찰나의 순간에 백엔드 /auth/token 중복 호출을 막아주는 Promise 홀더
const inFlightRotations = new Map<string, Promise<TokenPair | null>>();

/* Redis에 Access Token 캐싱 */
export async function cacheAccessToken(
    refreshToken: string,
    accessToken: string,
): Promise<void> {
    try {
        await redis.set(`token:${refreshToken}`, accessToken, {
            ex: ACCESS_TOKEN_TTL_SEC, // Redis가 50분 뒤 자동 삭제
        });
    } catch (error) {
        console.error('Redis 캐시 저장 실패:', error);
    }
}

/* 세션 삭제 - 로그아웃 시 Redis에서 해당 키 삭제 */
export async function clearSession(refreshToken: string): Promise<void> {
    try {
        await redis.del(`token:${refreshToken}`);
    } catch (error) {
        console.error('Redis 세션 삭제 실패:', error);
    }
}

/* Access Token 조회 - Redis 조회를 먼저 수행 */
export async function getAccessToken(
    refreshToken: string,
): Promise<TokenPair | null> {
    try {
        // Redis에서 'token:리프레시토큰' 키로 Access Token 조회
        const cachedAccessToken = await redis.get<string>(
            `token:${refreshToken}`,
        );

        // 캐시에 살아있다면 백엔드 요청 없이 즉시 반환
        if (cachedAccessToken && typeof cachedAccessToken === 'string') {
            return { accessToken: cachedAccessToken, refreshToken };
        }
    } catch (error) {
        console.error('Redis 캐시 조회 실패:', error);
    }

    // 캐시에 없을 때만 백엔드로 토큰 회전 요청 (중복 방지 Promise 큐 사용)
    const inFlight = inFlightRotations.get(refreshToken);
    if (inFlight) return inFlight;

    const rotation = rotate(refreshToken).finally(() => {
        inFlightRotations.delete(refreshToken);
    });
    inFlightRotations.set(refreshToken, rotation);
    return rotation;
}

/* 백엔드 /auth/token 호출 및 회전 */
async function rotate(refreshToken: string): Promise<TokenPair | null> {
    try {
        const { data } = await api.post<TokenPair>('/auth/token', {
            refreshToken,
        });

        // 1) 새로 발급받은 Refresh Token은 50분 동안 정상 저장
        await cacheAccessToken(data.refreshToken, data.accessToken);

        // 2) 직전에 사용된 '구 Refresh Token'도 30초 동안은 새 Access Token을 가리키도록 유예 등록
        //    이유: 다른 서버리스 인스턴스나 클라이언트가 밀리초 차이로 구 쿠키를 들고 와도
        //          백엔드를 또 찌르지 않고 30초 캐시에서 꺼내 쓰도록 하여 401 및 Ping-Pong 원천 차단
        if (refreshToken !== data.refreshToken) {
            try {
                await redis.set(`token:${refreshToken}`, data.accessToken, {
                    ex: 30, // 30초 후 소멸
                });
            } catch (e) {
                console.error('Grace token 저장 실패:', e);
            }
        }

        return data;
    } catch (error) {
        console.error('토큰 회전(/auth/token) 실패:', error);
        return null;
    }
}
