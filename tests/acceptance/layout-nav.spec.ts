// 이슈 #152 3단계: 헤더와 사이드 네비게이션 인수 테스트
//
// 근거: 이슈 #152 "3. 헤더와 사이드 네비게이션" 완료 조건, docs/decisions.md 2026-11-25~26.
// - 로고는 글자 "Deeps", 메뉴는 홈만(탐색·내 학습 없음), 코인·퀘스트 없음
// - 사이드바 접힘 76px / 펼침 240px, 헤더 72px(좁은 폭 56px)
// - 접기 버튼과 메뉴 모두 44px 칸·아이콘 20px·왼쪽 여백 16px, 아이콘 가로 중심 38px(오차 1px)
// - 스터디 만들기·나가기는 각 화면 본문 상단
// - 홈·스터디·마이페이지에 적용(출제·풀이 화면은 범위 밖), 320px 가로 넘침은 3단계에서 해결
//
// QA가 정한 값(팀장 확인 필요):
// - 넓은 폭(사이드바)은 1024px 이상(Tailwind lg), 좁은 폭(서랍)은 1023px 이하.
//   헤더 높이의 좁은 폭(56px) 기준도 같은 경계로 본다.
// - 접기/펼치기 버튼과 모바일 메뉴 버튼은 "aria-expanded가 있는 보이는 버튼"으로 찾는다.
//   이름은 정하지 않고, 비어 있지 않은 접근 가능한 이름만 요구한다.
// - "메뉴 이름이 보인다"는 문서 안의 글자 "홈"이 실제로 그려지는지(크기, 잘림, 투명도, 화면 안)로 본다.
//   title 속성의 브라우저 기본 말풍선은 키보드 포커스에서 뜨지 않으므로 인정하지 않는다.
// - 포커스 모양(테두리 등)은 검사하지 않는다(2026-11-26 PM 결정: 포커스 표시는 UI 개편 뒤에 정함).
// - 2026-11-28 결정: 넓은 폭 접힘·펼침 상태를 쿠키(sidebar_collapsed)에 기억한다. 처음 방문은 펼침.
//   새로고침·페이지 이동·새 탭·재방문(브라우저를 닫았다 열기) 뒤에도 유지, 첫 HTML부터 맞는 폭(깜빡임 없음).
//   쿠키 값 형식은 보지 않고 동작으로 본다. 첫 HTML은 JS를 끈 컨텍스트에서 폭으로 본다(10).
// - 2026-11-28 결정: 서랍은 dialog(aria-modal, 이름)이고 포커스를 가두며, 넓히면 닫히고,
//   열린 동안 뒤 본문이 스크롤되지 않는다(11).
// - 테스트마다 새 브라우저 컨텍스트라 쿠키가 다른 테스트로 새지 않는다. 직접 만든 컨텍스트는 테스트 안에서 닫는다.
import type { Browser, BrowserContext, Locator, Page } from '@playwright/test';
import { test, expect } from './support/browser';
import { BROWSER_URL } from './support/env';
import { readFakes, resetFakes, type FakeState } from './support/fakes';

const WIDE = 1024;
const NARROW = WIDE - 1;
const HEIGHT = 800;

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

const fakes = (extra: Partial<FakeState> = {}): Partial<FakeState> => ({
    codes: {
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
        '/studies/study-1/members': [
            {
                id: 'user-1',
                nickname: 'tester',
                profileImageUrl: '',
                isHost: false,
                totalLikesReceived: 0,
                activityLogs: [],
            },
        ],
        '/studies/study-1/deeps': [],
    },
    ...extra,
});

const signIn = (page: Page) =>
    page.context().addCookies([{ name: 'refresh_token', value: 'refresh-e2e', url: BROWSER_URL }]);

interface AppPage {
    name: string;
    path: string;
    ready: (page: Page) => Promise<void>;
}

const appPages: AppPage[] = [
    {
        name: '홈',
        path: '/',
        ready: async (page) => {
            await expect(page.getByText(study.title).first()).toBeVisible();
        },
    },
    {
        name: '스터디',
        path: '/study/study-1',
        ready: async (page) => {
            await expect(page.getByRole('heading', { name: study.title, level: 1 })).toBeVisible();
        },
    },
    {
        name: '마이페이지',
        path: '/mypage',
        ready: async (page) => {
            await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
        },
    },
];

async function open(page: Page, target: AppPage, width: number) {
    await page.setViewportSize({ width, height: HEIGHT });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signIn(page);
    await page.goto(target.path);
    await target.ready(page);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await settleMotion(page);
}

/** 끝이 있는 애니메이션·전환이 끝날 때까지 기다린다(무한 반복은 뺀다). */
async function settleMotion(page: Page) {
    await page.evaluate(async () => {
        const frame = () => new Promise((r) => requestAnimationFrame(() => r(undefined)));
        await frame();
        const finite = document
            .getAnimations()
            .filter((a) => Number.isFinite(Number(a.effect?.getComputedTiming().endTime)));
        await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
        await frame();
        await frame();
    });
}

/** 헤더 */
const banner = (page: Page) => page.getByRole('banner');

/** aria-expanded가 있는 보이는 버튼(넓은 폭: 접기/펼치기, 좁은 폭: 메뉴 버튼) */
const toggles = (page: Page) => page.locator('button[aria-expanded]').filter({ visible: true });

/** 보이는 메뉴 "홈" 링크 */
const homeLinks = (page: Page) =>
    page.getByRole('link', { name: '홈', exact: true }).filter({ visible: true });

/** 메뉴 "홈"이 든 내비게이션 */
const menuNavs = (page: Page) =>
    page
        .getByRole('navigation')
        .filter({ has: page.getByRole('link', { name: '홈', exact: true }) })
        .filter({ visible: true });

async function theToggle(page: Page): Promise<Locator> {
    await expect(toggles(page), 'aria-expanded가 있는 보이는 버튼은 하나').toHaveCount(1);
    const toggle = toggles(page).first();
    await expect(toggle, '버튼의 접근 가능한 이름').toHaveAccessibleName(/\S/);
    return toggle;
}

async function setExpanded(page: Page, toggle: Locator, expanded: boolean) {
    if ((await toggle.getAttribute('aria-expanded')) !== String(expanded)) {
        await toggle.click();
    }
    await expect(toggle).toHaveAttribute('aria-expanded', String(expanded));
    await page.mouse.move(5, HEIGHT - 5);
    await settleMotion(page);
}

type Box = { x: number; y: number; width: number; height: number };

/**
 * 메뉴 내비게이션을 감싼 사이드바(또는 서랍) 영역. 내비게이션에서 위로 올라가되,
 * 헤더를 품거나 화면 전체 폭이 되는 조상 바로 아래에서 멈춘다.
 */
