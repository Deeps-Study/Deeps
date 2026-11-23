import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { businessCalls, readFakes, resetFakes } from './support/fakes';
import { discoverRoutes } from './support/routes';

interface Row {
    route: string;
    /** 실제로 호출할 주소. 생략하면 route를 쓴다. */
    url?: string;
    /** 기대하는 백엔드 호출 */
    backend: string;
    body?: object;
    multipart?: boolean;
}

const S = '/api/studies/[studyId]';
const D = `${S}/deeps/[deepsId]`;

const matrix: Row[] = [
    { route: 'POST /api/studies', backend: 'POST /studies', body: { title: 't' } },
    { route: 'GET /api/studies/me', backend: 'GET /studies/me' },
    { route: `GET ${S}`, backend: 'GET /studies/s1' },
    { route: `PATCH ${S}`, backend: 'PATCH /studies/s1', body: { title: 't' } },
    { route: `DELETE ${S}`, backend: 'DELETE /studies/s1' },
    {
        route: `POST ${S}/join`,
        backend: 'POST /studies/s1/members',
        body: { password: 'fake' },
    },
    { route: `GET ${S}/members`, backend: 'GET /studies/s1/members' },
    { route: `DELETE ${S}/members/me`, backend: 'DELETE /studies/s1/members/me' },
    { route: `GET ${S}/deeps`, backend: 'GET /studies/s1/deeps' },
    {
        route: `POST ${S}/deeps`,
        backend: 'POST /studies/s1/deeps',
        body: { title: 't' },
    },
    {
        route: `POST ${S}/deeps/images`,
        backend: 'POST /studies/s1/deeps/images',
        multipart: true,
    },
    { route: `GET ${D}`, backend: 'GET /studies/s1/deeps/d1' },
    {
        route: `PATCH ${D}`,
        backend: 'PATCH /studies/s1/deeps/d1',
        body: { title: 't' },
    },
    { route: `GET ${D}/answers`, backend: 'GET /studies/s1/deeps/d1/answers' },
    {
        route: `POST ${D}/answers`,
        backend: 'POST /studies/s1/deeps/d1/answers',
        body: { content: 'c' },
    },
    {
        route: `GET ${D}/answers/me`,
        backend: 'GET /studies/s1/deeps/d1/answers/me',
    },
    {
        route: `PATCH ${D}/answers/me`,
        backend: 'PATCH /studies/s1/deeps/d1/answers/me',
        body: { content: 'c' },
    },
    {
        route: `POST ${D}/answers/[answerId]/like`,
        backend: 'POST /studies/s1/deeps/d1/answers/a1/like',
    },
    { route: 'GET /api/users/me', backend: 'GET /users/me' },
    { route: 'DELETE /api/users/me', backend: 'DELETE /users/me' },
    {
        route: 'PATCH /api/users/me/nickname',
        backend: 'PATCH /users/me/nickname',
        body: { nickname: 'tester' },
    },
    {
        route: 'GET /api/users/me/nickname/check',
        url: '/api/users/me/nickname/check?nickname=tester',
        backend: 'GET /users/me/nickname/check',
    },
];

// 매트릭스에 넣지 않는 라우트. 이유를 함께 적는다.
const excluded = [
    'GET /api/auth/google', // 로그인 시작: e2e에서 확인
    'POST /api/auth/logout', // 로그아웃: 아래 별도 테스트
    'GET /auth/callback', // 로그인 콜백: e2e에서 확인
    'GET /api/studies/[studyId]/preview', // 의도가 문서에 없어 보류
];

const appDir = path.resolve(__dirname, '../../src/app');

function call(request: APIRequestContext, row: Row, refreshToken?: string) {
    const [method, route] = row.route.split(' ');
    const url = (row.url ?? route)
        .replace('[studyId]', 's1')
        .replace('[deepsId]', 'd1')
        .replace('[answerId]', 'a1');
    return request.fetch(url, {
        method,
        maxRedirects: 0,
        headers: refreshToken
            ? { Cookie: `refresh_token=${refreshToken}` }
            : undefined,
        data: row.body,
        multipart: row.multipart
            ? {
                  file: {
                      name: 'fake.png',
                      mimeType: 'image/png',
                      buffer: Buffer.from('fake'),
                  },
              }
            : undefined,
    });
}

