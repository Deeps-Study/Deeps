function port(name: string, fallback: number): number {
    const value = Number(process.env[name] ?? fallback);
    if (!Number.isInteger(value) || value < 1024 || value > 65535) {
        throw new Error(`${name} 값이 올바른 포트가 아닙니다.`);
    }
    return value;
}

const ports = {
    backend: port('ACCEPTANCE_BACKEND_PORT', 4310),
    redis: port('ACCEPTANCE_REDIS_PORT', 4311),
    app: port('ACCEPTANCE_APP_PORT', 4312),
};

if (new Set(Object.values(ports)).size !== 3) {
    throw new Error('인수 테스트 포트는 서로 달라야 합니다.');
}

export const BACKEND_URL = `http://127.0.0.1:${ports.backend}`;
export const REDIS_URL = `http://127.0.0.1:${ports.redis}`;
export const APP_URL = `http://127.0.0.1:${ports.app}`;
// Next가 리다이렉트 주소의 127.0.0.1을 localhost로 바꾸므로 브라우저는
// localhost로 접속한다. 서버는 127.0.0.1에만 열려 있다.
export const BROWSER_URL = `http://localhost:${ports.app}`;
export const REDIS_TOKEN = 'fake-redis-token';
