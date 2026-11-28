import type { Page } from '@playwright/test';
import { test, expect } from './support/browser';
import { APP_URL, BROWSER_URL } from './support/env';
import { readFakes, resetFakes, type FakeState } from './support/fakes';
import { completeOnboarding, onboarding } from './support/onboarding';

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

const fakes = (isHost = false): Partial<FakeState> => ({
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
    responses: {
        '/studies/study-1': { ...study, isHost },
        '/studies/study-1/preview': study,
        '/studies/study-1/members': [
            {
                id: 'user-1',
                nickname: 'tester',
                profileImageUrl: '',
                isHost,
                totalLikesReceived: 0,
                activityLogs: [],
            },
        ],
        '/studies/study-1/deeps': [],
    },
});

const setSession = (page: Page, token: string) =>
    page
        .context()
        .addCookies([{ name: 'refresh_token', value: token, url: BROWSER_URL }]);
const signIn = (page: Page) => setSession(page, 'refresh-e2e');

async function expectHome(page: Page, search = '') {
    await expect(page).toHaveURL(`${BROWSER_URL}/${search}`);
    await expect(
        page.getByRole('heading', { name: '현재 진행중인 스터디를 확인하세요!' }),
    ).toBeVisible();
}

async function expectInvite(page: Page) {
    await expect(
        page.getByRole('heading', { name: study.title, level: 2 }),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: '입장', exact: true }),
    ).toBeVisible();
}

/** 옛 주소 /home을 거치면 기록한다. */
function watchOldHome(page: Page) {
    const seen: string[] = [];
    page.on('request', (request) => {
        const { origin, pathname } = new URL(request.url());
        if (origin === BROWSER_URL && pathname === '/home') {
            seen.push(request.url());
        }
    });
    return seen;
}

test.beforeEach(async () => {
    await resetFakes(fakes());
});

test.describe('주소', () => {
    test('로그인 상태의 /는 이동 없이 홈이다', async ({ page, request }) => {
        const res = await request.get(`${APP_URL}/`, {
            headers: { Cookie: 'refresh_token=refresh-e2e' },
            maxRedirects: 0,
        });
        expect(res.status()).toBe(200);

        await signIn(page);
        const old = watchOldHome(page);
        await page.goto('/');
        await expectHome(page);
        expect(old).toEqual([]);
    });

    for (const path of ['/', '/home']) {
        test(`거부된 세션으로 ${path}에 가면 /login이다`, async ({ page }) => {
            await setSession(page, 'refresh-rejected');
            await page.goto(path);
            await expect(page).toHaveURL(`${BROWSER_URL}/login`);
        });
    }

    for (const search of [
        '',
        '?joinStudy=1',
        '?joinStudy=1&from=link',
        '?tag=a&tag=b',
        '?q=a%26b%3Dc&name=%ED%95%9C%EA%B8%80',
        '?next=%2F%2Fexternal.test',
        '?next=https://external.test/',
    ]) {
        test(`/home${search}은 쿼리를 유지해 /로 이동한다`, async ({
            page,
            blockedUrls,
        }) => {
            await signIn(page);
            await page.goto(`/home${search}`);
            await expect(page).toHaveURL(
                (url) => url.origin === BROWSER_URL && url.pathname === '/',
            );
            expect([...new URL(page.url()).searchParams]).toEqual([
                ...new URLSearchParams(search),
            ]);
            expect(blockedUrls.filter((u) => u.includes('external'))).toEqual([]);
        });
    }

    test('/nickname은 /onboarding으로 이동한다', async ({ page }) => {
        await signIn(page);
        await page.goto('/nickname');
        await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
        await expect(onboarding.input(page)).toBeVisible();
    });

    for (const path of ['/onboarding', '/nickname']) {
        test(`비로그인으로 ${path}에 가면 /login이다`, async ({ page }) => {
            await page.goto(path);
            await expect(page).toHaveURL(`${BROWSER_URL}/login`);
        });
    }

    for (const path of [
        '/none',
        '/none/deep',
        '/index',
        '/homes',
        '/home/none',
        '/nickname/none',
        '/onboarding/none',
        '/login/none',
        '/study/study-1/none',
        '/api/none',
    ]) {
        for (const isSignedIn of [true, false]) {
            const who = isSignedIn ? '로그인' : '비로그인';
            test(`없는 주소는 404(${who}): ${path}`, async ({ request }) => {
                const res = await request.get(APP_URL + path, {
                    headers: isSignedIn
                        ? { Cookie: 'refresh_token=refresh-e2e' }
                        : undefined,
                    maxRedirects: 0,
                });
                expect(res.status()).toBe(404);
            });
        }
    }
});

