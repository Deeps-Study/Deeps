import type { APIRequestContext, APIResponse } from '@playwright/test';
import { test, expect } from './support/browser';
import { expectCodeAfter, watchAppLog } from './support/app-log';
import { REDIS_TOKEN } from './support/env';
import { resetFakes, type FakeState } from './support/fakes';

// 일부만 잘라 남겨도 찾도록 앞과 뒤를 따로 확인한다.
const secret = (name: string) => `${name}HEADq7x-${name}TAILz9k`;
const OLD = secret('OLDRT');
const NEW = secret('NEWRT');
const ACCESS = secret('ACCT');
const CODE = secret('OCODE');
const fragments = [OLD, NEW, ACCESS, CODE].flatMap((s) => s.split('-'));

function expectNoSecrets(log: string) {
    for (const text of [...fragments, REDIS_TOKEN, 'Bearer ', 'command was']) {
        expect(log.includes(text), `로그에 남으면 안 되는 값: ${text}`).toBe(false);
    }
    expect(log).not.toMatch(/authorization["']?\s*:/i);
}

const rotating: Partial<FakeState> = {
    refreshTokens: { [OLD]: { accessToken: ACCESS, refreshToken: NEW } },
    accessTokens: [ACCESS],
    studies: [],
};
const cached: Partial<FakeState> = {
    redis: { [`token:${OLD}`]: ACCESS },
    accessTokens: [ACCESS],
    studies: [],
};
const signingIn: Partial<FakeState> = {
    codes: {
        [CODE]: {
            accessToken: ACCESS,
            refreshToken: NEW,
            nickname: 'tester',
            isNewUser: false,
        },
    },
    accessTokens: [ACCESS],
};

const headers = { Cookie: `refresh_token=${OLD}` };
const CONNECTION_CODE = /ECONNRESET|UND_ERR_SOCKET/;

const getMine = (request: APIRequestContext) =>
    request.get('/api/studies/me', { headers });
const getPage = (url: string) => (request: APIRequestContext) =>
    request.get(url, { headers, maxRedirects: 0 });
const callback = getPage(`/auth/callback?code=${CODE}`);
const logout = (request: APIRequestContext) =>
    request.post('/api/auth/logout', { headers });

interface Case {
    name: string;
    state: Partial<FakeState>;
    act: (request: APIRequestContext) => Promise<APIResponse>;
    status: number;
    location?: RegExp;
    phrases: string[];
    code?: RegExp;
}

const cases: Case[] = [];

for (const [name, failure, code] of [
    ['거부', 403, /\b403\b/],
    ['연결 실패', 'drop', CONNECTION_CODE],
] as const) {
    cases.push(
        {
            name: `토큰 회전 ${name}`,
            state: { ...rotating, failures: { '/auth/token': failure } },
            act: getMine,
            status: 401,
            phrases: ['토큰 회전(/auth/token) 실패'],
            code,
        },
        {
            name: `OAuth 콜백 ${name}`,
            state: { ...signingIn, failures: { '/auth/exchange': failure } },
            act: callback,
            status: 307,
            location: /\/login\?error=oauth_failed$/,
            phrases: ['OAuth 콜백 교환 실패'],
            code,
        },
        {
            name: `SSR members·deeps ${name}`,
            state: {
                ...cached,
                failures: {
                    '/studies/s1/members': failure,
                    '/studies/s1/deeps': failure,
                },
            },
            act: getPage('/study/s1'),
            status: 200,
            phrases: ['SSR members 패칭 에러', 'SSR deeps 패칭 에러'],
            code,
        },
        {
            name: `SSR 스터디 상세 ${name}`,
            state: { ...cached, failures: { '/studies/s1': failure } },
            act: getPage('/study/s1'),
            status: 200,
            phrases: ['SSR /studies/[studyId] 조회 실패 status:'],
            code: failure === 'drop' ? /\b502\b/ : code,
        },
        {
            name: `SSR 스터디 목록·미리보기 ${name}`,
            state: {
                ...cached,
                failures: {
                    '/studies/me': failure,
                    '/studies/s1/preview': failure,
                },
            },
            act: getPage('/home?joinStudy=s1'),
            status: 200,
            phrases: [
                'SSR GET /studies/me 실패 status:',
                'SSR preview 조회 실패 status:',
            ],
            code: failure === 'drop' ? /\b502\b/ : code,
        },
    );
}

for (const mode of ['http', 'command', 'invalid', 'drop'] as const) {
    const code = mode === 'drop' ? CONNECTION_CODE : undefined;
    cases.push(
        {
            name: `Redis get 오류(${mode})`,
            state: { ...rotating, redisFailure: { commands: ['get'], mode } },
            act: getMine,
            status: 200,
            phrases: ['Redis 캐시 조회 실패'],
            code,
        },
        {
            name: `Redis set 오류(${mode}), 토큰 회전`,
            state: { ...rotating, redisFailure: { commands: ['set'], mode } },
            act: getMine,
            status: 200,
            phrases: ['Redis 캐시 저장 실패', 'Grace token 저장 실패'],
            code,
        },
        {
            name: `Redis set 오류(${mode}), 로그인`,
            state: { ...signingIn, redisFailure: { commands: ['set'], mode } },
            act: callback,
            status: 307,
            location: /\/home$/,
            phrases: ['Redis 캐시 저장 실패'],
            code,
        },
        {
            name: `Redis del 오류(${mode})`,
            state: { ...cached, redisFailure: { commands: ['del'], mode } },
            act: logout,
            status: 200,
            phrases: ['Redis 세션 삭제 실패'],
            code,
        },
    );
}

test.describe('서버 로그', () => {
    for (const { name, state, act, status, location, phrases, code } of cases) {
        test(name, async ({ request }) => {
            test.setTimeout(60_000); // Redis 연결 실패는 재시도가 길다.
            await resetFakes(state);
            const log = watchAppLog();

            const res = await act(request);
            expect(res.status()).toBe(status);
            if (location) expect(res.headers().location).toMatch(location);

            const text = await log.waitFor(phrases);
            if (code) {
                for (const phrase of phrases) expectCodeAfter(text, phrase, code);
            }
            expectNoSecrets(text);
        });
    }
});

test.describe('사용자에게 보이는 오류', () => {
    test('스터디 목록 조회 실패 안내가 그대로다', async ({ page, baseURL }) => {
        await resetFakes({ ...cached, failures: { '/studies/me': 500 } });
        await page
            .context()
            .addCookies([{ name: 'refresh_token', value: OLD, url: baseURL ?? '' }]);
        await page.goto('/home');
        await expect(
            page.getByText('서버 내부 문제로 스터디 목록을 불러오지 못했습니다.'),
        ).toBeVisible();
    });
});
