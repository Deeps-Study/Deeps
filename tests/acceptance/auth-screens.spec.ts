// 이슈 #152 4단계(로그인)·5단계(온보딩) 인수 테스트. 완료 조건만 보고 구현 전에 썼다.
// 가짜 백엔드·Redis만 쓴다. 응답을 바꿀 때는 기존 responses·failures 형식을 쓰고,
// 요청을 붙잡아 두어야 할 때만 브라우저 쪽에서 붙잡는다(holdRequests).
import type { BrowserContext, ElementHandle, Locator, Page, Request, Route } from '@playwright/test';
import { test, expect } from './support/browser';
import { BACKEND_URL, BROWSER_URL } from './support/env';
import { readFakes, resetFakes, type FakeState } from './support/fakes';
import { uaRingColor } from './support/focus';
import { focusProblems, focusStyle } from './support/focus-change';
import { completeOnboarding, onboarding } from './support/onboarding';

const INVERSE = 'rgb(15, 23, 42)'; // #0F172A
const STRONG = 'rgb(4, 120, 87)'; // #047857

const study = {
    id: 'study-1',
    title: '가짜 알고리즘 스터디',
    status: 'IN_PROGRESS',
    startDate: '2020-01-01',
    endDate: '2099-12-31',
    currentMemberCount: 2,
    maxMemberCount: 4,
    tags: ['fake'],
    hasPassword: false,
};

const fakes: Partial<FakeState> = {
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
    studies: [study],
    user: {
        id: 'user-1',
        nickname: 'tester',
        image: null,
        accounts: [{ provider: 'google', email: 'tester@example.com' }],
        attendance: [],
    },
    responses: {
        '/studies/study-1': { ...study, isHost: false },
        '/studies/study-1/preview': study,
        '/studies/study-1/members': [],
        '/studies/study-1/deeps': [],
    },
};

const CHECK_PATH = '/users/me/nickname/check';
const SAVE_PATH = '/users/me/nickname';

const resetWith = (extra: Partial<FakeState> = {}) => resetFakes({ ...fakes, ...extra });
const duplicate = () =>
    resetWith({ responses: { ...fakes.responses, [CHECK_PATH]: { available: false } } });

// 구현 전 코드에서는 요소가 없어 실패한다. 동작 대기 시간만 줄인다(검사 내용은 같다).
test.use({ actionTimeout: 5_000 });

test.beforeEach(async () => {
    await resetWith();
});

const loginButton = (page: Page) =>
    page.getByRole('button', { name: 'Google로 계속하기', exact: true });
const oauthStarted = (page: Page) =>
    expect(page.getByRole('heading', { name: 'fake oauth start' })).toBeVisible();
const LOGIN_FAILED = '로그인에 실패했어요. 다시 시도해 주세요.';

function signIn(context: BrowserContext) {
    return context.addCookies([{ name: 'refresh_token', value: 'refresh-e2e', url: BROWSER_URL }]);
}

async function openOnboarding(page: Page) {
    await signIn(page.context());
    await page.goto('/onboarding');
    await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
    await expect(onboarding.input(page)).toBeVisible();
}

async function expectHome(page: Page, search = '') {
    await expect(page).toHaveURL(`${BROWSER_URL}/${search}`);
    await expect(page.getByText(study.title).first()).toBeVisible();
}

const inviteDialog = (page: Page) => page.getByRole('heading', { name: study.title, level: 2 });

const LIVE =
    '[aria-live]:not([aria-live="off"]), [role="alert"], [role="status"], [role="log"], output';

/** 문구가 보이는지(같은 문구가 보조기기용으로 한 번 더 있어도 된다) */
const see = (page: Page, text: string | RegExp) =>
    expect(page.getByText(text, { exact: true }).filter({ visible: true }).first()).toBeVisible();

/** 문구가 보이고, 그 문구 중 하나가 보조기기에 전달되는 영역(live region·alert·status) 안에 있다. */
async function expectAnnounced(page: Page, text: string) {
    await see(page, text);
    const flags = await page
        .getByText(text, { exact: true })
        .evaluateAll((els, live) => els.map((el) => el.closest(live) !== null), LIVE);
    expect(flags.some(Boolean), `"${text}"가 보조기기에 전달되어야 함`).toBe(true);
}

/** 브라우저 요청을 붙잡아 둔다. release를 부르기 전까지 응답이 오지 않는다. */
async function holdRequests(page: Page, match: (request: Request) => boolean) {
    const held: { request: Request; release: () => Promise<void> }[] = [];
    await page.route(
        (url) => url.origin === BROWSER_URL || url.origin === BACKEND_URL,
        async (route: Route) => {
            const request = route.request();
            if (!match(request)) return route.fallback();
            await new Promise<void>((resolve) => {
                held.push({
                    request,
                    release: async () => {
                        await route.continue().catch(() => undefined);
                        resolve();
                    },
                });
            });
        },
    );
    return held;
}

const isCheck = (r: Request) => new URL(r.url()).pathname.endsWith('/nickname/check');
const isSave = (r: Request) =>
    r.method() === 'PATCH' && new URL(r.url()).pathname.endsWith('/users/me/nickname');
const nicknameOf = (r: Request) => new URL(r.url()).searchParams.get('nickname');

async function backendCalls(method: string, path: string) {
    return (await readFakes()).calls.filter((c) => c.method === method && c.path === path);
}

/** 값이 없으면 바로 실패한다(non-null 단언 대신). */
function must<T>(value: T | null | undefined, what: string): T {
    if (value === null || value === undefined) throw new Error(`${what}이(가) 없음`);
    return value;
}
const viewport = (page: Page) => must(page.viewportSize(), '뷰포트');
const boxOf = async (locator: Locator) => must(await locator.boundingBox(), '요소 위치');

