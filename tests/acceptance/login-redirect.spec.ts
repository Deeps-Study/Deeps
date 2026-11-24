import type { APIRequestContext, BrowserContext, Page } from '@playwright/test';
import { test, expect } from './support/browser';
import { APP_URL, BROWSER_URL } from './support/env';
import { readFakes, resetFakes, type FakeState } from './support/fakes';

const enc = encodeURIComponent;

// 쿠키에 담긴 값 그대로다. 로그인 화면은 경로를 한 번 인코딩해 담는다.
const allowed: [cookie: string, target: string][] = [
    [enc('/home'), '/home'],
    [enc('/home?joinStudy=1'), '/home?joinStudy=1'],
    [enc('/home?joinStudy=1&from=link'), '/home?joinStudy=1&from=link'],
    [enc('/mypage'), '/mypage'],
];

const rejected: string[] = [
    enc('https://external.test/home'),
    enc('HTTP://external.test'),
    enc('https:/external.test'),
    enc('//external.test/home'),
    enc('///external.test'),
    enc('/\\external.test'),
    enc('\\\\external.test'),
    enc('/home\\x'),
    enc('/\t/external.test'),
    enc('/\n/external.test'),
    enc('\t//external.test'),
    enc('/home\r\nx'),
    enc(enc('//external.test')),
    enc(enc('https://external.test')),
    `/${enc('%2Fexternal.test')}`,
    `/${enc('%5Cexternal.test')}`,
    enc('/%09/external.test'),
    '%E0%A4%A',
    '/home%',
    enc('/home%'),
    enc('/%E0%A4%A'),
    enc('javascript:document.title="changed"'),
    enc('java\tscript:document.title="changed"'),
];

// 이동 주소는 정해져 있지 않지만 사이트 밖으로 나가면 안 되는 값
const mustStay: string[] = [
    enc('/.//external.test'),
    enc('/home/..//external.test'),
    enc('/%2e//external.test'),
    enc('.external.test'),
    enc('@external.test'),
];

const login: Partial<FakeState> = {
    codes: {
        'code-existing': {
            accessToken: 'access-e2e',
            refreshToken: 'refresh-e2e',
            nickname: 'tester',
            isNewUser: false,
        },
        'code-new': {
            accessToken: 'access-e2e',
            refreshToken: 'refresh-e2e',
            nickname: null,
            isNewUser: true,
        },
    },
    redis: { 'token:refresh-e2e': 'access-e2e' },
    accessTokens: ['access-e2e'],
    user: {
        id: 'user-1',
        nickname: 'tester',
        image: null,
        accounts: [{ provider: 'google', email: 'tester@example.com' }],
        attendance: [],
    },
};

test.beforeEach(async () => {
    await resetFakes(login);
});

function addCookie(context: BrowserContext, name: string, value: string) {
    return context.addCookies([
        { name, value, domain: 'localhost', path: '/', sameSite: 'Lax' },
    ]);
}

async function cookieNames(context: BrowserContext) {
    return (await context.cookies()).map((cookie) => cookie.name);
}