async function sidebarBox(nav: Locator): Promise<Box> {
    return nav.evaluate((el) => {
        const bannerEl = document.querySelector('header:not(main header, article header, section header, aside header, nav header), [role="banner"]');
        let node: Element = el;
        while (node.parentElement && node.parentElement !== document.body) {
            const parent = node.parentElement;
            if (bannerEl && parent.contains(bannerEl)) break;
            if (parent.getBoundingClientRect().width >= window.innerWidth - 1) break;
            node = parent;
        }
        const r = node.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
}

async function iconBox(owner: Locator): Promise<Box> {
    const icon = owner.locator('svg, img').filter({ visible: true }).first();
    await expect(icon, '아이콘(svg 또는 img)').toBeVisible();
    const box = await icon.boundingBox();
    if (!box) throw new Error('아이콘 위치를 읽지 못함');
    return box;
}

const center = (b: Box) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

async function box(locator: Locator): Promise<Box> {
    const b = await locator.boundingBox();
    if (!b) throw new Error('위치를 읽지 못함');
    return b;
}

/** 문서 안에서 실제로 그려지는 글자 text의 개수(크기·잘림·투명도·화면 안을 본다). */
function visibleTextCount(page: Page, text: string): Promise<number> {
    return page.evaluate((wanted) => {
        const clips = (s: CSSStyleDeclaration) =>
            [s.overflowX, s.overflowY].some((v) => v !== 'visible') || s.clipPath !== 'none' || (s.clip && s.clip !== 'auto');
        const inside = (p: { x: number; y: number }, r: DOMRect) =>
            p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
        let count = 0;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (n.textContent?.trim() !== wanted) continue;
            const host = n.parentElement;
            if (!host) continue;
            const range = document.createRange();
            range.selectNodeContents(n);
            const rect = range.getBoundingClientRect();
            if (rect.width < 4 || rect.height < 4) continue;
            const mid = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            if (mid.x < 0 || mid.y < 0 || mid.x > window.innerWidth || mid.y > window.innerHeight) continue;
            const hs = getComputedStyle(host);
            if (hs.visibility !== 'visible') continue;
            if (/rgba\(.*,\s*0\)$/.test(hs.color) || hs.color === 'transparent') continue;
            let opacity = 1;
            for (let e: Element | null = host; e && e !== document.documentElement; e = e.parentElement) {
                opacity *= Number(getComputedStyle(e).opacity);
            }
            // overflow 잘림은 포함 블록(containing block) 사슬에 있는 조상만 건다.
            // fixed·absolute 말풍선은 사이드바의 overflow:hidden을 벗어날 수 있다.
            const makesBlock = (s: CSSStyleDeclaration, forFixed: boolean) =>
                s.transform !== 'none' ||
                s.perspective !== 'none' ||
                s.filter !== 'none' ||
                /paint|layout|strict|content/.test(s.contain) ||
                /transform|perspective|filter/.test(s.willChange) ||
                (!forFixed && s.position !== 'static');
            const containingBlock = (el: Element): Element | null => {
                const pos = getComputedStyle(el).position;
                if (pos === 'fixed' || pos === 'absolute') {
                    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
                        if (makesBlock(getComputedStyle(a), pos === 'fixed')) return a;
                    }
                    return null;
                }
                return el.parentElement;
            };
            let ok = true;
            if (clips(hs) && !inside(mid, host.getBoundingClientRect())) ok = false;
            for (let cur: Element | null = host; ok && cur && cur !== document.documentElement; ) {
                const cb = containingBlock(cur);
                if (!cb || cb === document.documentElement) break;
                const s = getComputedStyle(cb);
                if (s.display !== 'contents' && clips(s) && !inside(mid, cb.getBoundingClientRect())) ok = false;
                cur = cb;
            }
            if (ok && opacity > 0.5) count += 1;
        }
        return count;
    }, text);
}

const expectLabelShown = (page: Page, message: string) =>
    expect.poll(() => visibleTextCount(page, '홈'), { message, timeout: 3000 }).toBeGreaterThan(0);

const expectLabelHidden = (page: Page, message: string) =>
    expect.poll(() => visibleTextCount(page, '홈'), { message, timeout: 3000 }).toBe(0);

/** 메뉴 "홈"이 화면 안에 보이는지(서랍이 열렸는지) */
async function menuInView(page: Page): Promise<boolean> {
    const links = homeLinks(page);
    for (let i = 0; i < (await links.count()); i++) {
        const b = await links.nth(i).boundingBox();
        if (!b) continue;
        const vw = page.viewportSize()?.width ?? 0;
        if (b.x + b.width > 0 && b.x < vw && b.y + b.height > 0 && b.y < HEIGHT) return true;
    }
    return false;
}

async function scrollOverflow(page: Page) {
    return page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        client: document.documentElement.clientWidth,
    }));
}

test.beforeEach(async () => {
    await resetFakes(fakes());
});

test.describe('1. 홈·스터디·마이페이지에 적용하고, 로그인·온보딩에는 없다', () => {
    for (const width of [1280, 360]) {
        for (const target of appPages) {
            test(`${target.name}(${width}px)에 헤더와 메뉴가 있다`, async ({ page }) => {
                await open(page, target, width);
                await expect(banner(page)).toBeVisible();
                await expect(banner(page).getByRole('link', { name: 'Deeps', exact: true })).toBeVisible();
                await theToggle(page);
                if (width >= WIDE) {
                    await expect(menuNavs(page)).toHaveCount(1);
                } else {
                    await (await theToggle(page)).click();
                    await expect(menuNavs(page)).toHaveCount(1);
                }
            });
        }

        test(`로그인(${width}px)에는 헤더와 메뉴가 없다`, async ({ page }) => {
            await page.setViewportSize({ width, height: HEIGHT });
            await page.goto('/login');
            await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
            await expect(page.getByRole('banner')).toHaveCount(0);
            await expect(page.getByRole('navigation')).toHaveCount(0);
            await expect(page.getByRole('link', { name: '홈', exact: true })).toHaveCount(0);
            await expect(page.locator('button[aria-expanded]')).toHaveCount(0);
        });

        test(`온보딩(${width}px)에는 헤더와 메뉴가 없다`, async ({ page }) => {
            await page.setViewportSize({ width, height: HEIGHT });
            await page.goto('/auth/callback?code=code-new');
            await expect(page).toHaveURL(`${BROWSER_URL}/onboarding`);
            await expect(page.getByRole('textbox')).toBeVisible();
            await expect(page.getByRole('banner')).toHaveCount(0);
            await expect(page.getByRole('navigation')).toHaveCount(0);
            await expect(page.getByRole('link', { name: '홈', exact: true })).toHaveCount(0);
            await expect(page.locator('button[aria-expanded]')).toHaveCount(0);
        });
    }
});

test.describe('2. 헤더의 글자 로고 "Deeps"는 홈으로, 프로필·닉네임은 마이페이지로 간다', () => {
    for (const width of [1280, 360]) {
        test(`로고(${width}px): 마이페이지 -> /`, async ({ page }) => {
            await open(page, appPages[2], width);
            const logo = banner(page).getByRole('link', { name: 'Deeps', exact: true });
            await expect(logo).toBeVisible();
            // 이미지가 아니라 글자 로고
            expect((await logo.innerText()).trim()).toBe('Deeps');
            await expect(logo.locator('img, svg')).toHaveCount(0);
            await expect(logo).toHaveAttribute('href', '/');
            await logo.click();
            await expect(page).toHaveURL(`${BROWSER_URL}/`);
            await appPages[0].ready(page);
        });

        test(`프로필(${width}px): 스터디 -> /mypage`, async ({ page }) => {
            await open(page, appPages[1], width);
            const profile = banner(page).locator('a[href="/mypage"]').filter({ visible: true });
            await expect(profile).toHaveCount(1);
            if (width >= WIDE) {
                await expect(profile).toHaveAccessibleName(/tester/);
                await expect(profile.getByText('tester', { exact: true })).toBeVisible();
            }
            await profile.click();
            await expect(page).toHaveURL(`${BROWSER_URL}/mypage`);
            await appPages[2].ready(page);
        });
    }
});

