import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test, expect } from './support/browser';
import { APP_URL, BACKEND_URL, REDIS_TOKEN, REDIS_URL } from './support/env';

const support = path.join(__dirname, 'support');
const goodEnv = {
    PATH: process.env.PATH ?? '',
    BACKEND_URL,
    UPSTASH_REDIS_REST_URL: REDIS_URL,
    UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    APP_URL,
};

for (const name of ['BACKEND_URL', 'UPSTASH_REDIS_REST_URL', 'APP_URL']) {
    for (const value of [
        '',
        'http://external.test:4310',
        'http://127.0.0.1.external.test:4310',
        'http://127.0.0.1@external.test:4310',
        'http://0.0.0.0:4310',
    ]) {
        test(`앱 시작 거부: ${name}=${value || '(빈 값)'}`, () => {
            const result = spawnSync('node', ['app-server.mjs'], {
                cwd: support,
                env: { ...goodEnv, NODE_ENV: 'test', [name]: value },
                encoding: 'utf8',
                timeout: 5_000,
            });
            expect(result.status).toBe(1);
            expect(result.stderr).toContain(`${name}:`);
            expect(result.stderr).toContain('시작을 거부합니다');
        });
    }
}

test('앱 프로세스의 외부 연결을 막고 127.0.0.1은 허용한다', () => {
    // 192.0.2.0/24는 문서용 예약 주소라 실제 서버가 없다.
    const script = `
        const code = (url) => fetch(url).then((r) => r.status, (e) => e.cause?.code);
        console.log(JSON.stringify(await Promise.all([
            code('http://192.0.2.1:8080'),
            code('http://external.test:8080'),
            code('${BACKEND_URL}/__control/health'),
        ])));
    `;
    const result = spawnSync(
        'node',
        ['--import=./block-external.mjs', '--input-type=module', '-e', script],
        { cwd: support, encoding: 'utf8', timeout: 5_000 },
    );
    expect(JSON.parse(result.stdout)).toEqual([
        'EXTERNAL_BLOCKED',
        'EXTERNAL_BLOCKED',
        200,
    ]);
});

test('브라우저의 외부 요청을 막는다', async ({ page, blockedUrls }) => {
    await page.goto('/login');
    const result = await page.evaluate(() =>
        fetch('http://external.test/ping', { mode: 'no-cors' }).then(
            () => 'sent',
            () => 'blocked',
        ),
    );
    expect(result).toBe('blocked');
    expect(blockedUrls).toContain('http://external.test/ping');
});
