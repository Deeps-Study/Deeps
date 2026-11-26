// 이슈 #152 1단계: 공통 디자인 토큰 인수 테스트
//
// 토큰은 아직 화면에서 쓰이지 않을 수 있다. 그래서 테스트 전용 페이지를 만들지 않고,
// 앱의 Tailwind 진입 CSS를 그대로 컴파일해 "이 클래스를 쓰면 무엇이 되는지"를 빈 페이지에서
// 확인한다(support/tailwind.ts). 기존 화면은 실제 빌드를 가짜 백엔드로 띄워 확인한다.
//
// 기준값(fixtures/design-tokens-baseline.json)은 구현 전 코드(develop 기준)에서 이 파일의
// 수집 함수로 만든 것이다. 손으로 고치지 않는다.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from './support/browser';
import { clickLooks, focusScreens, tabLooks, type FocusLook } from './support/focus';
import { collectColors, editorState, prepare, screens, settle } from './support/screens';
import { buildCss } from './support/tailwind';

/**
 * 토큰 이름 목록(QA 제안, 팀장 확인 필요). Tailwind 색 이름이며 `bg-이름`, `text-이름`,
 * `border-이름`처럼 쓸 수 있어야 한다. CSS 변수 이름은 묻지 않는다(유틸리티가 참조하는
 * 변수를 테스트가 직접 찾는다).
 * 값이 null이면 아직 값이 정해지지 않아 존재만 확인한다.
 */
const TOKENS: Record<string, { label: string; value: string | null }> = {
    primary: { label: '대표색(장식)', value: '#10B981' },
    'primary-strong': { label: '버튼·강조 글자', value: '#047857' },
    'primary-hover': { label: '버튼 hover', value: '#065F46' },
    'primary-subtle': { label: '연한 대표색 배경', value: '#ECFDF5' },
    canvas: { label: '배경(canvas)', value: '#F8FAFC' },
    surface: { label: '표면(surface)', value: '#FFFFFF' },
    inverse: { label: '반전 배경(inverse)', value: '#0F172A' },
    foreground: { label: '글자', value: '#0F172A' },
    'foreground-muted': { label: '보조 글자', value: '#64748B' },
    border: { label: '테두리', value: '#E2E8F0' },
    'border-input': { label: '입력 테두리', value: '#64748B' },
    success: { label: '성공', value: '#047857' },
    error: { label: '오류', value: '#DC2626' },
    focus: { label: '포커스', value: '#059669' },
};

const UTILITIES = [
    ['bg', 'background-color', 'backgroundColor'],
    ['text', 'color', 'color'],
    ['border', 'border-color', 'borderTopColor'],
] as const;

const root = path.resolve(__dirname, '../..');
const baseline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures/design-tokens-baseline.json'), 'utf8'),
) as {
    utilities: Record<string, string>;
    screens: Record<string, Record<string, Record<string, string>>>;
    scrollWidth320: Record<string, number>;
    packages: { dependencies: Record<string, string>; devDependencies: Record<string, string> };
};

function hexToRgb(hex: string): string {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

function parseRgb(value: string): [number, number, number, number] {
    const m = value.match(/^rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)$/);
    if (!m) throw new Error(`rgb 색이 아님: ${value}`);
    return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
}