test.describe('3. 메뉴는 홈만 둔다. 현재 메뉴에 aria-current="page"', () => {
    for (const target of appPages) {
        test(`${target.name}: 메뉴 링크는 "홈" 하나`, async ({ page }) => {
            await open(page, target, 1280);
            const toggle = await theToggle(page);
            for (const expanded of [false, true]) {
                await setExpanded(page, toggle, expanded);
                const nav = menuNavs(page);
                await expect(nav).toHaveCount(1);
                await expect(nav.getByRole('link')).toHaveCount(1);
                await expect(nav.getByRole('link')).toHaveAccessibleName('홈');
                await expect(nav.getByRole('link')).toHaveAttribute('href', '/');
            }
            expect(await page.getByText(/탐색|내 학습/).count(), '탐색·내 학습 메뉴 없음').toBe(0);
        });
    }

    test('홈(/)에서 "홈"에 aria-current="page"(넓은 폭)', async ({ page }) => {
        await open(page, appPages[0], 1280);
        await expect(menuNavs(page).getByRole('link', { name: '홈', exact: true })).toHaveAttribute(
            'aria-current',
            'page',
        );
    });

    test('홈(/)에서 "홈"에 aria-current="page"(서랍)', async ({ page }) => {
        await open(page, appPages[0], 360);
        await (await theToggle(page)).click();
        await expect(menuNavs(page).getByRole('link', { name: '홈', exact: true })).toHaveAttribute(
            'aria-current',
            'page',
        );
    });

    test('마이페이지에서는 "홈"이 현재 메뉴가 아니다', async ({ page }) => {
        await open(page, appPages[2], 1280);
        const link = menuNavs(page).getByRole('link', { name: '홈', exact: true });
        await expect(link).toHaveCount(1);
        expect(await link.getAttribute('aria-current')).not.toBe('page');
    });
});

test.describe('4. 넓은 폭: 접으면 아이콘만 보이고, 호버와 키보드 포커스에서 메뉴 이름이 보인다', () => {
    for (const width of [WIDE, 1280]) {
        test(`접기/펼치기(${width}px): 폭 76/240, aria-expanded`, async ({ page }) => {
            await open(page, appPages[0], width);
            const toggle = await theToggle(page);
            await expect(menuNavs(page), '넓은 폭에서는 누르지 않아도 메뉴가 보인다').toHaveCount(1);

            await setExpanded(page, toggle, false);
            const collapsed = await sidebarBox(menuNavs(page));
            expect(collapsed.x, '사이드바 왼쪽').toBeCloseTo(0, 0);
            expect(collapsed.width, '접힘 폭').toBeCloseTo(76, 0);
            await expectLabelHidden(page, '접힘: 메뉴 이름이 보이지 않는다');
            await expect(menuNavs(page).getByRole('link', { name: '홈', exact: true })).toHaveAccessibleName('홈');
            await iconBox(homeLinks(page).first());

            await setExpanded(page, toggle, true);
            const expanded = await sidebarBox(menuNavs(page));
            expect(expanded.width, '펼침 폭').toBeCloseTo(240, 0);
            await expectLabelShown(page, '펼침: 메뉴 이름이 보인다');

            await setExpanded(page, toggle, false);
            expect((await sidebarBox(menuNavs(page))).width, '다시 접힘 폭').toBeCloseTo(76, 0);
        });
    }

    test('접힘: 호버하면 메뉴 이름이 보인다', async ({ page }) => {
        await open(page, appPages[0], 1280);
        await setExpanded(page, await theToggle(page), false);
        await expectLabelHidden(page, '호버 전');
        await homeLinks(page).first().hover();
        await expectLabelShown(page, '호버: 메뉴 이름이 보인다');
        await page.mouse.move(1270, HEIGHT - 5);
        await expectLabelHidden(page, '호버를 떼면 다시 아이콘만');
    });

    test('접힘: 키보드(Tab) 포커스에서 메뉴 이름이 보인다', async ({ page }) => {
        await open(page, appPages[0], 1280);
        await setExpanded(page, await theToggle(page), false);
        await page.mouse.move(1270, HEIGHT - 5);
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        await expectLabelHidden(page, '포커스 전');
        const link = homeLinks(page).first();
        let reached = false;
        for (let i = 0; i < 40 && !reached; i++) {
            await page.keyboard.press('Tab');
            reached = await link.evaluate((el) => el === document.activeElement);
        }
        expect(reached, 'Tab으로 메뉴 "홈"에 닿는다').toBe(true);
        await expectLabelShown(page, '키보드 포커스: 메뉴 이름이 보인다');
    });
});

test.describe('5. 접기 버튼과 메뉴 아이콘의 가로 중심이 같고, 접거나 펼쳐도 위치가 그대로다(1px)', () => {
    for (const target of appPages) {
        for (const width of [WIDE, 1280]) {
            test(`${target.name}(${width}px)`, async ({ page }) => {
                await open(page, target, width);
                const toggle = await theToggle(page);
                const measure = async () => {
                    const link = homeLinks(page).first();
                    const toggleBox = await box(toggle);
                    const linkBox = await box(link);
                    return {
                        toggleBox,
                        linkBox,
                        toggleIcon: await iconBox(toggle),
                        linkIcon: await iconBox(link),
                    };
                };
                await setExpanded(page, toggle, false);
                const closed = await measure();
                await setExpanded(page, toggle, true);
                const opened = await measure();

                for (const [state, m] of [
                    ['접힘', closed],
                    ['펼침', opened],
                ] as const) {
                    for (const [what, icon] of [
                        ['접기 버튼 아이콘', m.toggleIcon],
                        ['메뉴 아이콘', m.linkIcon],
                    ] as const) {
                        expect(Math.abs(center(icon).x - 38), `${state} ${what} 가로 중심 38px`).toBeLessThanOrEqual(1);
                        expect(Math.abs(icon.width - 20), `${state} ${what} 폭 20px`).toBeLessThanOrEqual(1);
                        expect(Math.abs(icon.height - 20), `${state} ${what} 높이 20px`).toBeLessThanOrEqual(1);
                    }
                    expect(
                        Math.abs(center(m.toggleIcon).x - center(m.linkIcon).x),
                        `${state} 두 아이콘의 가로 중심`,
                    ).toBeLessThanOrEqual(1);
                    for (const [what, b] of [
                        ['접기 버튼', m.toggleBox],
                        ['메뉴', m.linkBox],
                    ] as const) {
                        expect(Math.abs(b.x - 16), `${state} ${what} 왼쪽 여백 16px`).toBeLessThanOrEqual(1);
                        expect(Math.abs(b.height - 44), `${state} ${what} 높이 44px`).toBeLessThanOrEqual(1);
                    }
                    expect(Math.abs(m.toggleBox.width - 44), `${state} 접기 버튼 폭 44px`).toBeLessThanOrEqual(1);
                }
                expect(Math.abs(closed.linkBox.width - 44), '접힘 메뉴 칸 폭 44px').toBeLessThanOrEqual(1);

                for (const [what, a, b] of [
                    ['접기 버튼 아이콘', closed.toggleIcon, opened.toggleIcon],
                    ['메뉴 아이콘', closed.linkIcon, opened.linkIcon],
                ] as const) {
                    expect(Math.abs(center(a).x - center(b).x), `${what} 가로 위치 변화`).toBeLessThanOrEqual(1);
                    expect(Math.abs(center(a).y - center(b).y), `${what} 세로 위치 변화`).toBeLessThanOrEqual(1);
                }
            });
        }
    }
});

