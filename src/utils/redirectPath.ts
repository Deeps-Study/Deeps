export const DEFAULT_REDIRECT_PATH = '/';

const BASE_ORIGIN = 'http://internal.invalid';

export function safeDecode(value: string): string | null {
    try {
        return decodeURIComponent(value);
    } catch {
        return null;
    }
}

function toInternalPath(value: string): string | null {
    if (!/^\/(?!\/)/.test(value) || /[\\\u0000-\u001f\u007f]/.test(value)) {
        return null;
    }

    try {
        const url = new URL(value, BASE_ORIGIN);
        if (url.origin !== BASE_ORIGIN || url.pathname.startsWith('//')) {
            return null;
        }
        return url.pathname + url.search + url.hash;
    } catch {
        return null;
    }
}

/* 디코딩된 값을 받아 사이트 내부 경로만 반환하고, 그 외에는 기본 경로를 반환 */
export function resolveRedirectPath(value: string | null | undefined): string {
    if (!value) return DEFAULT_REDIRECT_PATH;

    const path = toInternalPath(value);
    let decoded = safeDecode(value);
    if (path === null || decoded === null) return DEFAULT_REDIRECT_PATH;

    // 더 디코딩되지 않을 때까지 모든 단계가 내부 경로인지 확인
    let previous = value;
    while (decoded !== null && decoded !== previous) {
        if (toInternalPath(decoded) === null) return DEFAULT_REDIRECT_PATH;
        previous = decoded;
        decoded = safeDecode(decoded);
    }

    return path;
}