/** 가장 큰 보이는 짙은 남색(inverse) 배경 요소의 위치. 없으면 null. */
function darkPanel(page: Page) {
    return page.evaluate((inverse) => {
        let best: { left: number; right: number; top: number; bottom: number; width: number; height: number } | null =
            null;
        for (const el of document.body.querySelectorAll('*')) {
            const s = getComputedStyle(el);
            if (s.backgroundColor !== inverse || s.display === 'none' || s.visibility === 'hidden') continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (!best || r.width * r.height > best.width * best.height) {
                best = { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
            }
        }
        return best;
    }, INVERSE);
}

async function expectTwoColumns(page: Page, leftItems: Locator[]) {
    const { width: vw, height: vh } = viewport(page);
    const panel = must(await darkPanel(page), '짙은 남색(#0F172A) 영역');
    expect(panel.left, '남색 영역은 오른쪽 단').toBeGreaterThanOrEqual(vw * 0.35);
    expect(panel.right, '남색 영역은 오른쪽 끝까지').toBeGreaterThanOrEqual(vw * 0.9);
    expect(panel.width).toBeGreaterThanOrEqual(vw * 0.3);
    expect(panel.height, '남색 영역은 화면 높이 대부분').toBeGreaterThanOrEqual(vh * 0.6);
    for (const item of leftItems) {
        const box = await boxOf(item);
        expect(box.x + box.width, '왼쪽 단 요소는 남색 영역 왼쪽에 있어야 함').toBeLessThanOrEqual(panel.left);
    }
    return panel;
}

async function expectOneColumn(page: Page) {
    const vw = viewport(page).width;
    const panel = await darkPanel(page);
    // 넓이·높이가 큰 남색 영역이 없어야 한다(작은 장식은 허용하지 않을 이유가 없어 크기로 본다).
    const isLarge = panel !== null && panel.width >= vw / 3 && panel.height >= 200;
    expect(isLarge, `좁은 화면에서 남색 비주얼 영역이 보이면 안 됨: ${JSON.stringify(panel)}`).toBe(false);
}

/** 가로 스크롤이 없고, 버튼이 화면 안에서 다른 요소에 가려지지 않는다. */
async function expectFits(page: Page, buttons: Locator[]) {
    const size = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        vw: window.innerWidth,
    }));
    expect(size.doc, '가로 스크롤(문서)').toBeLessThanOrEqual(size.vw);
    expect(size.body, '가로 스크롤(body)').toBeLessThanOrEqual(size.vw);
    for (const button of buttons) {
        await button.scrollIntoViewIfNeeded();
        const box = await boxOf(button);
        expect(box.x, '버튼 왼쪽이 화면 안').toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, '버튼 오른쪽이 화면 안').toBeLessThanOrEqual(size.vw);
        const onTop = await button.evaluate((el) => {
            const r = el.getBoundingClientRect();
            const points = [
                [r.left + r.width / 2, r.top + r.height / 2],
                [r.left + 2, r.top + 2],
                [r.right - 2, r.bottom - 2],
            ];
            return points.every(([x, y]) => {
                const hit = document.elementFromPoint(x, y);
                return hit !== null && (hit === el || el.contains(hit));
            });
        });
        expect(onTop, '버튼이 다른 요소에 가려지면 안 됨').toBe(true);
    }
}

const WIDTHS = [320, 360, 768, 1023, 1024, 1280];

/** 우측 남색 영역의 문구(로그인·온보딩 같음. 온보딩은 팀장 결정, 질문 4=A) */
const VISUAL_TEXTS = [
    'DEEP LEARNING, TOGETHER',
    '좋은 질문을 직접 만들어보고',
    '동료와 생각을 나누며 성장해요',
    'Deeps · Study platform for developers',
];
const WIDE = (w: number) => w >= 1024;

const QUOTE = /설명할 수 있을 때/;
const TERMS = /약관|개인정보/;

async function expectNoQuoteOrTerms(page: Page) {
    const text = await page.evaluate(() => document.body.textContent ?? '');
    expect(text, '인용문 없음').not.toMatch(QUOTE);
    expect(text, '약관 동의 문구 없음').not.toMatch(TERMS);
}

/** 한 요소의 글자 조각과 그 색. 강조 글자 확인용. */
function textColors(locator: Locator) {
    return locator.evaluate((root) => {
        const out: { text: string; color: string }[] = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const text = (n.textContent ?? '').trim();
            if (text && n.parentElement) out.push({ text, color: getComputedStyle(n.parentElement).color });
        }
        return out;
    });
}

// ---------------------------------------------------------------------------
// 4단계 로그인
// ---------------------------------------------------------------------------

test.describe('4-1. 로그인 화면 구성: 넓으면 좌측 로그인·우측 남색 2단, 좁으면 한 단', () => {
    for (const width of WIDTHS) {
        test(`${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 800 });
            await page.goto('/login');
            await expect(loginButton(page)).toBeVisible();
            const visual = page.getByText('DEEP LEARNING, TOGETHER', { exact: true });
            if (WIDE(width)) {
                const panel = await expectTwoColumns(page, [
                    page.getByRole('heading', { level: 1 }),
                    loginButton(page),
                ]);
                await expect(visual).toBeVisible();
                const box = await boxOf(visual);
                expect(box.x, '우측 문구는 남색 영역 안').toBeGreaterThanOrEqual(panel.left);
            } else {
                await expectOneColumn(page);
                await expect(visual).toBeHidden();
            }
        });
    }
});

test.describe('4-2. 로그인 좌측 문구', () => {
    for (const width of [360, 1280]) {
        test(`${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 800 });
            await page.goto('/login');
            await expect(page.getByText('Deeps', { exact: true }).filter({ visible: true }).first()).toBeVisible();
            await see(page, '함께 깊어지는 학습');
            await expect(page.locator('h1')).toHaveCount(1);
            const h1 = page.getByRole('heading', { level: 1 });
            await expect(h1).toHaveText(/^질문하고,\s*풀고,\s*더 깊이 이해하세요\.$/);
            await expect(h1).toBeVisible();
            await expect(
                page.getByText(
                    '혼자 넘겼던 개념을 문제로 만들고 동료의 풀이에서 새로운 관점을 발견하세요.',
                    { exact: true },
                ),
            ).toBeVisible();
            await expect(loginButton(page)).toBeVisible();
            await expect(page.getByRole('button', { name: 'Google 계정으로 로그인' })).toHaveCount(0);
        });
    }

    test('"더 깊이 이해하세요."만 강조색(#047857)이다', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/login');
        const parts = await textColors(page.getByRole('heading', { level: 1 }));
        const strong = parts.filter((p) => p.color === STRONG).map((p) => p.text).join('');
        const rest = parts.filter((p) => p.color !== STRONG).map((p) => p.text).join('');
        expect(strong.replace(/\s+/g, ' '), JSON.stringify(parts)).toBe('더 깊이 이해하세요.');
        expect(rest.replace(/\s+/g, ''), JSON.stringify(parts)).toBe('질문하고,풀고,');
    });

    // 팀장 결정(2026-11-26, 질문 1=B): Google 버튼은 흰 배경+테두리 초안이라 색을 #047857로 요구하지 않는다.
    // #047857 채움은 주 버튼("Deeps 시작하기")에서만 본다(5-2).
});