test.describe('초대 링크', () => {
    const invites = ['/?joinStudy=study-1', '/home?joinStudy=study-1'];

    test('복사한 링크는 /?joinStudy=이고 초대 창이 열린다', async ({
        page,
        context,
    }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await signIn(page);
        await page.goto('/study/study-1');
        await page.getByRole('button', { name: '스터디 링크 복사' }).click();
        await expect(
            page.getByText('초대 링크가 클립보드에 복사되었습니다!'),
        ).toBeVisible();
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        expect(copied).toBe(`${BROWSER_URL}/?joinStudy=study-1`);

        await page.goto(copied);
        await expectHome(page, '?joinStudy=study-1');
        await expectInvite(page);
    });

    for (const invite of invites) {
        test(`로그인 상태에서 초대 창이 열린다: ${invite}`, async ({ page }) => {
            await signIn(page);
            await page.goto(invite);
            await expectHome(page, '?joinStudy=study-1');
            await expectInvite(page);
        });

        for (const session of ['없음', '거부됨']) {
            const start = async (page: Page) => {
                if (session === '거부됨') await setSession(page, 'refresh-rejected');
                await page.goto(invite);
                await expect(
                    page.getByRole('heading', { name: study.title }),
                ).toBeHidden();
                await expect(page).toHaveURL(
                    (url) =>
                        url.origin === BROWSER_URL && url.pathname === '/login',
                );
                await page
                    .getByRole('button', { name: 'Google로 계속하기', exact: true })
                    .click();
                await expect(
                    page.getByRole('heading', { name: 'fake oauth start' }),
                ).toBeVisible();
            };

            test(`기존 사용자가 로그인하면 초대 창이 열린다(세션 ${session}): ${invite}`, async ({
                page,
            }) => {
                await start(page);
                await page.goto('/auth/callback?code=code-existing');
                await expectHome(page, '?joinStudy=study-1');
                await expectInvite(page);
            });

            test(`신규 사용자가 온보딩하면 초대 창이 열린다(세션 ${session}): ${invite}`, async ({
                page,
            }) => {
                await start(page);
                await page.goto('/auth/callback?code=code-new');
                await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
                await completeOnboarding(page, 'tester');
                await expectHome(page, '?joinStudy=study-1');
                await expectInvite(page);
            });
        }
    }

    test('초대 창에서 로그인을 눌러도 돌아와 초대 창이 열린다', async ({ page }) => {
        await resetFakes({ ...fakes(), failures: { '/users/me': 500 } });
        await signIn(page);
        await page.goto('/?joinStudy=study-1');
        await page.getByRole('button', { name: '로그인', exact: true }).click();
        await expect(page).toHaveURL(
            (url) => url.origin === BROWSER_URL && url.pathname === '/login',
        );
        await resetFakes(fakes());
        await page.getByRole('button', { name: 'Google로 계속하기', exact: true }).click();
        await expect(
            page.getByRole('heading', { name: 'fake oauth start' }),
        ).toBeVisible();
        await page.goto('/auth/callback?code=code-existing');
        await expectHome(page, '?joinStudy=study-1');
        await expectInvite(page);
    });

    test('초대 값이 외부 주소여도 로그인 뒤 사이트 안에 머문다', async ({
        page,
        blockedUrls,
    }) => {
        await page.goto('/?joinStudy=//external.test&next=https://external.test');
        await page.getByRole('button', { name: 'Google로 계속하기', exact: true }).click();
        await expect(
            page.getByRole('heading', { name: 'fake oauth start' }),
        ).toBeVisible();
        await page.goto('/auth/callback?code=code-existing');
        await expect(page).toHaveURL(
            (url) => url.origin === BROWSER_URL && url.pathname === '/',
        );
        expect(blockedUrls.filter((u) => u.includes('external'))).toEqual([]);
    });

    test('취소하면 쿼리 없는 /이고 초대 창이 닫힌다', async ({ page }) => {
        await signIn(page);
        await page.goto('/?joinStudy=study-1');
        await expectInvite(page);
        const old = watchOldHome(page);
        await page.getByRole('button', { name: '취소', exact: true }).click();
        await expectHome(page);
        await expect(
            page.getByRole('heading', { name: study.title, level: 2 }),
        ).toBeHidden();
        expect(old).toEqual([]);
    });

    test('입장하면 스터디로 간다', async ({ page }) => {
        await signIn(page);
        await page.goto('/?joinStudy=study-1');
        await page.getByRole('button', { name: '입장', exact: true }).click();
        await expect(page).toHaveURL(`${BROWSER_URL}/study/study-1`);
        const { calls } = await readFakes();
        expect(
            calls.filter(
                (c) => c.method === 'POST' && c.path === '/studies/study-1/members',
            ),
        ).toHaveLength(1);
    });
});