test.describe('6. 좁은 폭: 메뉴 버튼으로 열고 페이지 이동·바깥 클릭·Esc로 닫힌다', () => {
    for (const width of [360, NARROW]) {
        test(`${width}px: 처음에는 닫혀 있고, 열면 포커스가 안으로, Esc로 닫으면 버튼으로`, async ({ page }) => {
            await open(page, appPages[1], width);
            const toggle = await theToggle(page);
            await toggle.evaluate((el) => el.setAttribute('data-qa-menu-button', ''));
            const button = page.locator('[data-qa-menu-button]');
            await expect(button).toHaveAttribute('aria-expanded', 'false');
            expect(await menuInView(page), '처음에는 서랍이 닫혀 있다').toBe(false);

            await button.click();
            await expect(button).toHaveAttribute('aria-expanded', 'true');
            await expect.poll(() => menuInView(page), { message: '열면 메뉴가 보인다' }).toBe(true);
            await settleMotion(page);
            await expect
                .poll(
                    () =>
                        menuNavs(page).evaluate((nav) => {
                            let node: Element = nav;
                            const bannerEl = document.querySelector('[data-qa-menu-button]')?.closest('header');
                            while (node.parentElement && node.parentElement !== document.body) {
                                const parent = node.parentElement;
                                if (bannerEl && parent.contains(bannerEl)) break;
                                if (parent.getBoundingClientRect().width >= window.innerWidth - 1 && node !== nav) break;
                                node = parent;
                            }
                            const active = document.activeElement;
                            return Boolean(active && active !== document.body && node.contains(active));
                        }),
                    { message: '열면 포커스가 서랍 안으로 간다' },
                )
                .toBe(true);

            await page.keyboard.press('Escape');
            await expect(button).toHaveAttribute('aria-expanded', 'false');
            await expect.poll(() => menuInView(page), { message: 'Esc로 닫힌다' }).toBe(false);
            await expect(button, '닫히면 포커스가 메뉴 버튼으로 돌아온다').toBeFocused();
        });

        test(`${width}px: 바깥을 누르면 닫히고 포커스가 버튼으로`, async ({ page }) => {
            await open(page, appPages[1], width);
            const toggle = await theToggle(page);
            await toggle.evaluate((el) => el.setAttribute('data-qa-menu-button', ''));
            const button = page.locator('[data-qa-menu-button]');
            await button.click();
            await expect.poll(() => menuInView(page)).toBe(true);
            await settleMotion(page);
            const drawer = await sidebarBox(menuNavs(page));
            const right = drawer.x + drawer.width;
            expect(right, '서랍 바깥이 화면에 남는다').toBeLessThan(width - 20);
            await page.mouse.click(right + (width - right) / 2, HEIGHT / 2);
            await expect(button).toHaveAttribute('aria-expanded', 'false');
            await expect.poll(() => menuInView(page), { message: '바깥 클릭으로 닫힌다' }).toBe(false);
            await expect(page).toHaveURL(`${BROWSER_URL}/study/study-1`);
            await expect(button, '닫히면 포커스가 메뉴 버튼으로 돌아온다').toBeFocused();
        });

        test(`${width}px: 메뉴로 페이지를 옮기면 닫힌다`, async ({ page }) => {
            await open(page, appPages[1], width);
            await (await theToggle(page)).click();
            await expect.poll(() => menuInView(page)).toBe(true);
            await homeLinks(page).first().click();
            await expect(page).toHaveURL(`${BROWSER_URL}/`);
            await appPages[0].ready(page);
            await settleMotion(page);
            await expect.poll(() => menuInView(page), { message: '이동하면 서랍이 닫힌다' }).toBe(false);
            await expect(await theToggle(page)).toHaveAttribute('aria-expanded', 'false');
        });
    }

    for (const target of appPages) {
        test(`${target.name}(360px): 메뉴 버튼이 있고 서랍이 열린다`, async ({ page }) => {
            await open(page, target, 360);
            const toggle = await theToggle(page);
            await expect(toggle).toHaveAttribute('aria-expanded', 'false');
            expect(await menuInView(page)).toBe(false);
            await toggle.click();
            await expect.poll(() => menuInView(page)).toBe(true);
        });
    }
});

test.describe('6-1. 헤더 높이 72px, 좁은 폭 56px', () => {
    for (const [width, height] of [
        [1280, 72],
        [WIDE, 72],
        [NARROW, 56],
        [360, 56],
    ] as const) {
        test(`${width}px: ${height}px`, async ({ page }) => {
            await open(page, appPages[0], width);
            const b = await box(banner(page));
            expect(Math.abs(b.height - height)).toBeLessThanOrEqual(1);
        });
    }
});

/**
 * 버튼 후보 중 헤더·메뉴 안에 있는 것은 없고, 본문 상단(헤더 아래, 스크롤 없이 첫 화면)에 있는 것이
 * 하나 이상인지 본다. 홈에는 목록 안의 "딥스터디 만들기" 빈 카드가 원래 있어서 후보가 여럿일 수 있다.
 * 본문 상단에 있는 첫 후보를 돌려준다.
 */
async function bodyTopButton(page: Page, candidates: Locator): Promise<Locator> {
    await expect(candidates.first()).toBeVisible();
    expect(await page.evaluate(() => window.scrollY), '스크롤하지 않은 상태').toBe(0);
    const header = await box(banner(page));
    let found: Locator | null = null;
    for (let i = 0; i < (await candidates.count()); i++) {
        const button = candidates.nth(i);
        const inChrome = await button.evaluate(
            (el) => Boolean(el.closest('header, [role="banner"], nav, [role="navigation"], aside')),
        );
        expect(inChrome, `후보 ${i + 1}: 헤더·메뉴 영역 밖(본문)`).toBe(false);
        const b = await box(button);
        if (!found && b.y >= header.y + header.height - 1 && b.y + b.height <= HEIGHT) found = button;
    }
    expect(found, '본문 상단(헤더 아래, 첫 화면 안)에 있다').not.toBeNull();
    return found as Locator;
}