test.describe('4-3. 로그인 우측 문구, 인용문·약관 문구 없음', () => {
    test('1280px 우측 문구가 보인다', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/login');
        for (const text of VISUAL_TEXTS) {
            await see(page, text);
        }
    });

    for (const path of ['/login', '/login?error=oauth_failed']) {
        for (const width of [360, 1280]) {
            test(`${path} ${width}px: 인용문·약관 문구가 없다`, async ({ page }) => {
                await page.setViewportSize({ width, height: 800 });
                await page.goto(path);
                await expect(loginButton(page)).toBeVisible();
                await expectNoQuoteOrTerms(page);
            });
        }
    }
});

test.describe('4-4. 버튼이 OAuth를 시작하고 초대 복귀가 유지된다', () => {
    test('누르면 백엔드 OAuth를 한 번 시작한다', async ({ page }) => {
        await page.goto('/login');
        await loginButton(page).click();
        await oauthStarted(page);
        const url = new URL(page.url());
        expect(url.origin + url.pathname).toBe(`${BACKEND_URL}/auth/google`);
        expect((await readFakes()).calls.map((c) => `${c.method} ${c.path}`)).toEqual(['GET /auth/google']);
    });

    test('키보드(Tab·Enter)만으로 시작할 수 있다', async ({ page }) => {
        await page.goto('/login');
        await expect(loginButton(page)).toBeVisible();
        let focused = false;
        for (let i = 0; i < 15 && !focused; i++) {
            await page.keyboard.press('Tab');
            focused = await loginButton(page).evaluate((el) => el === document.activeElement);
        }
        expect(focused, 'Tab으로 버튼에 닿아야 함').toBe(true);
        await page.keyboard.press('Enter');
        await oauthStarted(page);
    });

    test('OAuth 시작이 끝나기 전에 다시 눌러도 한 번만 시작한다', async ({ page }) => {
        const held = await holdRequests(page, (r) => new URL(r.url()).pathname === '/auth/google');
        await page.goto('/login');
        const button = loginButton(page);
        await expect(button).toBeVisible();
        await button.click();
        await expect.poll(() => held.length).toBe(1);
        // 첫 요청이 붙잡혀 있는 동안 다시 누른다(비활성이면 click은 무시된다).
        await button.evaluate((el: HTMLElement) => el.click());
        await button.evaluate((el: HTMLElement) => el.click());
        await page.waitForTimeout(500);
        expect(held.length, '두 번째 OAuth 시작 요청').toBe(1);
        await held[0].release();
        await oauthStarted(page);
        expect(held.length).toBe(1);
        expect(await backendCalls('GET', '/auth/google')).toHaveLength(1);
    });

    for (const invite of ['/?joinStudy=study-1', '/home?joinStudy=study-1']) {
        test(`초대 링크에서 로그인하면 초대 창이 열린다: ${invite}`, async ({ page }) => {
            await page.goto(invite);
            await expect(page).toHaveURL((url) => url.pathname === '/login');
            await loginButton(page).click();
            await oauthStarted(page);
            await page.goto('/auth/callback?code=code-existing');
            await expectHome(page, '?joinStudy=study-1');
            await expect(inviteDialog(page)).toBeVisible();
        });
    }
});

test.describe('4-5. 로그인 실패 안내', () => {
    test('error=oauth_failed면 실패 문구가 alert로 전달된다', async ({ page }) => {
        await page.goto('/login?error=oauth_failed');
        await expect(page.getByRole('alert').filter({ hasText: LOGIN_FAILED }).first()).toBeVisible();
        await expect(loginButton(page)).toBeVisible();
    });

    test('콜백이 실패해 돌아오면 실패 문구가 alert로 전달된다', async ({ page }) => {
        await page.goto('/auth/callback?code=code-rejected');
        await expect(page).toHaveURL(`${BROWSER_URL}/login?error=oauth_failed`);
        await expect(page.getByRole('alert').filter({ hasText: LOGIN_FAILED }).first()).toBeVisible();
    });

    test('오류가 없으면 실패 문구가 없다', async ({ page }) => {
        await page.goto('/login');
        await expect(loginButton(page)).toBeVisible();
        await expect(page.getByText(LOGIN_FAILED)).toHaveCount(0);
    });
});

