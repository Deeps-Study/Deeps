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

export async function prepare(page: Page) {
    await resetFakes(fakeState);
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
