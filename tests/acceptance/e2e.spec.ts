import type { Page } from '@playwright/test';
import { test, expect } from './support/browser';
import { BACKEND_URL, BROWSER_URL } from './support/env';
import { readFakes, resetFakes, type FakeState } from './support/fakes';

const study = {
    id: 'study-1',
    title: '가짜 알고리즘 스터디',
    status: 'IN_PROGRESS',
    startDate: '2030-01-01',
    endDate: '2030-12-31',
    currentMemberCount: 2,
    maxMemberCount: 4,
    tags: ['fake'],
    hasPassword: false,
};

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
    accessTokens: ['access-e2e'],
    studies: [study],
    user: {
        id: 'user-1',
        nickname: 'tester',
        image: null,
        accounts: [{ provider: 'google', email: 'tester@example.com' }],
        attendance: [],
    },
};

const heading = '현재 진행중인 스터디를 확인하세요!';

async function logIn(page: Page) {
    await page.goto('/auth/callback?code=code-existing');
    await expect(page).toHaveURL(`${BROWSER_URL}/`);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
}

test.beforeEach(async () => {
    await resetFakes(login);
});

for (const path of ['/', '/home']) {
    test(`비로그인으로 ${path}에 가면 /login으로 이동한다`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveURL(`${BROWSER_URL}/login`);
        expect((await readFakes()).calls).toEqual([]);
    });
}

test('로그인 버튼이 백엔드 OAuth를 시작한다', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Google 계정으로 로그인' }).click();
    await expect(
        page.getByRole('heading', { name: 'fake oauth start' }),
    ).toBeVisible();
    const url = new URL(page.url());
    expect(url.origin + url.pathname).toBe(`${BACKEND_URL}/auth/google`);
    const { calls } = await readFakes();
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
        'GET /auth/google',
    ]);
});

test('콜백 성공(기존 사용자): /에 스터디가 보인다', async ({ page }) => {
    await logIn(page);
    await expect(page.getByText(study.title)).toBeVisible();
    const { calls } = await readFakes();
    expect(calls[0]).toMatchObject({
        method: 'POST',
        path: '/auth/exchange',
        body: { code: 'code-existing' },
    });
    expect(
        calls.find((c) => c.path === '/studies/me')?.authorization,
    ).toBe('Bearer access-e2e');
});

test('콜백 성공(신규 사용자): /onboarding으로 이동한다', async ({ page }) => {
    await page.goto('/auth/callback?code=code-new');
    await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
    await expect(page.getByPlaceholder('닉네임을 입력해주세요.')).toBeVisible();
});

for (const [name, query] of [
    ['백엔드가 거부', '?code=code-rejected'],
    ['code 없음', ''],
]) {
    test(`콜백 실패(${name}): 로그인 실패 문구가 보인다`, async ({ page }) => {
        await page.goto(`/auth/callback${query}`);
        await expect(page).toHaveURL(/\/login\?/);
        await expect(
            page.getByText('로그인에 실패했어요. 다시 시도해 주세요.'),
        ).toBeVisible();
        const cookies = await page.context().cookies();
        expect(cookies.map((c) => c.name)).not.toContain('refresh_token');
    });
}

test('스터디를 만들면 /에 나타난다', async ({ page }) => {
    await logIn(page);
    await expect(page.getByText(study.title)).toBeVisible();

    await page
        .getByRole('banner')
        .getByRole('button', { name: '딥스터디 만들기' })
        .click();
    await page
        .getByPlaceholder('스터디 제목을 입력해주세요')
        .fill('새로 만든 가짜 스터디');
    await page.getByRole('button', { name: '날짜를 선택해 주세요' }).click();
    await page.getByRole('button', { name: '›' }).click();
    await page.getByRole('button', { name: '10', exact: true }).click();
    await page.getByRole('button', { name: '12', exact: true }).click();
    await page.getByRole('button', { name: '4명', exact: true }).click();
    const tagInput = page.getByPlaceholder('태그 입력 후 엔터 (클릭 시 삭제)');
    await tagInput.fill('faketag');
    await tagInput.press('Enter');
    await page.getByRole('button', { name: '확인', exact: true }).click();

    await expect(
        page.getByRole('heading', { name: '딥스터디 만들기' }),
    ).toBeHidden();
    await expect(page.getByText('새로 만든 가짜 스터디')).toBeVisible();
    await expect(page.getByText(study.title)).toBeVisible();

    const { calls } = await readFakes();
    const created = calls.filter((c) => c.method === 'POST' && c.path === '/studies');
    expect(created).toHaveLength(1);
    expect(created[0].authorization).toBe('Bearer access-e2e');
    expect(created[0].body).toMatchObject({
        title: '새로 만든 가짜 스터디',
        startDate: expect.stringMatching(/^\d{4}-\d{2}-10$/),
        endDate: expect.stringMatching(/^\d{4}-\d{2}-12$/),
        maxMemberCount: 4,
        tags: ['faketag'],
    });
});

test('로그아웃하면 /에 갈 수 없다', async ({ page }) => {
    await logIn(page);
    await page.goto('/mypage');
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(`${BROWSER_URL}/login`);

    for (const path of ['/', '/home']) {
        await page.goto(path);
        await expect(page).toHaveURL(`${BROWSER_URL}/login`);
    }
    const { calls } = await readFakes();
    expect(calls.filter((c) => c.path === '/auth/logout')).toHaveLength(1);
});