test.describe('콜백', () => {
    const run = async (
        request: APIRequestContext,
        code: string,
        cookie: string,
    ) => {
        const res = await request.get(`${APP_URL}/auth/callback?code=${code}`, {
            headers: { Cookie: `auth_redirect=${cookie}` },
            maxRedirects: 0,
        });
        const cookies = res
            .headersArray()
            .filter((h) => h.name.toLowerCase() === 'set-cookie')
            .map((h) => h.value);
        return { res, cookies };
    };
    const target = (location: string | undefined) => {
        const url = new URL(location ?? 'missing:', BROWSER_URL);
        expect([BROWSER_URL, APP_URL]).toContain(url.origin);
        return url.pathname + url.search;
    };
    const expectSignedIn = (cookies: string[]) => {
        expect(cookies).toContainEqual(
            expect.stringMatching(/^refresh_token=refresh-e2e;/),
        );
    };
    const expectCleared = (cookies: string[]) => {
        expect(cookies).toContainEqual(
            expect.stringMatching(
                /^auth_redirect=;.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i,
            ),
        );
    };

    for (const [cookie, path] of allowed) {
        test(`정상 경로 유지: ${cookie}`, async ({ request }) => {
            const { res, cookies } = await run(request, 'code-existing', cookie);
            expect(res.status()).toBe(307);
            expect(target(res.headers().location)).toBe(path);
            expectSignedIn(cookies);
            expectCleared(cookies);
        });
    }
    for (const cookie of rejected) {
        test(`/home으로 이동: ${cookie}`, async ({ request }) => {
            const { res, cookies } = await run(request, 'code-existing', cookie);
            expect(res.status()).toBe(307);
            expectSignedIn(cookies);
            expect(target(res.headers().location)).toBe('/home');
        });
        test(`쿠키 삭제: ${cookie}`, async ({ page, context }) => {
            await addCookie(context, 'auth_redirect', cookie);
            await page.goto('/auth/callback?code=code-existing');
            await expect(page).toHaveURL(`${BROWSER_URL}/home`);
            const names = await cookieNames(context);
            expect(names).toContain('refresh_token');
            expect(names).not.toContain('auth_redirect');
        });
    }
    for (const cookie of mustStay) {
        test(`사이트 안에 머묾: ${cookie}`, async ({ request }) => {
            const { res, cookies } = await run(request, 'code-existing', cookie);
            expect(res.status()).toBe(307);
            expectSignedIn(cookies);
            target(res.headers().location);
        });
    }
    test('신규 사용자는 값과 상관없이 /nickname으로 이동', async ({ request }) => {
        for (const cookie of [allowed[1][0], ...rejected]) {
            const { res, cookies } = await run(request, 'code-new', cookie);
            expect(res.status()).toBe(307);
            expect(target(res.headers().location)).toBe('/nickname');
            expectSignedIn(cookies);
        }
    });
});

test.describe('닉네임 설정', () => {
    const submit = async (page: Page, cookie: string) => {
        await addCookie(page.context(), 'refresh_token', 'refresh-e2e');
        await addCookie(page.context(), 'auth_redirect', cookie);
        await page.goto('/nickname');
        await page.getByPlaceholder('닉네임을 입력해주세요.').fill('tester');
        await page.getByRole('button', { name: '완료' }).click();
    };
    const expectSaved = async (page: Page) => {
        const { calls } = await readFakes();
        expect(
            calls.filter((c) => c.method === 'PATCH').map((c) => [c.path, c.body]),
        ).toEqual([['/users/me/nickname', { nickname: 'tester' }]]);
        expect(await cookieNames(page.context())).not.toContain('auth_redirect');
    };

    for (const [cookie, path] of allowed) {
        test(`정상 경로 유지: ${cookie}`, async ({ page }) => {
            await submit(page, cookie);
            await expect(page).toHaveURL(BROWSER_URL + path);
            await expectSaved(page);
        });
    }
    for (const cookie of rejected) {
        test(`/home으로 이동: ${cookie}`, async ({ page, blockedUrls }) => {
            await submit(page, cookie);
            await expect(page).toHaveURL(`${BROWSER_URL}/home`);
            await expect(
                page.getByRole('heading', { name: '현재 진행중인 스터디를' }),
            ).toBeVisible();
            await expectSaved(page);
            expect(blockedUrls.filter((u) => u.includes('external'))).toEqual([]);
            await expect(page).not.toHaveTitle('changed');
        });
    }
    for (const cookie of mustStay) {
        test(`사이트 안에 머묾: ${cookie}`, async ({ page, blockedUrls }) => {
            await submit(page, cookie);
            await expect(page).not.toHaveURL(/\/nickname$/);
            await page.waitForLoadState();
            expect(new URL(page.url()).origin).toBe(BROWSER_URL);
            expect(blockedUrls.filter((u) => u.includes('external'))).toEqual([]);
            await expectSaved(page);
        });
    }
    test('사용 중인 닉네임 안내가 그대로다', async ({ page, context }) => {
        await resetFakes({ ...login, failures: { '/users/me/nickname': 409 } });
        await submit(page, allowed[1][0]);
        await expect(page.getByText('이미 사용 중인 닉네임입니다.')).toBeVisible();
        await expect(page).toHaveURL(`${BROWSER_URL}/nickname`);
        expect(await cookieNames(context)).toContain('auth_redirect');
    });
});