test.describe('4-6. 초대 쿠키 정리', () => {
    const startInvite = async (page: Page, clickLogin: boolean) => {
        await page.goto('/?joinStudy=study-1');
        await expect(page).toHaveURL((url) => url.pathname === '/login');
        await expect(loginButton(page)).toBeVisible();
        if (clickLogin) {
            await loginButton(page).click();
            await oauthStarted(page);
        }
    };
    const expectNoInvite = async (page: Page) => {
        await expectHome(page);
        await page.waitForLoadState('networkidle');
        await expect(inviteDialog(page)).toBeHidden();
        await expect(page.getByRole('button', { name: '입장', exact: true })).toBeHidden();
    };

    for (const clickLogin of [true, false]) {
        const how = clickLogin ? 'OAuth까지 갔다가' : '로그인 화면에서';
        test(`초대 로그인을 ${how} 그만두고 /login에서 다시 로그인하면 초대가 열리지 않는다`, async ({
            page,
        }) => {
            await startInvite(page, clickLogin);
            await page.goto('/login');
            await loginButton(page).click();
            await oauthStarted(page);
            await page.goto('/auth/callback?code=code-existing');
            await expectNoInvite(page);
        });
    }

    test('초대를 그만둔 뒤 /login에서 시작한 로그인이 실패해 다시 시도해도 초대가 열리지 않는다', async ({
        page,
    }) => {
        await startInvite(page, true);
        await page.goto('/login');
        await loginButton(page).click();
        await oauthStarted(page);
        await page.goto('/auth/callback?code=code-rejected');
        await expect(page).toHaveURL(`${BROWSER_URL}/login?error=oauth_failed`);
        await loginButton(page).click();
        await oauthStarted(page);
        await page.goto('/auth/callback?code=code-existing');
        await expectNoInvite(page);
    });

    test('초대를 그만둔 신규 사용자도 온보딩 뒤 초대가 아니라 /로 간다', async ({ page }) => {
        await startInvite(page, true);
        await page.goto('/login');
        await loginButton(page).click();
        await oauthStarted(page);
        await page.goto('/auth/callback?code=code-new');
        await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
        await completeOnboarding(page);
        await expectNoInvite(page);
    });

    test('초대 로그인이 실패해 돌아온 화면에서 다시 시도하면 초대가 열린다', async ({ page }) => {
        await startInvite(page, true);
        await page.goto('/auth/callback?code=code-rejected');
        await expect(page).toHaveURL(`${BROWSER_URL}/login?error=oauth_failed`);
        await expect(page.getByRole('alert').filter({ hasText: LOGIN_FAILED }).first()).toBeVisible();
        await loginButton(page).click();
        await oauthStarted(page);
        await page.goto('/auth/callback?code=code-existing');
        await expectHome(page, '?joinStudy=study-1');
        await expect(inviteDialog(page)).toBeVisible();
    });

    test('초대 로그인이 실패한 뒤 신규 사용자로 다시 시도하면 온보딩 뒤 초대가 열린다', async ({ page }) => {
        await startInvite(page, true);
        await page.goto('/auth/callback?code=code-rejected');
        await expect(page).toHaveURL(`${BROWSER_URL}/login?error=oauth_failed`);
        await loginButton(page).click();
        await oauthStarted(page);
        await page.goto('/auth/callback?code=code-new');
        await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
        await completeOnboarding(page);
        await expectHome(page, '?joinStudy=study-1');
        await expect(inviteDialog(page)).toBeVisible();
    });
});

test.describe('4-7. 로그인 화면 폭: 가로 스크롤 없음, 버튼이 가려지지 않음', () => {
    for (const path of ['/login', '/login?error=oauth_failed']) {
        for (const width of WIDTHS) {
            test(`${path} ${width}px`, async ({ page }) => {
                await page.setViewportSize({ width, height: 640 });
                await page.goto(path);
                await expect(loginButton(page)).toBeVisible();
                await page.evaluate(() => document.fonts.ready.then(() => undefined));
                await expectFits(page, [loginButton(page)]);
            });
        }
    }
});

// ---------------------------------------------------------------------------
// 5단계 온보딩
// ---------------------------------------------------------------------------

test.describe('5-1. 온보딩 화면 구성', () => {
    for (const width of WIDTHS) {
        test(`${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 800 });
            await openOnboarding(page);
            if (WIDE(width)) {
                const panel = await expectTwoColumns(page, [
                    page.getByRole('heading', { level: 1 }),
                    onboarding.input(page),
                    onboarding.start(page),
                ]);
                for (const text of VISUAL_TEXTS) {
                    const item = page.getByText(text, { exact: true });
                    await expect(item).toBeVisible();
                    const box = await boxOf(item);
                    expect(box.x, `${text}는 남색 영역 안`).toBeGreaterThanOrEqual(panel.left);
                }
            } else {
                await expectOneColumn(page);
                for (const text of VISUAL_TEXTS) await expect(page.getByText(text, { exact: true })).toBeHidden();
            }
            await expectNoQuoteOrTerms(page);
        });
    }
});

test.describe('5-2. 온보딩 문구와 처음 상태', () => {
    for (const width of [360, 1280]) {
        test(`${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 800 });
            await openOnboarding(page);
            await expect(page.getByText('Deeps', { exact: true }).filter({ visible: true }).first()).toBeVisible();
            await see(page, /^2\s*\/\s*2\s*단계$/);
            await expect(page.locator('h1')).toHaveCount(1);
            await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^반가워요!\s*어떻게 불러드릴까요\?$/);
            await expect(
                page.getByText('Deeps에서 사용할 나만의 닉네임을 설정해주세요.', { exact: true }),
            ).toBeVisible();
            const input = onboarding.input(page);
            await expect(input).toHaveAttribute('placeholder', '2~12자 닉네임');
            await expect(input).toHaveValue('');
            await see(page, '한글, 영문, 숫자만 사용할 수 있어요.');
            await expect(input).not.toHaveAttribute('aria-invalid', 'true');
            await expect(onboarding.check(page)).toBeDisabled();
            await expect(onboarding.start(page)).toBeDisabled();
            await expect(page.getByRole('button', { name: '완료', exact: true })).toHaveCount(0);
        });
    }

    test('"Deeps 시작하기" 버튼 색은 #047857이다(활성 상태)', async ({ page }) => {
        await openOnboarding(page);
        await onboarding.input(page).fill('tester');
        await onboarding.check(page).click();
        await see(page, onboarding.available);
        await expect(onboarding.start(page)).toBeEnabled();
        const color = await onboarding.start(page).evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(color).toBe(STRONG);
    });
});

const LENGTH_ERROR = '2~12자로 입력해주세요.';
const FORMAT_GUIDE = '한글, 영문, 숫자만 사용할 수 있어요.';

