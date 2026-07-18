import { api } from './index';

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

interface CachedToken {
    accessToken: string;
    expiresAt: number;
}

const ACCESS_TOKEN_TTL_MS = 1000 * 60 * 60;
const EXPIRY_BUFFER_MS = 1000 * 60;

const tokenCache = new Map<string, CachedToken>();
const inFlightRotations = new Map<string, Promise<TokenPair | null>>();

export function cacheAccessToken(
    refreshToken: string,
    accessToken: string,
): void {
    tokenCache.set(refreshToken, {
        accessToken,
        expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
    });
}

export function clearSession(refreshToken: string): void {
    tokenCache.delete(refreshToken);
}

export async function getAccessToken(
    refreshToken: string,
): Promise<TokenPair | null> {
    const cached = tokenCache.get(refreshToken);
    if (cached && cached.expiresAt > Date.now() + EXPIRY_BUFFER_MS) {
        return { accessToken: cached.accessToken, refreshToken };
    }

    const inFlight = inFlightRotations.get(refreshToken);
    if (inFlight) return inFlight;

    const rotation = rotate(refreshToken).finally(() => {
        inFlightRotations.delete(refreshToken);
    });
    inFlightRotations.set(refreshToken, rotation);
    return rotation;
}

async function rotate(refreshToken: string): Promise<TokenPair | null> {
    try {
        const { data } = await api.post<TokenPair>('/auth/token', {
            refreshToken,
        });
        tokenCache.delete(refreshToken);
        cacheAccessToken(data.refreshToken, data.accessToken);
        return data;
    } catch {
        return null;
    }
}
