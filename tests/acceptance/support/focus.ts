import type { Page } from '@playwright/test';
import { editorScreens, screens, type Screen } from './screens';

/** 포커스 동작 비교 대상: 기존 화면 5개와 편집기 화면 2개 */
export const focusScreens: { screen: Screen; editor: boolean }[] = [
    ...screens.map((screen) => ({ screen, editor: false })),
    ...editorScreens.map((screen) => ({ screen, editor: true })),
];

export interface FocusLook {
    element: string;
    focusVisible: boolean;
    outline: string;
    boxShadow: string;
}

/** 지금 포커스된 요소의 포커스 표시(outline·box-shadow)를 transition이 끝난 뒤 읽는다. */
export function focusLook(page: Page): Promise<FocusLook | null> {
    return page.evaluate(async () => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));
        const s = getComputedStyle(el);
        const label = (el.getAttribute('aria-label') ?? el.getAttribute('placeholder') ?? el.textContent ?? '').trim();
        return {
            element: `${el.tagName.toLowerCase()}${el.isContentEditable ? '[편집]' : ''} ${label.slice(0, 20)}`,
            focusVisible: el.matches(':focus-visible'),
            outline:
                s.outlineStyle === 'none'
                    ? 'none'
                    : `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} offset ${s.outlineOffset}`,
            boxShadow: s.boxShadow,
        };
    });
}

/** Tab으로 한 바퀴 돌며 포커스 표시를 모은다. 편집 본문에 닿으면 그 표시까지 담고 멈춘다. */
export async function tabLooks(page: Page): Promise<FocusLook[]> {
    const seen: FocusLook[] = [];
    const handles = [];
    for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        const handle = await page.evaluateHandle(() => document.activeElement);
        if (handles.length > 0 && (await page.evaluate(([a, b]) => a === b, [handles[0], handle] as const))) break;
        const look = await focusLook(page);
        if (!look) continue;
        handles.push(handle);
        seen.push(look);
        if (look.element.includes('[편집]')) break;
    }
    return seen;
}

/** 기준값에서 브라우저 기본 포커스 링 색 대신 쓰는 이름 */
export const UA_RING = '브라우저 기본색';

/**
 * 같은 브라우저·OS에서 앱 스타일이 닿지 않는 버튼(빈 shadow root 안)에 포커스를 주고
 * 기본 포커스 링 색을 읽는다. 기본 링 색은 OS마다 다르다(macOS 파랑, Linux 짙은 회색).
 * 마지막 입력이 키보드일 때 불러야 :focus-visible이 된다.
 */
export async function uaRingColor(page: Page): Promise<string> {
    const result = await page.evaluate(async () => {
        const host = document.createElement('div');
        host.style.all = 'initial';
        const button = document.createElement('button');
        button.textContent = 'qa-ref';
        host.attachShadow({ mode: 'open' }).append(button);
        document.body.append(host);
        button.focus();
        await Promise.all(button.getAnimations().map((a) => a.finished.catch(() => undefined)));
        const s = getComputedStyle(button);
        const out = { focusVisible: button.matches(':focus-visible'), style: s.outlineStyle, color: s.outlineColor };
        host.remove();
        return out;
    });
    if (!result.focusVisible || result.style === 'none') {
        throw new Error(`참조 버튼의 기본 포커스 링을 읽지 못함: ${JSON.stringify(result)}`);
    }
    return result.color;
}

/** outline 색이 브라우저 기본 링 색과 같으면 이름으로 바꾼다(OS 차이를 지운다). */
export function normalizeRing(looks: FocusLook[], ringColor: string): FocusLook[] {
    return looks.map((look) => ({ ...look, outline: look.outline.split(ringColor).join(UA_RING) }));
}

/** 보이는 입력칸(input, textarea, 편집 본문)을 마우스로 하나씩 눌렀을 때의 포커스 표시 */
export async function clickLooks(page: Page): Promise<FocusLook[]> {
    const targets = page.locator('input:visible, textarea:visible, [contenteditable="true"]:visible');
    const out: FocusLook[] = [];
    const count = await targets.count();
    for (let i = 0; i < count; i++) {
        await targets.nth(i).click();
        const look = await focusLook(page);
        if (look) out.push(look);
    }
    return out;
}