test.describe('5-3. 닉네임 규칙(한글 음절·영문·숫자 2~12자)', () => {
    const valid = ['가나', 'ab', 'a1', '12', 'abcdefghijkl', '가나다라마바사아자차카타', 'Tester12한글'];
    const lengthErrors = ['가', 'a', 'abcdefghijklm', '가나다라마바사아자차카타파'];
    const formatErrors = ['가 나', 'ab c', 'abc!', '가나_', 'ㄱㄴ', '가나ㅏ', 'test@1', 'ａｂ'];

    for (const value of valid) {
        test(`통과: "${value}"(${value.length}자)`, async ({ page }) => {
            await openOnboarding(page);
            const input = onboarding.input(page);
            await input.fill(value);
            await expect(input).toHaveValue(value);
            await expect(onboarding.check(page)).toBeEnabled();
            await expect(input).not.toHaveAttribute('aria-invalid', 'true');
            await expect(page.getByText(LENGTH_ERROR)).toHaveCount(0);
            await onboarding.check(page).click();
            await see(page, onboarding.available);
            const calls = await backendCalls('GET', CHECK_PATH);
            expect(calls.map((c) => new URLSearchParams(c.search).get('nickname'))).toEqual([value]);
        });
    }

    for (const value of lengthErrors) {
        test(`길이 오류: "${value}"(${value.length}자)`, async ({ page }) => {
            await openOnboarding(page);
            const input = onboarding.input(page);
            await input.fill(value);
            await expect(input).toHaveValue(value);
            await expectAnnounced(page, LENGTH_ERROR);
            await expect(input).toHaveAttribute('aria-invalid', 'true');
            await expect(onboarding.check(page)).toBeDisabled();
            await expect(onboarding.start(page)).toBeDisabled();
        });
    }

    for (const value of formatErrors) {
        test(`형식 오류: "${value}"`, async ({ page }) => {
            await openOnboarding(page);
            const input = onboarding.input(page);
            await input.fill(value);
            await expect(input).toHaveValue(value);
            await expect(input).toHaveAttribute('aria-invalid', 'true');
            await expect(onboarding.check(page)).toBeDisabled();
            await expect(onboarding.start(page)).toBeDisabled();
            // 형식 안내 "한글, 영문, 숫자만 사용할 수 있어요."가 오류로 보인다(팀장 결정, 질문 2=B).
            // 입력의 설명(aria-describedby)이나 알림 영역으로 보조기기에 전달되어야 한다.
            await see(page, FORMAT_GUIDE);
            const conveyed = await input.evaluate((el, live) => {
                const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
                const described = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
                const announced = [...document.querySelectorAll(live)].map((e) => e.textContent ?? '').join(' ');
                return `${described} ${announced}`;
            }, LIVE);
            expect(conveyed, '형식 안내가 오류로 보조기기에 전달되어야 함').toContain(FORMAT_GUIDE);
            expect(conveyed, '형식 오류에 길이 오류 문구를 쓰지 않음').not.toContain(LENGTH_ERROR);
            expect(await backendCalls('GET', CHECK_PATH)).toEqual([]);
        });
    }

    test('값을 지우면 오류가 사라지고 처음 상태다', async ({ page }) => {
        await openOnboarding(page);
        const input = onboarding.input(page);
        await input.fill('가');
        await see(page, LENGTH_ERROR);
        await input.fill('');
        await expect(page.getByText(LENGTH_ERROR)).toHaveCount(0);
        await expect(input).not.toHaveAttribute('aria-invalid', 'true');
        await expect(onboarding.check(page)).toBeDisabled();
    });

    test.describe('한글 조합 입력(IME)', () => {
        /** CDP로 한글 조합을 흉내 낸다: 자모 조합 중 → 음절 확정 */
        async function compose(page: Page, syllables: [string, string][]) {
            const cdp = await page.context().newCDPSession(page);
            for (const [jamo, syllable] of syllables) {
                await cdp.send('Input.imeSetComposition', { text: jamo, selectionStart: 1, selectionEnd: 1 });
                await cdp.send('Input.imeSetComposition', { text: syllable, selectionStart: 1, selectionEnd: 1 });
                await cdp.send('Input.insertText', { text: syllable });
            }
            await cdp.detach();
        }
        const S: Record<string, [string, string]> = {
            가: ['ㄱ', '가'],
            나: ['ㄴ', '나'],
            다: ['ㄷ', '다'],
            라: ['ㄹ', '라'],
            마: ['ㅁ', '마'],
            바: ['ㅂ', '바'],
            사: ['ㅅ', '사'],
            아: ['ㅇ', '아'],
            자: ['ㅈ', '자'],
            차: ['ㅊ', '차'],
            카: ['ㅋ', '카'],
            타: ['ㅌ', '타'],
            파: ['ㅍ', '파'],
        };
        const word = (text: string) => [...text].map((c) => S[c]);

        test('1음절은 길이 오류', async ({ page }) => {
            await openOnboarding(page);
            await onboarding.input(page).focus();
            await compose(page, word('가'));
            await expect(onboarding.input(page)).toHaveValue('가');
            await see(page, LENGTH_ERROR);
            await expect(onboarding.input(page)).toHaveAttribute('aria-invalid', 'true');
            await expect(onboarding.check(page)).toBeDisabled();
        });

        test('2음절은 통과하고 그 값으로 확인한다', async ({ page }) => {
            await openOnboarding(page);
            await onboarding.input(page).focus();
            await compose(page, word('가나'));
            await expect(onboarding.input(page)).toHaveValue('가나');
            await expect(onboarding.input(page)).not.toHaveAttribute('aria-invalid', 'true');
            await expect(onboarding.check(page)).toBeEnabled();
            await onboarding.check(page).click();
            await see(page, onboarding.available);
            const calls = await backendCalls('GET', CHECK_PATH);
            expect(calls.map((c) => new URLSearchParams(c.search).get('nickname'))).toEqual(['가나']);
        });

        test('12음절은 통과, 13음절은 길이 오류', async ({ page }) => {
            await openOnboarding(page);
            await onboarding.input(page).focus();
            await compose(page, word('가나다라마바사아자차카타'));
            await expect(onboarding.input(page)).toHaveValue('가나다라마바사아자차카타');
            await expect(onboarding.check(page)).toBeEnabled();
            await compose(page, word('파'));
            await expect(onboarding.input(page)).toHaveValue('가나다라마바사아자차카타파');
            await see(page, LENGTH_ERROR);
            await expect(onboarding.check(page)).toBeDisabled();
        });

        test('조합이 끝나지 않은 자모는 형식 오류(확정 뒤 판단)', async ({ page }) => {
            await openOnboarding(page);
            await onboarding.input(page).focus();
            await compose(page, word('가'));
            const cdp = await page.context().newCDPSession(page);
            await cdp.send('Input.imeSetComposition', { text: 'ㄴ', selectionStart: 1, selectionEnd: 1 });
            await cdp.send('Input.insertText', { text: 'ㄴ' });
            await cdp.detach();
            await expect(onboarding.input(page)).toHaveValue('가ㄴ');
            await expect(onboarding.input(page)).toHaveAttribute('aria-invalid', 'true');
            await expect(onboarding.check(page)).toBeDisabled();
        });
    });
});