test.describe('7. 스터디 만들기·나가기는 각 화면 본문 상단에서 계속 동작한다', () => {
    for (const width of [1280, 360]) {
        test(`홈(${width}px): 스터디 만들기가 본문 상단에 있고 만들기 창을 연다`, async ({ page }) => {
            await open(page, appPages[0], width);
            const candidates = page.getByRole('button', { name: /스터디 만들기/ }).filter({ visible: true });
            const create = await bodyTopButton(page, candidates);
            await create.click();
            await expect(page.getByRole('heading', { name: '딥스터디 만들기' })).toBeVisible();
            await expect(page.getByPlaceholder('스터디 제목을 입력해주세요')).toBeVisible();
        });

        test(`스터디(${width}px): 나가기가 본문 상단에 있고 나가기 창을 연다`, async ({ page }) => {
            await open(page, appPages[1], width);
            const candidates = page.getByRole('button', { name: /스터디 나가기/ }).filter({ visible: true });
            await expect(candidates).toHaveCount(1);
            const leave = await bodyTopButton(page, candidates);
            await leave.click();
            await expect(page.getByRole('button', { name: '확인', exact: true })).toBeVisible();
        });
    }

    test('홈: 스터디 만들기로 실제로 만들어진다', async ({ page }) => {
        await open(page, appPages[0], 1280);
        const candidates = page.getByRole('button', { name: /스터디 만들기/ }).filter({ visible: true });
        await (await bodyTopButton(page, candidates)).click();
        await page.getByPlaceholder('스터디 제목을 입력해주세요').fill('새로 만든 가짜 스터디');
        await page.getByRole('button', { name: '날짜를 선택해 주세요' }).click();
        await page.getByRole('button', { name: '›' }).click();
        await page.getByRole('button', { name: '10', exact: true }).click();
        await page.getByRole('button', { name: '12', exact: true }).click();
        await page.getByRole('button', { name: '4명', exact: true }).click();
        // 해시태그는 기존부터 필수다(e2e.spec.ts의 같은 흐름과 같다).
        const tagInput = page.getByPlaceholder('태그 입력 후 엔터 (클릭 시 삭제)');
        await tagInput.fill('faketag');
        await tagInput.press('Enter');
        await page.getByRole('button', { name: '확인', exact: true }).click();
        await expect(page.getByRole('heading', { name: '딥스터디 만들기' })).toBeHidden();
        await expect(page.getByText('새로 만든 가짜 스터디')).toBeVisible();
        const { calls } = await readFakes();
        expect(calls.filter((c) => c.method === 'POST' && c.path === '/studies')).toHaveLength(1);
    });

    test('홈: 스터디가 3개면 만들기 대신 제한 안내가 보인다', async ({ page }) => {
        await resetFakes(
            fakes({
                studies: [1, 2, 3].map((i) => ({ ...study, id: `study-${i}`, title: `가짜 스터디 ${i}` })),
            }),
        );
        await page.setViewportSize({ width: 1280, height: HEIGHT });
        await signIn(page);
        await page.goto('/');
        await expect(page.getByText('가짜 스터디 3')).toBeVisible();
        await page.getByRole('button', { name: /스터디 만들기/ }).filter({ visible: true }).first().click();
        await expect(page.getByText('스터디 참여 제한 안내')).toBeVisible();
        await expect(page.getByRole('heading', { name: '딥스터디 만들기' })).toBeHidden();
    });

    test('스터디: 나가기를 확인하면 나가고 홈으로 간다', async ({ page }) => {
        await open(page, appPages[1], 1280);
        await page.getByRole('button', { name: /스터디 나가기/ }).filter({ visible: true }).click();
        await page.getByRole('button', { name: '확인', exact: true }).click();
        await expect(page).toHaveURL(`${BROWSER_URL}/`);
        const { calls } = await readFakes();
        expect(calls.filter((c) => c.method === 'DELETE').map((c) => c.path)).toEqual([
            '/studies/study-1/members/me',
        ]);
    });
});

test.describe('8. 코인·퀘스트 영역과 가짜 값을 넣지 않는다', () => {
    for (const target of appPages) {
        for (const width of [1280, 360]) {
            test(`${target.name}(${width}px)`, async ({ page }) => {
                await open(page, target, width);
                const toggle = await theToggle(page);
                // 넓은 폭은 펼친 상태, 좁은 폭은 서랍을 연 상태에서 본다.
                await setExpanded(page, toggle, true);
                const found = await page.evaluate(() => {
                    const pattern = /코인|퀘스트|\bcoins?\b|\bquests?\b/i;
                    const hits: string[] = [];
                    const skip = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT']);
                    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                        if (n.parentElement && skip.has(n.parentElement.tagName)) continue;
                        if (pattern.test(n.textContent ?? '')) hits.push(`글자: ${n.textContent?.trim()}`);
                    }
                    for (const el of document.body.querySelectorAll('*')) {
                        for (const attr of ['aria-label', 'title', 'alt', 'placeholder', 'data-testid']) {
                            const v = el.getAttribute(attr);
                            if (v && pattern.test(v)) hits.push(`${attr}: ${v}`);
                        }
                    }
                    return hits;
                });
                expect(found).toEqual([]);
            });
        }
    }
});

test.describe('9. 320·360·768·1280px(경계 1023·1024 포함)에서 가로 넘침이 없다', () => {
    for (const target of appPages) {
        for (const width of [320, 360, 768, NARROW, WIDE, 1280]) {
            test(`${target.name}(${width}px)`, async ({ page }) => {
                await open(page, target, width);
                const states = width >= WIDE ? [false, true] : [null];
                for (const expanded of states) {
                    if (expanded !== null) await setExpanded(page, await theToggle(page), expanded);
                    const m = await scrollOverflow(page);
                    const label = expanded === null ? '' : expanded ? '펼침 ' : '접힘 ';
                    expect(m.doc, `${label}문서 scrollWidth`).toBeLessThanOrEqual(width);
                    expect(m.body, `${label}body scrollWidth`).toBeLessThanOrEqual(width);
                }
            });
        }
    }
});

const SIDEBAR_COOKIE = 'sidebar_collapsed';

const sidebarCookie = async (context: BrowserContext) =>
    (await context.cookies(BROWSER_URL)).find((c) => c.name === SIDEBAR_COOKIE) ?? null;

/** 넓은 폭 사이드바의 상태(aria-expanded, 폭)를 본다. */
async function expectSidebar(page: Page, expanded: boolean, where: string) {
    const toggle = await theToggle(page);
    await expect(toggle, `${where}: aria-expanded`).toHaveAttribute('aria-expanded', String(expanded));
    await settleMotion(page);
    const width = (await sidebarBox(menuNavs(page))).width;
    expect(Math.abs(width - (expanded ? 240 : 76)), `${where}: 사이드바 폭 ${width}`).toBeLessThanOrEqual(1);
}

/** 접고 나서 쿠키가 생길 때까지 기다린다(쿠키 이름만 확인, 값 형식은 보지 않는다). */
async function collapseAndWait(page: Page) {
    await setExpanded(page, await theToggle(page), false);
    await expect
        .poll(async () => (await sidebarCookie(page.context()))?.name ?? null, {
            message: `접으면 ${SIDEBAR_COOKIE} 쿠키가 생긴다`,
        })
        .toBe(SIDEBAR_COOKIE);
}

/** 펼치고 나서 쿠키가 접힘 때와 달라질 때까지(값이 바뀌거나 지워질 때까지) 기다린다. */
async function expandAndWait(page: Page) {
    const before = JSON.stringify(await sidebarCookie(page.context()));
    await setExpanded(page, await theToggle(page), true);
    await expect
        .poll(async () => JSON.stringify(await sidebarCookie(page.context())), {
            message: '펼치면 저장된 값이 바뀐다',
        })
        .not.toBe(before);
}