const validSession = {
    redis: { 'token:refresh-valid': 'access-valid' },
    accessTokens: ['access-valid'],
};

test.describe('라우트 목록', () => {
    test('모든 라우트가 매트릭스나 제외 목록에 정확히 한 번 있다', () => {
        const listed = [...matrix.map((row) => row.route), ...excluded].sort();
        expect(discoverRoutes(appDir)).toEqual(listed);
    });

    test('새 라우트와 새 메서드를 찾아낸다', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acceptance-routes-'));
        try {
            fs.mkdirSync(path.join(dir, 'api/(group)/[id]'), { recursive: true });
            fs.writeFileSync(
                path.join(dir, 'api/(group)/[id]/route.ts'),
                'export async function GET() {}\nexport const POST = GET;\n' +
                    'const h = GET;\nexport { h as DELETE };\n',
            );
            expect(discoverRoutes(dir)).toEqual([
                'DELETE /api/[id]',
                'GET /api/[id]',
                'POST /api/[id]',
            ]);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });
});

for (const row of matrix) {
    test.describe(row.route, () => {
        test('쿠키 없음: 401, 백엔드 호출 없음', async ({ request }) => {
            await resetFakes(validSession);
            const res = await call(request, row);
            expect(res.status()).toBe(401);
            expect((await readFakes()).calls).toEqual([]);
        });

        for (const rejectStatus of [401, 403]) {
            test(`만료·거부된 세션(${rejectStatus}): 401, 업무 API 호출 없음`, async ({
                request,
            }) => {
                await resetFakes({ ...validSession, rejectStatus });
                const res = await call(request, row, 'refresh-rejected');
                expect(res.status()).toBe(401);
                const state = await readFakes();
                expect(businessCalls(state)).toEqual([]);
                // 세션을 실제로 확인하고 거부했는지 본다(헛통과 방지).
                expect(state.calls.map((c) => [c.path, c.body])).toEqual([
                    ['/auth/token', { refreshToken: 'refresh-rejected' }],
                ]);
            });
        }

        test('유효 세션(캐시): Bearer로 올바른 백엔드 호출', async ({
            request,
        }) => {
            await resetFakes(validSession);
            const res = await call(request, row, 'refresh-valid');
            expect(res.ok()).toBe(true);
            const { calls } = await readFakes();
            expect(
                calls.map((c) => [`${c.method} ${c.path}`, c.authorization]),
            ).toEqual([[row.backend, 'Bearer access-valid']]);
        });

        test('유효 세션(토큰 재발급): 새 Bearer로 올바른 백엔드 호출', async ({
            request,
        }) => {
            await resetFakes({
                refreshTokens: {
                    'refresh-old': {
                        accessToken: 'access-new',
                        refreshToken: 'refresh-new',
                    },
                },
                accessTokens: ['access-new'],
            });
            const res = await call(request, row, 'refresh-old');
            expect(res.ok()).toBe(true);
            const calls = businessCalls(await readFakes());
            expect(
                calls.map((c) => [`${c.method} ${c.path}`, c.authorization]),
            ).toEqual([[row.backend, 'Bearer access-new']]);
        });

        for (const status of [403, 404]) {
            test(`백엔드 ${status}를 그대로 전달`, async ({ request }) => {
                await resetFakes({ ...validSession, forcedStatus: status });
                const res = await call(request, row, 'refresh-valid');
                expect(res.status()).toBe(status);
                const { calls } = await readFakes();
                expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
                    row.backend,
                ]);
            });
        }
    });
}

test('로그아웃: 백엔드에 알리고 세션과 쿠키를 지운다', async ({ request }) => {
    await resetFakes(validSession);
    const res = await request.post('/api/auth/logout', {
        headers: { Cookie: 'refresh_token=refresh-valid' },
    });
    expect(res.ok()).toBe(true);
    expect(res.headers()['set-cookie']).toMatch(
        /refresh_token=;.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i,
    );
    const state = await readFakes();
    expect(state.redis).toEqual({});
    expect(
        state.calls.map((c) => [
            `${c.method} ${c.path}`,
            c.authorization,
            c.body,
        ]),
    ).toEqual([
        [
            'POST /auth/logout',
            'Bearer access-valid',
            { refreshToken: 'refresh-valid' },
        ],
    ]);
});
