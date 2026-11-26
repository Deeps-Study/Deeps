import type { Page } from '@playwright/test';
import { expect } from './browser';
import { BROWSER_URL } from './env';
import { resetFakes, type FakeState } from './fakes';

/** 화면 비교용 고정 데이터(가짜) */
export const study = {
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

export const fakeState: Partial<FakeState> = {
    codes: {
        'code-existing': {
            accessToken: 'access-tokens',
            refreshToken: 'refresh-tokens',
            nickname: 'tester',
            isNewUser: false,
        },
        'code-new': {
            accessToken: 'access-tokens',
            refreshToken: 'refresh-tokens',
            nickname: null,
            isNewUser: true,
        },
    },
    accessTokens: ['access-tokens'],
    studies: [study],
    user: {
        id: 'user-1',
        nickname: 'tester',
        image: null,
        accounts: [{ provider: 'google', email: 'tester@example.com' }],
        attendance: [],
    },
};

/** 날짜에 따라 바뀌는 화면(달력 등)을 고정한다. */
export const FIXED_TIME = new Date('2030-03-15T10:00:00+09:00');

export interface Screen {
    name: string;
    open: (page: Page) => Promise<void>;
}

async function logIn(page: Page) {
    await page.goto('/auth/callback?code=code-existing');
    await expect(page).toHaveURL(new RegExp(`^${BROWSER_URL}/(home)?$`));
}

/** 기존 화면 목록. 주소 변경(2단계) 전 기준이다. */
export const screens: Screen[] = [
    {
        name: '로그인',
        open: async (page) => {
            await page.goto('/login');
            await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
        },
    },
    {
        name: '로그인 실패',
        open: async (page) => {
            await page.goto('/auth/callback?code=code-rejected');
            await expect(page).toHaveURL(/\/login\?/);
            await expect(page.getByText('로그인에 실패했어요. 다시 시도해 주세요.')).toBeVisible();
        },
    },
    {
        name: '닉네임',
        open: async (page) => {
            await page.goto('/auth/callback?code=code-new');
            await expect(page).toHaveURL(/\/(nickname|onboarding)$/);
            await expect(page.getByRole('textbox')).toBeVisible();
        },
    },
    {
        name: '홈',
        open: async (page) => {
            await logIn(page);
            await expect(page.getByText(study.title)).toBeVisible();
        },
    },
    {
        name: '마이페이지',
        open: async (page) => {
            await logIn(page);
            await expect(page.getByText(study.title)).toBeVisible();
            await page.goto('/mypage');
            await expect(page.getByText('tester').first()).toBeVisible();
        },
    },
];

export async function prepare(page: Page, extra: Partial<FakeState> = {}) {
    await resetFakes({ ...fakeState, ...extra });
    await page.clock.setFixedTime(FIXED_TIME);
    await page.emulateMedia({ reducedMotion: 'reduce' });
}

/** 화면이 멈출 때까지(글꼴·네트워크) 기다린다. */
export async function settle(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.waitForTimeout(300);
}

/** 보이는 모든 요소의 계산된 색을 DOM 순서대로 모은다. 글꼴·크기는 보지 않는다. */
export function collectColors(page: Page): Promise<Record<string, Record<string, string>>> {
    return page.evaluate(() => {
        const skip = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'TITLE']);
        const pathOf = (el: Element) => {
            const parts: string[] = [];
            for (let e: Element | null = el; e; e = e.parentElement) {
                const parent: Element | null = e.parentElement;
                const tag = e.tagName;
                const index = parent ? [...parent.children].filter((c) => c.tagName === tag).indexOf(e) + 1 : 1;
                parts.unshift(`${tag.toLowerCase()}[${index}]`);
            }
            return parts.join('>');
        };
        const out: Record<string, Record<string, string>> = {};
        for (const el of document.querySelectorAll('*')) {
            if (skip.has(el.tagName) || el.closest('head')) continue;
            const s = getComputedStyle(el);
            if (s.display === 'none' || s.visibility === 'hidden') continue;
            const v: Record<string, string> = {
                color: s.color,
                backgroundColor: s.backgroundColor,
            };
            if (s.backgroundImage !== 'none') v.backgroundImage = s.backgroundImage;
            for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
                const width = s.getPropertyValue(`border-${side.toLowerCase()}-width`);
                const style = s.getPropertyValue(`border-${side.toLowerCase()}-style`);
                if (style !== 'none' && parseFloat(width) > 0) {
                    v[`border${side}Color`] = s.getPropertyValue(`border-${side.toLowerCase()}-color`);
                }
            }
            if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) v.outlineColor = s.outlineColor;
            if (s.boxShadow !== 'none') v.boxShadow = s.boxShadow;
            if (s.textDecorationLine !== 'none') v.textDecorationColor = s.textDecorationColor;
            if (el instanceof SVGElement) {
                v.fill = s.fill;
                v.stroke = s.stroke;
            }
            out[pathOf(el)] = v;
        }
        return out;
    });
}

/** 편집기가 있는 화면(딥스 생성·풀이). 가짜 딥스 응답이 필요하다. */
const deeps = {
    id: 'deeps-1',
    title: '가짜 문제: 이진 탐색을 설명하세요',
    description: '<p>가짜 설명 본문</p>',
    durationSeconds: 7200,
    // FIXED_TIME(브라우저 시계) 기준 1시간 전 출제, 1시간 남음
    createdAt: '2030-03-15T00:00:00.000Z',
    expiredAt: '2030-03-15T02:00:00.000Z',
    hint: '가짜 힌트',
    myAnswerStatus: 'NOT_SUBMITTED',
    isCreatedByMe: false,
    hasAnswers: false,
    creator: { nickname: '가짜출제자' },
    explanation: null,
};

/** 가짜 서버의 기존 형식을 쓴다: responses(GET 경로 -> 200 본문), failures(경로 -> 상태 코드). */
export const editorState: Partial<FakeState> = {
    responses: {
        '/studies/study-1': { ...study, isHost: false },
        '/studies/study-1/deeps/deeps-1': deeps,
        '/studies/study-1/deeps/deeps-1/answers': [],
    },
    failures: { '/studies/study-1/deeps/deeps-1/answers/me': 404 },
};

export const editorScreens: Screen[] = [
    {
        name: '딥스 생성',
        open: async (page) => {
            await logIn(page);
            await page.goto('/deepsCreator/study-1');
            await expect(page.getByRole('button', { name: 'Write' }).first()).toBeVisible();
        },
    },
    {
        name: '딥스 풀이',
        open: async (page) => {
            await logIn(page);
            await page.goto('/deepsDetail/study-1/deeps-1');
            await expect(page.getByRole('button', { name: 'Write' }).first()).toBeVisible();
        },
    },
];