function luminance(value: string): number {
    const [r, g, b] = parseRgb(value)
        .slice(0, 3)
        .map((c) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

/** 컴파일한 CSS를 빈 페이지에 넣고, 클래스마다 요소를 하나씩 만든다. */
async function mountUtilities(page: Page, classes: string[]) {
    const css = await buildCss([...classes, 'border-solid', 'border-2']);
    const body = classes
        .map((c) => `<div data-probe="${c}" class="${c} border-solid border-2">가</div>`)
        .join('');
    await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body>${body}</body></html>`);
}

/** 유틸리티 규칙이 선언한 속성 값(예: var(--x))을 CSSOM에서 찾는다. 없으면 null. */
function declaredValue(page: Page, className: string, property: string) {
    return page.evaluate(
        ([selector, prop]) => {
            const walk = (rules: CSSRuleList): string | null => {
                for (const rule of rules) {
                    if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
                        const v = rule.style.getPropertyValue(prop);
                        if (v) return v.trim();
                    }
                    if ('cssRules' in rule) {
                        const found = walk((rule as CSSGroupingRule).cssRules);
                        if (found) return found;
                    }
                }
                return null;
            };
            for (const sheet of document.styleSheets) {
                const found = walk(sheet.cssRules);
                if (found) return found;
            }
            return null;
        },
        [`.${className}`, property] as const,
    );
}

function computed(page: Page, className: string, prop: string) {
    return page
        .locator(`[data-probe="${className}"]`)
        .evaluate((el, p) => getComputedStyle(el)[p as 'color'], prop);
}

/** 토큰 이름 -> 계산된 색(rgb) */
async function tokenColors(page: Page): Promise<Record<string, string>> {
    await mountUtilities(
        page,
        Object.keys(TOKENS).map((name) => `bg-${name}`),
    );
    const out: Record<string, string> = {};
    for (const name of Object.keys(TOKENS)) {
        out[name] = await computed(page, `bg-${name}`, 'backgroundColor');
    }
    return out;
}

test.describe('1. 의미 토큰이 CSS 변수로 정의되고 Tailwind 유틸리티로 쓸 수 있다', () => {
    for (const [name, { label, value }] of Object.entries(TOKENS)) {
        test(`${label}(${name})`, async ({ page }) => {
            const classes = UTILITIES.map(([prefix]) => `${prefix}-${name}`);
            await mountUtilities(page, classes);
            for (const [prefix, cssProp, jsProp] of UTILITIES) {
                const cls = `${prefix}-${name}`;
                const declared = await declaredValue(page, cls, cssProp);
                expect(declared, `${cls} 유틸리티가 생성되어야 함`).not.toBeNull();
                expect(declared, `${cls}는 CSS 변수를 참조해야 함`).toMatch(/^var\(--[\w-]+\s*(,.*)?\)$/);
                const color = await computed(page, cls, jsProp);
                if (value) {
                    // 2. 값(PM 결정·제안값)
                    expect(color, `${cls}의 계산된 색`).toBe(hexToRgb(value));
                } else {
                    expect(parseRgb(color)[3], `${cls}는 투명하지 않은 색이어야 함`).toBe(1);
                }
            }
        });
    }
});

test.describe('3. 루트의 변수 값 하나를 바꾸면 그 토큰을 쓰는 요소의 색이 바뀐다', () => {
    for (const [name, { label }] of Object.entries(TOKENS)) {
        test(`${label}(${name})`, async ({ page }) => {
            const classes = UTILITIES.map(([prefix]) => `${prefix}-${name}`);
            await mountUtilities(page, classes);
            const declared = await declaredValue(page, `bg-${name}`, 'background-color');
            const variable = declared?.match(/^var\((--[\w-]+)/)?.[1];
            if (!variable) throw new Error(`bg-${name}가 참조하는 변수를 찾지 못함: ${declared}`);

            const probe = 'rgb(1, 2, 3)';
            await page.evaluate(([v, c]) => document.documentElement.style.setProperty(v, c), [variable, probe]);
            for (const [prefix, , jsProp] of UTILITIES) {
                expect(await computed(page, `${prefix}-${name}`, jsProp), `${prefix}-${name}`).toBe(probe);
            }
            // 값이 다른 토큰은 함께 바뀌지 않는다(값이 같은 토큰끼리 변수를 공유하는 것은 허용)
            await mountUtilities(page, Object.keys(TOKENS).map((n) => `bg-${n}`));
            await page.evaluate(([v, c]) => document.documentElement.style.setProperty(v, c), [variable, probe]);
            for (const other of Object.keys(TOKENS)) {
                if (other === name || TOKENS[other].value === TOKENS[name].value) continue;
                expect(await computed(page, `bg-${other}`, 'backgroundColor'), `${other}는 그대로`).not.toBe(probe);
            }
        });
    }
});

test.describe('4. 글자·버튼 조합 대비', () => {
    const pairs: [string, string, string, number][] = [
        // [설명, 앞(글자·선), 뒤(배경), 최소 대비]
        ['흰 글자 / 버튼색', 'surface', 'primary-strong', 4.5],
        ['흰 글자 / 버튼 hover', 'surface', 'primary-hover', 4.5],
        ['강조 글자 / surface', 'primary-strong', 'surface', 4.5],
        ['강조 글자 / canvas', 'primary-strong', 'canvas', 4.5],
        ['강조 글자 / 연한 배경', 'primary-strong', 'primary-subtle', 4.5],
        ['보조 글자 / surface', 'foreground-muted', 'surface', 4.5],
        ['보조 글자 / canvas', 'foreground-muted', 'canvas', 4.5],
        ['입력 테두리 / surface', 'border-input', 'surface', 3],
        ['포커스 / canvas', 'focus', 'canvas', 3],
        // 추가 경계: 기본 글자와 오류 문구, 반전 배경 위 글자
        ['글자 / surface', 'foreground', 'surface', 4.5],
        ['글자 / canvas', 'foreground', 'canvas', 4.5],
        ['오류 글자 / surface', 'error', 'surface', 4.5],
        ['오류 글자 / canvas', 'error', 'canvas', 4.5],
        ['surface 글자 / inverse', 'surface', 'inverse', 4.5],
        ['포커스 / surface', 'focus', 'surface', 3],
        ['성공 글자 / surface', 'success', 'surface', 4.5],
        ['성공 글자 / canvas', 'success', 'canvas', 4.5],
    ];
    test('모든 조합이 기준 이상', async ({ page }) => {
        const colors = await tokenColors(page);
        const results = pairs.map(([label, fg, bg, min]) => {
            const ratio = contrast(colors[fg], colors[bg]);
            return { label, ratio: Math.round(ratio * 100) / 100, min, ok: ratio >= min };
        });
        expect(results.filter((r) => !r.ok), JSON.stringify(results)).toEqual([]);
    });

    test('흰 글자는 실제로 흰색(#FFFFFF)이다', async ({ page }) => {
        // 위 대비 계산에서 "흰 글자"를 surface로 계산했으므로 surface가 흰색인지 확인한다.
        const colors = await tokenColors(page);
        expect(colors.surface).toBe('rgb(255, 255, 255)');
    });
});

// 5. 포커스 동작은 이번 변경 전(develop)과 같다(PM 결정 2026-11-26: 앱이 새로 그리는 포커스 테두리 없음).
// 기준값(fixtures/focus-baseline.json)은 develop(28474e8) 코드에서 support/focus.ts로 만든 것이다. 손으로 고치지 않는다.
const focusBaseline = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures/focus-baseline.json'), 'utf8'),
) as Record<string, { tabs: FocusLook[]; clicks: FocusLook[] }>;

test.describe('5. 포커스 동작(Tab 이동·입력칸 클릭)의 표시가 develop과 같다', () => {
    for (const { screen, editor } of focusScreens) {
        test(`${screen.name}`, async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 800 });
            await prepare(page, editor ? editorState : {});
            await screen.open(page);
            await settle(page);
            const tabs = await tabLooks(page);
            const clicks = await clickLooks(page);
            const expected = focusBaseline[screen.name];
            expect(tabs, 'Tab 이동 때의 포커스 표시').toEqual(expected.tabs);
            expect(clicks, '입력칸 클릭 때의 포커스 표시').toEqual(expected.clicks);
        });
    }
});

test.describe('6. 본문의 실제 렌더 글꼴이 저장소의 Pretendard 폰트 파일이다', () => {
    const fontFiles = fs
        .readdirSync(path.join(root, 'src'), { recursive: true, encoding: 'utf8' })
        .filter((f) => /pretendard/i.test(path.basename(f)) && /\.(woff2?|otf|ttf)$/i.test(f))
        .map((f) => createHash('sha256').update(fs.readFileSync(path.join(root, 'src', f))).digest('hex'));

    test('저장소에 Pretendard 폰트 파일이 있다', () => {
        expect(fontFiles.length).toBeGreaterThan(0);
    });

    for (const screen of screens) {
        test(`${screen.name}`, async ({ page }) => {
            const served: string[] = [];
            page.on('response', async (res) => {
                if (res.request().resourceType() !== 'font') return;
                served.push(createHash('sha256').update(await res.body()).digest('hex'));
            });
            await prepare(page);
            await screen.open(page);
            await settle(page);

            // 글자가 직접 들어 있는 보이는 요소(한글·영문)를 표시한다.
            const count = await page.evaluate(() => {
                let n = 0;
                for (const el of document.body.querySelectorAll('*')) {
                    if (el.closest('script,style,noscript,svg,[aria-hidden="true"]')) continue;
                    const own = [...el.childNodes]
                        .filter((c) => c.nodeType === Node.TEXT_NODE)
                        .map((c) => c.textContent ?? '')
                        .join('')
                        .trim();
                    const rect = el.getBoundingClientRect();
                    if (!/[가-힣A-Za-z]/.test(own) || rect.width === 0 || rect.height === 0) continue;
                    el.setAttribute('data-qa-font', String(n++));
                }
                return n;
            });
            expect(count, '글자가 있는 요소').toBeGreaterThan(0);

            const cdp = await page.context().newCDPSession(page);
            await cdp.send('DOM.enable');
            await cdp.send('CSS.enable');
            const { root: doc } = await cdp.send('DOM.getDocument', { depth: -1 });
            const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
                nodeId: doc.nodeId,
                selector: '[data-qa-font]',
            });
            const wrong: string[] = [];
            for (const nodeId of nodeIds) {
                const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
                const used = fonts.filter((f) => f.glyphCount > 0);
                const bad = used.filter((f) => !f.isCustomFont || !/pretendard/i.test(f.familyName));
                if (used.length === 0 || bad.length > 0) {
                    const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId });
                    wrong.push(
                        `${outerHTML.slice(0, 60)} -> ${used.map((f) => `${f.familyName}${f.isCustomFont ? '(웹폰트)' : '(시스템)'}`).join(', ')}`,
                    );
                }
            }
            expect(wrong, '시스템 글꼴로 그려진 글자').toEqual([]);
            expect(
                served.some((hash) => fontFiles.includes(hash)),
                '저장소의 Pretendard 파일이 그대로 내려와야 함',
            ).toBe(true);
        });
    }
});

test.describe('7. 기존 색 값과 기존 화면의 계산된 색이 그대로다', () => {
    test('main-*, gray-*, red-*, white 유틸리티의 색', async ({ page }) => {
        const classes = Object.keys(baseline.utilities);
        await mountUtilities(page, classes);
        const actual: Record<string, string> = {};
        for (const cls of classes) actual[cls] = await computed(page, cls, 'backgroundColor');
        expect(actual).toEqual(baseline.utilities);
    });

    for (const screen of screens) {
        test(`${screen.name} 화면`, async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 800 });
            await prepare(page);
            await screen.open(page);
            await settle(page);
            const actual = await collectColors(page);
            const expected = baseline.screens[screen.name];
            const diff = Object.keys({ ...expected, ...actual })
                .filter((key) => JSON.stringify(expected[key]) !== JSON.stringify(actual[key]))
                .map((key) => ({ key, expected: expected[key], actual: actual[key] }));
            expect(diff, JSON.stringify(diff.slice(0, 10), null, 1)).toEqual([]);
        });
    }
});

test.describe('8. 320px 폭에서 새 가로 스크롤이 생기지 않는다', () => {
    for (const screen of screens) {
        test(`${screen.name}`, async ({ page }) => {
            await page.setViewportSize({ width: 320, height: 800 });
            await prepare(page);
            await screen.open(page);
            await settle(page);
            const width = await page.evaluate(() => document.documentElement.scrollWidth);
            // 구현 전부터 넘치던 화면은 그 폭보다 넓어지지 않아야 한다.
            expect(width).toBeLessThanOrEqual(Math.max(320, baseline.scrollWidth320[screen.name]));
        });
    }
});

test('9. 새 의존성이 없다', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
    for (const field of ['dependencies', 'devDependencies'] as const) {
        expect(pkg[field] ?? {}, `package.json ${field}`).toEqual(baseline.packages[field]);
        expect(lock.packages[''][field] ?? {}, `package-lock.json ${field}`).toEqual(baseline.packages[field]);
    }
    for (const field of ['optionalDependencies', 'peerDependencies', 'bundleDependencies']) {
        expect(pkg[field], `package.json ${field}`).toBeUndefined();
    }
});