test.describe('5-4. 중복 확인은 형식이 맞을 때만, 누를 때만 요청', () => {
    test('입력만으로는 요청하지 않는다', async ({ page }) => {
        await openOnboarding(page);
        const input = onboarding.input(page);
        await input.pressSequentially('tester', { delay: 50 });
        await expect(onboarding.check(page)).toBeEnabled();
        await page.waitForTimeout(1500);
        await input.press('Tab');
        await page.waitForTimeout(500);
        expect(await backendCalls('GET', CHECK_PATH)).toEqual([]);
        await expect(page.getByText(onboarding.available)).toHaveCount(0);
        await expect(onboarding.start(page)).toBeDisabled();
    });

    test('확인 중에 다시 눌러도 요청은 한 번이다', async ({ page }) => {
        const held = await holdRequests(page, isCheck);
        await openOnboarding(page);
        await onboarding.input(page).fill('tester');
        await onboarding.check(page).click();
        await expect.poll(() => held.length).toBe(1);
        await onboarding.check(page).evaluate((el: HTMLElement) => el.click());
        await onboarding.check(page).evaluate((el: HTMLElement) => el.click());
        await page.waitForTimeout(500);
        expect(held.length, '확인 중 추가 요청').toBe(1);
        await expect(onboarding.start(page)).toBeDisabled();
        await held[0].release();
        await see(page, onboarding.available);
        expect(held.length).toBe(1);
        expect(await backendCalls('GET', CHECK_PATH)).toHaveLength(1);
    });

    test('키보드(Tab·Enter·Space)만으로 확인하고 시작할 수 있다', async ({ page }) => {
        await openOnboarding(page);
        await onboarding.input(page).focus();
        await page.keyboard.type('tester');
        const focusOn = async (target: Locator) => {
            for (let i = 0; i < 10; i++) {
                if (await target.evaluate((el) => el === document.activeElement)) return;
                await page.keyboard.press('Tab');
            }
            throw new Error('Tab으로 닿지 않음');
        };
        await focusOn(onboarding.check(page));
        await page.keyboard.press('Enter');
        await see(page, onboarding.available);
        await focusOn(onboarding.start(page));
        await page.keyboard.press('Space');
        await expectHome(page);
        expect(await backendCalls('PATCH', SAVE_PATH)).toHaveLength(1);
    });
});

test.describe('5-5. 중복 확인 결과', () => {
    test('사용 가능하면 안내가 전달되고 시작이 활성', async ({ page }) => {
        await openOnboarding(page);
        await onboarding.input(page).fill('tester');
        await onboarding.check(page).click();
        await expectAnnounced(page, onboarding.available);
        await expect(onboarding.start(page)).toBeEnabled();
    });

    test('중복이면 기존 문구가 전달되고 시작이 비활성', async ({ page }) => {
        await duplicate();
        await openOnboarding(page);
        await onboarding.input(page).fill('tester');
        await onboarding.check(page).click();
        await expectAnnounced(page, '이미 존재하는 닉네임 입니다.');
        await expect(page.getByText(onboarding.available)).toHaveCount(0);
        await expect(onboarding.start(page)).toBeDisabled();
    });

    for (const failure of [500, 503, 'drop'] as const) {
        test(`확인 요청 실패(${failure})면 실패 문구가 전달되고 시작이 비활성, 다시 확인할 수 있다`, async ({
            page,
        }) => {
            await resetWith({ failures: { [CHECK_PATH]: failure } });
            await openOnboarding(page);
            await onboarding.input(page).fill('tester');
            await onboarding.check(page).click();
            await expectAnnounced(page, '확인하지 못했어요. 다시 시도해주세요.');
            await expect(page.getByText(onboarding.available)).toHaveCount(0);
            await expect(onboarding.start(page)).toBeDisabled();
            await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);

            await resetWith();
            await expect(onboarding.check(page)).toBeEnabled();
            await onboarding.check(page).click();
            await see(page, onboarding.available);
            await expect(page.getByText('확인하지 못했어요. 다시 시도해주세요.')).toHaveCount(0);
            await expect(onboarding.start(page)).toBeEnabled();
        });
    }
});