/** 기본 픽스처처럼 외부 주소를 막은 새 컨텍스트 */
async function isolatedContext(browser: Browser, options: Parameters<Browser['newContext']>[0] = {}) {
    const context = await browser.newContext({
        baseURL: BROWSER_URL,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        serviceWorkers: 'block',
        reducedMotion: 'reduce',
        viewport: { width: 1280, height: HEIGHT },
        ...options,
    });
    await context.route(
        (url) => url.origin !== BROWSER_URL && !url.origin.startsWith('http://127.0.0.1:'),
        (route) => route.abort('blockedbyclient'),
    );
    await context.addCookies([{ name: 'refresh_token', value: 'refresh-e2e', url: BROWSER_URL }]);
    return context;
}

/** JS를 끈 컨텍스트에서 서버가 보낸 첫 HTML의 사이드바 폭을 잰다. */
async function firstHtmlSidebar(browser: Browser, saved: Awaited<ReturnType<typeof sidebarCookie>>) {
    const context = await isolatedContext(browser, { javaScriptEnabled: false });
    try {
        if (saved) await context.addCookies([saved]);
        const page = await context.newPage();
        await page.goto('/');
        await page.waitForLoadState('load');
        await expect(menuNavs(page), 'JS 없이도 첫 HTML에 메뉴가 있다').toHaveCount(1);
        const toggle = page.locator('button[aria-expanded]').filter({ visible: true });
        await expect(toggle, 'JS 없이도 첫 HTML에 접기 버튼이 있다').toHaveCount(1);
        return {
            width: (await sidebarBox(menuNavs(page))).width,
            expanded: await toggle.getAttribute('aria-expanded'),
        };
    } finally {
        await context.close();
    }
}

test.describe('10. 넓은 폭 접힘·펼침 상태를 기억한다(2026-11-28)', () => {
    test('처음 방문(저장 없음)은 펼침', async ({ page }) => {
        expect(await sidebarCookie(page.context()), '새 컨텍스트에는 저장이 없다').toBeNull();
        await open(page, appPages[0], 1280);
        await expectSidebar(page, true, '처음 방문');
    });

    for (const target of appPages) {
        test(`${target.name}: 접은 뒤 새로고침해도 접혀 있고, 다시 펼치면 펼침이 기억된다`, async ({ page }) => {
            await open(page, target, 1280);
            await collapseAndWait(page);
            await page.reload();
            await target.ready(page);
            await expectSidebar(page, false, '접고 새로고침');

            await expandAndWait(page);
            await page.reload();
            await target.ready(page);
            await expectSidebar(page, true, '펼치고 새로고침');
        });
    }

    test('접은 뒤 홈 -> 스터디 -> 마이페이지 -> 홈으로 옮겨도 접혀 있다(화면 안 링크 이동)', async ({ page }) => {
        await open(page, appPages[0], 1280);
        await collapseAndWait(page);

        // 홈 카드를 누르면 상세 모달("입장"/"취소")이 뜬다. 모달의 "입장"으로 스터디로 간다.
        await page.getByText(study.title).first().click();
        const enter = page.getByRole('button', { name: '입장', exact: true });
        await expect(enter, '카드를 누르면 상세 모달의 "입장" 버튼이 보인다').toBeVisible();
        await enter.click();
        await expect(page).toHaveURL(`${BROWSER_URL}/study/study-1`);
        await appPages[1].ready(page);
        await expectSidebar(page, false, '스터디로 이동');

        await banner(page).locator('a[href="/mypage"]').filter({ visible: true }).click();
        await expect(page).toHaveURL(`${BROWSER_URL}/mypage`);
        await appPages[2].ready(page);
        await expectSidebar(page, false, '마이페이지로 이동');

        await homeLinks(page).first().click();
        await expect(page).toHaveURL(`${BROWSER_URL}/`);
        await appPages[0].ready(page);
        await expectSidebar(page, false, '홈으로 이동');
    });

    test('접은 뒤 주소로 다른 페이지를 열어도 접혀 있고, 펼친 뒤에는 펼쳐 있다', async ({ page }) => {
        await open(page, appPages[0], 1280);
        await collapseAndWait(page);
        for (const target of [appPages[1], appPages[2], appPages[0]]) {
            await page.goto(target.path);
            await target.ready(page);
            await expectSidebar(page, false, `${target.name} 주소로 열기`);
        }
        await expandAndWait(page);
        for (const target of [appPages[2], appPages[1]]) {
            await page.goto(target.path);
            await target.ready(page);
            await expectSidebar(page, true, `펼친 뒤 ${target.name} 주소로 열기`);
        }
    });

    test('접은 뒤 새 탭으로 열어도 접혀 있고, 새 탭에서 펼치면 원래 탭 새로고침도 펼침', async ({ page }) => {
        await open(page, appPages[0], 1280);
        await collapseAndWait(page);

        const tab = await page.context().newPage();
        await tab.setViewportSize({ width: 1280, height: HEIGHT });
        await tab.goto(appPages[2].path);
        await appPages[2].ready(tab);
        await expectSidebar(tab, false, '새 탭');

        await expandAndWait(tab);
        await tab.close();
        await page.reload();
        await appPages[0].ready(page);
        await expectSidebar(page, true, '새 탭에서 펼친 뒤 원래 탭 새로고침');
    });

    test('접은 뒤 브라우저를 닫았다 다시 열어도(세션 쿠키는 사라짐) 접혀 있다', async ({ page, browser }) => {
        await open(page, appPages[0], 1280);
        await collapseAndWait(page);
        const saved = await sidebarCookie(page.context());
        expect(saved?.expires ?? -1, '브라우저를 닫아도 남는 쿠키(만료 시각이 있다)').toBeGreaterThan(Date.now() / 1000);

        // 브라우저를 다시 연 것처럼: 세션 쿠키는 버리고 만료 시각이 있는 쿠키만 옮긴다.
        const persistent = (await page.context().cookies()).filter((c) => c.expires > 0 && c.name !== 'refresh_token');
        const context = await isolatedContext(browser);
        try {
            await context.addCookies(persistent);
            const again = await context.newPage();
            await again.goto(appPages[1].path);
            await appPages[1].ready(again);
            await expectSidebar(again, false, '다시 연 브라우저');
        } finally {
            await context.close();
        }
    });

    test('첫 HTML(JS 실행 전)부터 저장된 폭이다: 접힘 76px, 저장 없음 240px', async ({ page, browser }) => {
        const fresh = await firstHtmlSidebar(browser, null);
        expect(Math.abs(fresh.width - 240), `저장 없음 첫 HTML 폭 ${fresh.width}`).toBeLessThanOrEqual(1);
        expect(fresh.expanded, '저장 없음 첫 HTML aria-expanded').toBe('true');

        await open(page, appPages[0], 1280);
        await collapseAndWait(page);
        const collapsed = await firstHtmlSidebar(browser, await sidebarCookie(page.context()));
        expect(Math.abs(collapsed.width - 76), `접힘 저장 첫 HTML 폭 ${collapsed.width}`).toBeLessThanOrEqual(1);
        expect(collapsed.expanded, '접힘 저장 첫 HTML aria-expanded').toBe('false');

        await expandAndWait(page);
        const expanded = await firstHtmlSidebar(browser, await sidebarCookie(page.context()));
        expect(Math.abs(expanded.width - 240), `펼침 저장 첫 HTML 폭 ${expanded.width}`).toBeLessThanOrEqual(1);
    });

    test('접힘 저장 뒤 새로고침 중 펼친 폭이 한 번도 그려지지 않는다', async ({ page }) => {
        await open(page, appPages[0], 1280);
        await collapseAndWait(page);
        // 문서가 만들어질 때부터 매 프레임 사이드바 폭을 기록한다.
        await page.addInitScript(() => {
            const seen: number[] = [];
            (window as unknown as { __qaWidths: number[] }).__qaWidths = seen;
            const sample = () => {
                for (const a of document.querySelectorAll('nav a[href="/"]')) {
                    if (a.closest('header')) continue;
                    let node: Element = a;
                    const header = document.querySelector('header');
                    while (node.parentElement && node.parentElement !== document.body) {
                        const parent = node.parentElement;
                        if (header && parent.contains(header)) break;
                        if (parent.getBoundingClientRect().width >= window.innerWidth - 1) break;
                        node = parent;
                    }
                    const r = node.getBoundingClientRect();
                    // 화면 밖(닫힌 서랍 등)이나 크기 없는 것은 뺀다.
                    if (r.width > 0 && r.right > 0 && r.left < window.innerWidth) seen.push(Math.round(r.width));
                }
                if (performance.now() < 5000) requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
        });
        await page.reload();
        await appPages[0].ready(page);
        await page.waitForTimeout(500);
        const widths = await page.evaluate(() => (window as unknown as { __qaWidths: number[] }).__qaWidths);
        expect(widths.length, '폭을 잰 프레임이 있다').toBeGreaterThan(0);
        expect(Math.max(...widths), `프레임별 폭 중 최대(76이어야 함): ${[...new Set(widths)].join(',')}`).toBeLessThanOrEqual(77);
    });

    test('좁은 폭: 저장 상태와 관계없이 처음에는 서랍이 닫혀 있다', async ({ page }) => {
        await open(page, appPages[0], 1280);
        await collapseAndWait(page);
        await expandAndWait(page);
        for (const width of [NARROW, 360]) {
            await page.setViewportSize({ width, height: HEIGHT });
            await page.reload();
            await appPages[0].ready(page);
            await settleMotion(page);
            await expect(await theToggle(page), `${width}px aria-expanded`).toHaveAttribute('aria-expanded', 'false');
            expect(await menuInView(page), `${width}px 서랍 닫힘`).toBe(false);
        }
    });

    test('넓은 폭에서 접은 채 좁혔다 다시 넓혀도 접혀 있다', async ({ page }) => {
        await open(page, appPages[0], 1280);
        await collapseAndWait(page);
        await page.setViewportSize({ width: NARROW, height: HEIGHT });
        await settleMotion(page);
        await expect(await theToggle(page)).toHaveAttribute('aria-expanded', 'false');
        await page.setViewportSize({ width: WIDE, height: HEIGHT });
        await expectSidebar(page, false, '다시 넓힘');
    });
});

/** 서랍(dialog) */
const drawerDialog = (page: Page) => page.getByRole('dialog');

async function openDrawer(page: Page, target: AppPage, width: number, height = HEIGHT) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signIn(page);
    await page.goto(target.path);
    await target.ready(page);
    await page.waitForLoadState('networkidle');
    await settleMotion(page);
    const toggle = await theToggle(page);
    await toggle.evaluate((el) => el.setAttribute('data-qa-menu-button', ''));
    const button = page.locator('[data-qa-menu-button]');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => menuInView(page), { message: '서랍이 열린다' }).toBe(true);
    await settleMotion(page);
    return button;
}

