import path from 'node:path';
import { defineConfig } from '@playwright/test';
import {
    APP_URL,
    BACKEND_URL,
    BROWSER_URL,
    REDIS_TOKEN,
    REDIS_URL,
} from './support/env';

const resultsDir = path.resolve(__dirname, '../../test-results');

// 외부 주소로는 이름 해석조차 하지 않는다(preconnect 등 라우팅으로 못 잡는 연결 포함).
const launchOptions = {
    args: ['--host-resolver-rules=MAP localhost 127.0.0.1, MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'],
};

const fakeEnv = {
    BACKEND_URL,
    UPSTASH_REDIS_REST_URL: REDIS_URL,
    UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
};

export default defineConfig({
    testDir: '.',
    testMatch: '**/*.spec.ts',
    outputDir: path.join(resultsDir, 'artifacts'),
    reporter: [
        ['list'],
        ['html', { outputFolder: path.join(resultsDir, 'report'), open: 'never' }],
    ],
    // 가짜 서버의 상태를 모든 테스트가 공유하므로 한 번에 하나만 실행한다.
    workers: 1,
    fullyParallel: false,
    retries: 0,
    forbidOnly: true,
    use: {
        baseURL: BROWSER_URL,
        browserName: 'chromium',
        launchOptions,
        serviceWorkers: 'block',
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    webServer: [
        {
            name: 'fakes',
            command: 'node support/fake-servers.mjs',
            cwd: __dirname,
            env: fakeEnv,
            url: `${BACKEND_URL}/__control/health`,
            reuseExistingServer: false,
        },
        {
            name: 'app',
            command: 'node support/app-server.mjs',
            cwd: __dirname,
            env: { ...fakeEnv, APP_URL },
            url: `${APP_URL}/login`,
            reuseExistingServer: false,
            timeout: 240_000,
            gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
        },
    ],
});