test.describe('5-6. 값을 고치면 확인 전 상태, 늦게 온 응답은 무시', () => {
    for (const [name, edit] of [
        ['글자 추가', (l: Locator) => l.press('a')],
        ['글자 삭제', (l: Locator) => l.press('Backspace')],
        ['새 값', (l: Locator) => l.fill('other1')],
    ] as const) {
        test(`사용 가능 확인 뒤 ${name}`, async ({ page }) => {
            await openOnboarding(page);
            const input = onboarding.input(page);
            await input.fill('tester');
            await onboarding.check(page).click();
            await see(page, onboarding.available);
            await expect(onboarding.start(page)).toBeEnabled();
            await input.focus();
            await input.press('End');
            await edit(input);
            await expect(onboarding.start(page)).toBeDisabled();
            await expect(page.getByText(onboarding.available)).toHaveCount(0);
            await expect(onboarding.check(page)).toBeEnabled();
        });
    }

    test('중복 결과 뒤 값을 고치면 중복 문구가 사라진다', async ({ page }) => {
        await duplicate();
        await openOnboarding(page);
        const input = onboarding.input(page);
        await input.fill('tester');
        await onboarding.check(page).click();
        await see(page, '이미 존재하는 닉네임 입니다.');
        await input.fill('tester2');
        await expect(page.getByText('이미 존재하는 닉네임 입니다.')).toHaveCount(0);
        await expect(onboarding.start(page)).toBeDisabled();
        await expect(onboarding.check(page)).toBeEnabled();
    });

    test('확인 중에 값을 고치면 이전 값의 늦은 응답을 무시한다', async ({ page }) => {
        const held = await holdRequests(page, isCheck);
        await openOnboarding(page);
        const input = onboarding.input(page);
        await input.fill('tester1');
        await onboarding.check(page).click();
        await expect.poll(() => held.length).toBe(1);
        await input.fill('tester2');
        await held[0].release();
        await page.waitForTimeout(800);
        await expect(page.getByText(onboarding.available)).toHaveCount(0);
        await expect(onboarding.start(page)).toBeDisabled();
        await expect(onboarding.check(page)).toBeEnabled();
        expect(await backendCalls('PATCH', SAVE_PATH)).toEqual([]);
    });

    test('새 값의 결과가 먼저 오고 이전 값의 응답이 늦게 와도 새 값의 결과가 남는다', async ({ page }) => {
        const held = await holdRequests(page, isCheck);
        await openOnboarding(page);
        const input = onboarding.input(page);
        await input.fill('tester1');
        await onboarding.check(page).click();
        await expect.poll(() => held.length).toBe(1);
        await input.fill('tester2');
        await onboarding.check(page).click();
        await expect.poll(() => held.length).toBe(2);
        expect(held.map((h) => nicknameOf(h.request))).toEqual(['tester1', 'tester2']);

        await duplicate();
        await held[1].release();
        await see(page, '이미 존재하는 닉네임 입니다.');
        await resetWith();
        await held[0].release();
        await page.waitForTimeout(800);
        await see(page, '이미 존재하는 닉네임 입니다.');
        await expect(page.getByText(onboarding.available)).toHaveCount(0);
        await expect(onboarding.start(page)).toBeDisabled();
    });
});

test.describe('5-7. 저장', () => {
    const ready = async (page: Page) => {
        await openOnboarding(page);
        await onboarding.input(page).fill('tester');
        await onboarding.check(page).click();
        await see(page, onboarding.available);
    };

    test('저장 중에 다시 눌러도 저장 요청은 한 번이다', async ({ page }) => {
        const held = await holdRequests(page, isSave);
        await ready(page);
        await onboarding.start(page).click();
        await expect.poll(() => held.length).toBe(1);
        await onboarding.start(page).evaluate((el: HTMLElement) => el.click());
        await onboarding.start(page).evaluate((el: HTMLElement) => el.click());
        await onboarding.input(page).press('Enter').catch(() => undefined);
        await page.waitForTimeout(500);
        expect(held.length, '저장 중 추가 요청').toBe(1);
        await held[0].release();
        await expectHome(page);
        expect(held.length).toBe(1);
        const saved = await backendCalls('PATCH', SAVE_PATH);
        expect(saved.map((c) => c.body)).toEqual([{ nickname: 'tester' }]);
    });

    test('409면 사용 중 안내가 전달되고 화면에 머문다', async ({ page }) => {
        await resetWith({ failures: { [SAVE_PATH]: 409 } });
        await ready(page);
        await onboarding.start(page).click();
        await expectAnnounced(page, '이미 사용 중인 닉네임입니다.');
        await page.waitForTimeout(300);
        await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
        expect(await backendCalls('PATCH', SAVE_PATH)).toHaveLength(1);
    });

    for (const failure of [500, 400, 'drop'] as const) {
        test(`그 외 실패(${failure})면 실패 안내가 alert로 전달되고 화면에 머문다`, async ({ page }) => {
            await resetWith({ failures: { [SAVE_PATH]: failure } });
            await ready(page);
            await onboarding.start(page).click();
            await expect(
                page.getByRole('alert').filter({ hasText: '닉네임 저장에 실패했습니다. 다시 시도해 주세요.' }).first(),
            ).toBeVisible();
            await page.waitForTimeout(300);
            await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
            await expect(onboarding.input(page)).toHaveValue('tester');
            expect(await backendCalls('PATCH', SAVE_PATH)).toHaveLength(1);
        });
    }

    test('브라우저 연결이 끊겨도 실패 안내가 alert로 전달되고 화면에 머문다', async ({ page }) => {
        await ready(page);
        await page.route(
            (url) => url.origin === BROWSER_URL,
            (route) => (isSave(route.request()) ? route.abort('failed') : route.fallback()),
        );
        await onboarding.start(page).click();
        await expect(
            page.getByRole('alert').filter({ hasText: '닉네임 저장에 실패했습니다. 다시 시도해 주세요.' }).first(),
        ).toBeVisible();
        await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
    });
});

test.describe('5-8. 저장 뒤 이동', () => {
    test('초대 경로가 없으면 /로 간다', async ({ page, context }) => {
        await openOnboarding(page);
        await completeOnboarding(page);
        await expectHome(page);
        expect((await context.cookies()).map((c) => c.name)).not.toContain('auth_redirect');
    });

    test('초대 경로가 있으면 그곳으로 가고 초대 쿠키를 지운다', async ({ page, context }) => {
        await context.addCookies([
            {
                name: 'auth_redirect',
                value: encodeURIComponent('/?joinStudy=study-1'),
                url: BROWSER_URL,
            },
        ]);
        await openOnboarding(page);
        await completeOnboarding(page);
        await expectHome(page, '?joinStudy=study-1');
        await expect(inviteDialog(page)).toBeVisible();
        expect((await context.cookies()).map((c) => c.name)).not.toContain('auth_redirect');
    });
});

test.describe('5-9. Enter와 보조기기 전달', () => {
    test('확인 전에 Enter를 누르면 저장하지 않는다', async ({ page }) => {
        await openOnboarding(page);
        const input = onboarding.input(page);
        await input.fill('tester');
        await input.press('Enter');
        await page.waitForTimeout(800);
        expect(await backendCalls('PATCH', SAVE_PATH)).toEqual([]);
        await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
    });

    test('형식 오류에서 Enter를 눌러도 아무 요청도 하지 않는다', async ({ page }) => {
        await openOnboarding(page);
        const input = onboarding.input(page);
        await input.fill('가');
        await input.press('Enter');
        await page.waitForTimeout(800);
        expect(await backendCalls('PATCH', SAVE_PATH)).toEqual([]);
        expect(await backendCalls('GET', CHECK_PATH)).toEqual([]);
        await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
    });

    test('확인 뒤 값을 고치고 Enter를 누르면 저장하지 않는다', async ({ page }) => {
        await openOnboarding(page);
        const input = onboarding.input(page);
        await input.fill('tester');
        await onboarding.check(page).click();
        await see(page, onboarding.available);
        await input.fill('tester9');
        await input.press('Enter');
        await page.waitForTimeout(800);
        expect(await backendCalls('PATCH', SAVE_PATH)).toEqual([]);
        await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
    });
});