/** 문서와 서랍 밖 모든 요소의 스크롤 양 합 */
const outsideScroll = (page: Page) =>
    page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        let total = window.scrollY + window.scrollX;
        for (const el of document.querySelectorAll('*')) {
            if (dialog && dialog.contains(el)) continue;
            total += el.scrollTop + el.scrollLeft;
        }
        return total;
    });

const resetScroll = (page: Page) =>
    page.evaluate(() => {
        window.scrollTo(0, 0);
        for (const el of document.querySelectorAll('*')) {
            el.scrollTop = 0;
            el.scrollLeft = 0;
        }
    });

async function wheelAt(page: Page, x: number, y: number) {
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
}

const tallFakes = () =>
    fakes({
        studies: [1, 2, 3].map((i) => ({ ...study, id: i === 1 ? 'study-1' : `study-${i}`, title: i === 1 ? study.title : `가짜 스터디 ${i}` })),
    });

test.describe('11. 서랍: dialog·포커스 가두기, 넓히면 닫힘, 열린 동안 뒤 본문 스크롤 막기(2026-11-28)', () => {
    for (const width of [360, NARROW]) {
        test(`${width}px: 열린 서랍은 이름 있는 dialog(aria-modal="true")이고 닫히면 없다`, async ({ page }) => {
            await open(page, appPages[1], width);
            await expect(drawerDialog(page), '닫힌 동안에는 dialog가 없다').toHaveCount(0);
            const button = await openDrawer(page, appPages[1], width);
            await expect(drawerDialog(page)).toHaveCount(1);
            const dialog = drawerDialog(page);
            await expect(dialog).toBeVisible();
            await expect(dialog).toHaveAttribute('aria-modal', 'true');
            await expect(dialog, 'dialog의 접근 가능한 이름').toHaveAccessibleName(/\S/);
            await expect(dialog.getByRole('link', { name: '홈', exact: true }), '메뉴가 dialog 안에').toHaveCount(1);
            await page.keyboard.press('Escape');
            await expect(button).toHaveAttribute('aria-expanded', 'false');
            await expect(drawerDialog(page), '닫으면 dialog가 없다').toHaveCount(0);
        });

        for (const [key, label] of [
            ['Tab', 'Tab'],
            ['Shift+Tab', 'Shift+Tab'],
        ] as const) {
            test(`${width}px: 열린 동안 ${label}를 계속 눌러도 포커스가 서랍 밖으로 나가지 않는다`, async ({ page }) => {
                await openDrawer(page, appPages[1], width);
                const dialog = drawerDialog(page);
                await expect(dialog).toHaveCount(1);
                await expect
                    .poll(() => dialog.evaluate((d) => d.contains(document.activeElement)), {
                        message: '열면 포커스가 dialog 안',
                    })
                    .toBe(true);
                const visited = new Set<string>();
                for (let i = 0; i < 25; i++) {
                    await page.keyboard.press(key);
                    const where = await dialog.evaluate((d) => {
                        const a = document.activeElement;
                        return {
                            inside: Boolean(a && a !== document.body && d.contains(a)),
                            what: a ? `${a.tagName.toLowerCase()}:${(a.textContent ?? '').trim().slice(0, 20)}` : 'none',
                        };
                    });
                    expect(where.inside, `${label} ${i + 1}번째: 포커스 ${where.what}`).toBe(true);
                    visited.add(where.what);
                }
                await expect(dialog, '누르는 동안 서랍이 열려 있다').toBeVisible();
                expect(visited.size, '서랍 안 요소를 돌며 지나간다').toBeGreaterThan(0);
            });
        }
    }

    test('1023px에서 연 채 1024px로 넓히면 닫히고, 다시 1023px로 좁혀도 닫혀 있다', async ({ page }) => {
        await resetFakes(tallFakes());
        const button = await openDrawer(page, appPages[0], NARROW, 400);
        await page.setViewportSize({ width: WIDE, height: 400 });
        await settleMotion(page);
        await expect(drawerDialog(page), '넓히면 dialog가 없다').toHaveCount(0);
        await expect(button, '넓히면 (숨은) 메뉴 버튼도 닫힘 상태').toHaveAttribute('aria-expanded', 'false');
        await expectSidebar(page, true, '넓힌 뒤 사이드바(저장 없음 = 펼침)');

        // 넓힌 뒤 본문이 다시 스크롤된다(잠금이 풀린다).
        await resetScroll(page);
        await wheelAt(page, WIDE - 20, 200);
        expect(await outsideScroll(page), '넓힌 뒤 본문이 스크롤된다').toBeGreaterThan(0);
        await resetScroll(page);

        await page.setViewportSize({ width: NARROW, height: 400 });
        await settleMotion(page);
        await expect(button, '다시 좁혀도 닫힘').toHaveAttribute('aria-expanded', 'false');
        expect(await menuInView(page), '다시 좁혀도 서랍이 안 보인다').toBe(false);
        await expect(drawerDialog(page)).toHaveCount(0);
    });

    test('넓은 폭에서 접어 둔 뒤 좁혀 서랍을 열었다가 넓히면, 사이드바는 접힌 그대로다', async ({ page }) => {
        await open(page, appPages[0], 1280);
        await collapseAndWait(page);
        await page.setViewportSize({ width: NARROW, height: HEIGHT });
        await settleMotion(page);
        await (await theToggle(page)).click();
        await expect.poll(() => menuInView(page)).toBe(true);
        await page.setViewportSize({ width: 1280, height: HEIGHT });
        await settleMotion(page);
        await expect(drawerDialog(page)).toHaveCount(0);
        await expectSidebar(page, false, '서랍을 연 채 넓힘');
        await page.reload();
        await appPages[0].ready(page);
        await expectSidebar(page, false, '넓힌 뒤 새로고침');
    });

    for (const width of [360, NARROW]) {
        test(`${width}px: 서랍이 열린 동안 휠·키로 뒤 본문이 스크롤되지 않고, 닫으면 다시 스크롤된다`, async ({ page }) => {
            await resetFakes(tallFakes());
            await page.setViewportSize({ width, height: 400 });
            await open(page, appPages[0], width);
            await page.setViewportSize({ width, height: 400 });
            await settleMotion(page);

            // 전제: 닫힌 상태에서는 본문이 스크롤된다.
            await resetScroll(page);
            await wheelAt(page, width - 20, 200);
            expect(await outsideScroll(page), '전제: 서랍을 열기 전에는 본문이 스크롤된다').toBeGreaterThan(0);
            await resetScroll(page);
            expect(await outsideScroll(page)).toBe(0);

            const button = await openDrawer(page, appPages[0], width, 400);
            const drawer = await sidebarBox(menuNavs(page));
            const right = drawer.x + drawer.width;
            await wheelAt(page, right + (width - right) / 2, 200);
            expect(await outsideScroll(page), '서랍 바깥(가림막) 휠').toBe(0);
            await wheelAt(page, drawer.x + drawer.width / 2, 200);
            expect(await outsideScroll(page), '서랍 위 휠').toBe(0);
            for (const key of ['PageDown', 'End', 'ArrowDown']) {
                await page.keyboard.press(key);
                await page.waitForTimeout(300);
                expect(await outsideScroll(page), `${key} 키`).toBe(0);
            }
            await expect(button, '시험하는 동안 서랍이 열려 있다').toHaveAttribute('aria-expanded', 'true');

            await page.keyboard.press('Escape');
            await expect(button).toHaveAttribute('aria-expanded', 'false');
            await settleMotion(page);
            await wheelAt(page, width - 20, 200);
            expect(await outsideScroll(page), '닫으면 다시 스크롤된다').toBeGreaterThan(0);
        });
    }
});

