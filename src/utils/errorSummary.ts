interface ErrorSummary {
    name: string;
    code?: string;
    status?: number;
}

function readCode(source: unknown): string | undefined {
    const code = (source as { code?: unknown } | null | undefined)?.code;
    return typeof code === 'string' && /^[A-Z0-9_]{1,40}$/.test(code)
        ? code
        : undefined;
}

/* 서버 로그용 오류 요약 */
export function errorSummary(error: unknown): ErrorSummary {
    if (!(error instanceof Error)) return { name: typeof error };

    const { code: ownCode, cause, response } = error as Error & {
        code?: unknown;
        cause?: unknown;
        response?: { status?: unknown };
    };
    const code = readCode(typeof ownCode === 'string' ? error : cause);
    const status = response?.status;

    return {
        name: error.name,
        ...(code && { code }),
        ...(typeof status === 'number' && { status }),
    };
}