test.describe('포커스. 입력칸은 포커스만으로 테두리·outline·box-shadow가 바뀌지 않는다', () => {
    // 팀장 결정(2026-11-26, 질문 3=A). 상태(빈 값·오류·사용 가능·중복)는 같게 두고 포커스 여부만 바꿔 비교한다.
    // 상태에 따른 테두리 색 변화는 허용한다. 브라우저 기본 링은 허용하고 그 색은 같은 실행에서 읽는다.
    const states: [string, (page: Page) => Promise<void>][] = [
        ['빈 값', async () => undefined],
        ['길이 오류', async (page) => {
            await onboarding.input(page).fill('가');
            await see(page, LENGTH_ERROR);
        }],
        ['형식 오류', async (page) => {
            await onboarding.input(page).fill('가 나');
            await expect(onboarding.input(page)).toHaveAttribute('aria-invalid', 'true');
        }],
        ['사용 가능', async (page) => {
            await onboarding.input(page).fill('tester');
            await onboarding.check(page).click();
            await see(page, onboarding.available);
        }],
        ['중복', async (page) => {
            await duplicate();
            await onboarding.input(page).fill('tester');
            await onboarding.check(page).click();
            await see(page, '이미 존재하는 닉네임 입니다.');
        }],
    ];
    for (const [name, arrange] of states) {
        test(name, async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 800 });
            await openOnboarding(page);
            await arrange(page);
            await page.keyboard.press('Shift');
            const ring = await uaRingColor(page);
            const input = await onboarding.input(page).elementHandle();
            const handle = must(input, '입력칸') as ElementHandle<HTMLElement>;
            const read = async (how: string, focus: () => Promise<void>) => {
                await handle.evaluate((el) => el.blur());
                await page.mouse.move(0, 0);
                const blurred = await focusStyle(handle);
                await focus();
                await page.mouse.move(0, 0);
                const focused = await focusStyle(handle);
                return { how, blurred, focused, problems: focusProblems(focused, blurred, ring) };
            };
            const results = [
                await read('클릭', () => onboarding.input(page).click()),
                await read('키보드', async () => {
                    await page.keyboard.press('Shift');
                    await handle.focus();
                }),
            ];
            expect(results.filter((r) => r.problems.length > 0), JSON.stringify(results, null, 1)).toEqual([]);
        });
    }
});

test.describe('5-10. 온보딩 화면 폭: 가로 스크롤 없음', () => {
    for (const width of WIDTHS) {
        test(`처음 상태 ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 640 });
            await openOnboarding(page);
            await page.evaluate(() => document.fonts.ready.then(() => undefined));
            await expectFits(page, [onboarding.check(page), onboarding.start(page)]);
        });
    }

    for (const width of [320, 360]) {
        test(`오류·결과 문구가 있을 때 ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 640 });
            await resetWith({ failures: { [CHECK_PATH]: 500 } });
            await openOnboarding(page);
            await onboarding.input(page).fill('가나다라마바사아자차카타파');
            await see(page, LENGTH_ERROR);
            await expectFits(page, [onboarding.check(page), onboarding.start(page)]);
            await onboarding.input(page).fill('가나다라마바사아자차카타');
            await onboarding.check(page).click();
            await see(page, '확인하지 못했어요. 다시 시도해주세요.');
            await expectFits(page, [onboarding.check(page), onboarding.start(page)]);
        });
    }
});

test.describe('5-11. 마이페이지 닉네임 수정도 2~12자', () => {
    const openEditor = async (page: Page) => {
        await signIn(page.context());
        await page.goto('/mypage');
        await page.getByRole('button', { name: '변경', exact: true }).click();
        return page.getByRole('textbox');
    };
    const save = (page: Page) => page.getByRole('button', { name: '저장', exact: true });

    for (const value of ['가나다라마바사아자차카타', 'abcdefghijkl', 'abcdefghijk']) {
        test(`${value.length}자 "${value}"는 저장할 수 있다`, async ({ page }) => {
            const input = await openEditor(page);
            await input.fill(value);
            await expect(input).toHaveValue(value);
            await expect(save(page)).toBeEnabled();
            await save(page).click();
            await expect.poll(async () => (await backendCalls('PATCH', SAVE_PATH)).map((c) => c.body)).toEqual([
                { nickname: value },
            ]);
        });
    }

    for (const value of ['가', '가나다라마바사아자차카타파', 'abcdefghijklm']) {
        test(`${value.length}자 "${value}"는 저장할 수 없다`, async ({ page }) => {
            const input = await openEditor(page);
            await input.fill(value);
            await page.waitForTimeout(800);
            const actual = await input.inputValue();
            // 13자는 입력 자체를 막아도 된다. 막지 않았다면 저장이 비활성이어야 한다.
            if (actual.length >= 2 && actual.length <= 12) {
                expect(value.length).toBe(13);
            } else {
                await expect(save(page)).toBeDisabled();
            }
            if (await save(page).isEnabled()) await save(page).click();
            await page.waitForTimeout(300);
            const saved = await backendCalls('PATCH', SAVE_PATH);
            expect(saved.filter((c) => {
                const n = (c.body as { nickname?: string }).nickname ?? '';
                return n.length < 2 || n.length > 12;
            })).toEqual([]);
        });
    }

    test('안내 문구에 옛 길이(2~10자)가 남지 않는다', async ({ page }) => {
        const input = await openEditor(page);
        await input.fill('가');
        await page.waitForTimeout(500);
        await expect(page.getByText(/2~10자/)).toHaveCount(0);
    });
});