test('온보딩 뒤 저장된 경로가 없으면 /로 간다', async ({ page }) => {
    const old = watchOldHome(page);
    await page.goto('/auth/callback?code=code-new');
    await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
    await completeOnboarding(page, 'tester');
    await expectHome(page);
    expect(old).toEqual([]);
});

test.describe('홈 이동은 옛 주소를 거치지 않고 /로 간다', () => {
    // 3단계(2026-11-25 결정): 헤더 로고는 글자 "Deeps", 마이페이지에도 같은 헤더가 있다.
    for (const path of ['/', '/study/study-1', '/mypage']) {
        test(`로고: ${path}`, async ({ page }) => {
            await signIn(page);
            const old = watchOldHome(page);
            await page.goto(path);
            const logo = page
                .getByRole('banner')
                .getByRole('link', { name: 'Deeps', exact: true });
            await expect(logo).toHaveAttribute('href', '/');
            await logo.click();
            await expectHome(page);
            expect(old).toEqual([]);
        });
    }

    // 3단계: 마이페이지도 공통 헤더·메뉴를 쓴다. 옛 마이페이지 헤더의 뒤로 가기 버튼 대신 메뉴 "홈"으로 본다.
    test('마이페이지에서 메뉴 "홈"', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await signIn(page);
        const old = watchOldHome(page);
        await page.goto('/');
        await page.getByRole('banner').getByRole('link', { name: /tester/ }).click();
        await expect(page).toHaveURL(`${BROWSER_URL}/mypage`);
        await page
            .getByRole('navigation')
            .getByRole('link', { name: '홈', exact: true })
            .filter({ visible: true })
            .click();
        await expectHome(page);
        expect(old).toEqual([]);
    });

    for (const [name, isHost, open, confirm, call] of [
        ['나가기', false, '스터디 나가기', '확인', '/studies/study-1/members/me'],
        ['삭제', true, '스터디 삭제', '삭제', '/studies/study-1'],
    ] as const) {
        test(`스터디 ${name}`, async ({ page }) => {
            await resetFakes(fakes(isHost));
            await signIn(page);
            const old = watchOldHome(page);
            await page.goto('/study/study-1');
            await page.getByRole('button', { name: open, exact: true }).click();
            await page.getByRole('button', { name: confirm, exact: true }).click();
            await expectHome(page);
            expect(old).toEqual([]);
            const { calls } = await readFakes();
            expect(
                calls.filter((c) => c.method === 'DELETE').map((c) => c.path),
            ).toEqual([call]);
        });
    }

    for (const [status, title] of [
        [403, '접근 제한'],
        [404, '조회 실패'],
    ] as const) {
        test(`스터디 조회 오류(${status}) 확인`, async ({ page }) => {
            await resetFakes({ ...fakes(), failures: { '/studies/study-1': status } });
            await signIn(page);
            const old = watchOldHome(page);
            await page.goto('/study/study-1');
            await expect(page.getByRole('heading', { name: title })).toBeVisible();
            await page.getByRole('button', { name: '확인', exact: true }).click();
            await expectHome(page);
            expect(old).toEqual([]);
        });
    }
});

// PM 변경(화면 확인): 딥스 생성의 뒤로 가기는 홈이 아니라 그 스터디로 간다.
test.describe('딥스 생성 화면의 뒤로 가기는 그 스터디로 간다', () => {
    for (const id of ['study-1', 'study-2']) {
        test(id, async ({ page }) => {
            const title = `가짜 스터디 ${id}`;
            const base = fakes();
            const target = { ...study, id, title, isHost: false };
            await resetFakes({
                ...base,
                responses: {
                    ...base.responses,
                    [`/studies/${id}`]: target,
                    [`/studies/${id}/members`]: [],
                    [`/studies/${id}/deeps`]: [],
                },
            });
            await signIn(page);
            await page.goto(`/deepsCreator/${id}`);
            await expect(
                page.getByPlaceholder('딥스 제목을 입력해주세요'),
            ).toBeVisible();

            const visited: string[] = [];
            page.on('framenavigated', (frame) => {
                if (frame === page.mainFrame()) visited.push(frame.url());
            });
            await page.getByRole('link', { name: '딥스 생성하기' }).click();

            await expect(page).toHaveURL(`${BROWSER_URL}/study/${id}`);
            await expect(
                page.getByRole('heading', { name: title, level: 1 }),
            ).toBeVisible();
            await expect(
                page.getByRole('button', { name: '스터디 링크 복사' }),
            ).toBeVisible();
            // 홈(/, /home)을 거치지 않는다.
            expect(
                visited.map((url) => new URL(url).pathname),
            ).toEqual(visited.map(() => `/study/${id}`));
        });
    }
});
