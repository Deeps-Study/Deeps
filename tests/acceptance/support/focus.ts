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