test.describe('12. 경계 사례: 서랍을 다른 방법으로 닫아도 스크롤이 풀리고, 저장 상태로 하이드레이션 오류가 없다(2026-11-28)', () => {
    test('1023px: 가림막을 눌러 닫으면 뒤 본문이 다시 스크롤된다', async ({ page }) => {
        await resetFakes(tallFakes());
        const button = await openDrawer(page, appPages[0], NARROW, 400);
        const drawer = await sidebarBox(menuNavs(page));
        const right = drawer.x + drawer.width;
        await page.mouse.click(right + (NARROW - right) / 2, 300);
        await expect(button).toHaveAttribute('aria-expanded', 'false');
        await expect(drawerDialog(page)).toHaveCount(0);
        await settleMotion(page);
        await resetScroll(page);
        await wheelAt(page, NARROW - 20, 200);
        expect(await outsideScroll(page), '가림막으로 닫은 뒤 본문이 스크롤된다').toBeGreaterThan(0);
    });

    test('1023px: 스터디에서 서랍의 "홈"으로 이동해 닫혀도 홈 본문이 스크롤된다', async ({ page }) => {
        await resetFakes(tallFakes());
        await openDrawer(page, appPages[1], NARROW, 400);
        await drawerDialog(page).getByRole('link', { name: '홈', exact: true }).click();
        await expect(page).toHaveURL(`${BROWSER_URL}/`);
        await appPages[0].ready(page);
        await expect(drawerDialog(page)).toHaveCount(0);
        await page.waitForLoadState('networkidle');
        await settleMotion(page);
        await resetScroll(page);
        await wheelAt(page, NARROW - 20, 200);
        expect(await outsideScroll(page), '링크로 이동해 닫힌 뒤 본문이 스크롤된다').toBeGreaterThan(0);
    });

    for (const saved of [false, true]) {
        test(`${saved ? '접힘 저장' : '저장 없음'}: 홈·스터디·마이페이지를 처음 열 때 하이드레이션 오류가 없다`, async ({ page }) => {
            if (saved) {
                await open(page, appPages[0], 1280);
                await collapseAndWait(page);
            } else {
                await page.setViewportSize({ width: 1280, height: HEIGHT });
                await signIn(page);
            }
            const problems: string[] = [];
            const hydration = /hydrat|#418|#419|#423|#425/i;
            page.on('console', (m) => {
                if (m.type() === 'error' && hydration.test(m.text())) problems.push(`console: ${m.text().slice(0, 200)}`);
            });
            page.on('pageerror', (e) => {
                if (hydration.test(`${e.name} ${e.message}`)) problems.push(`pageerror: ${e.message.slice(0, 200)}`);
            });
            for (const target of appPages) {
                await page.goto(target.path);
                await target.ready(page);
                await page.waitForLoadState('networkidle');
                await settleMotion(page);
                await expectSidebar(page, !saved, `${target.name} 처음 열기`);
            }
            expect(problems, '하이드레이션 오류').toEqual([]);
        });
    }
});
