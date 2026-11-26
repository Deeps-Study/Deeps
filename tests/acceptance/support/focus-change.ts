import type { ElementHandle, Page } from '@playwright/test';

/** 포커스 표시와 관련된 계산값(transition이 끝난 뒤) */
export interface FocusStyle {
    outline: string;
    outlineColor: string;
    boxShadow: string;
    border: string;
}

export function focusStyle(handle: ElementHandle<HTMLElement>): Promise<FocusStyle> {
    return handle.evaluate(async (el) => {
        await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));
        const s = getComputedStyle(el);
        return {
            outline: s.outlineStyle === 'none' ? 'none' : `${s.outlineStyle} ${s.outlineWidth}`,
            outlineColor: s.outlineColor,
            boxShadow: s.boxShadow,
            border: ['top', 'right', 'bottom', 'left']
                .map((side) => `${s.getPropertyValue(`border-${side}-width`)} ${s.getPropertyValue(`border-${side}-color`)}`)
                .join(' / '),
        };
    });
}

export async function activeHandle(page: Page) {
    const handle = await page.evaluateHandle(() => document.activeElement as HTMLElement);
    const isBody = await handle.evaluate((el) => !el || el === document.body);
    return isBody ? null : (handle as ElementHandle<HTMLElement>);
}

export function describeElement(handle: ElementHandle<HTMLElement>) {
    return handle.evaluate((el) => {
        const label = (el.getAttribute('aria-label') ?? el.getAttribute('placeholder') ?? el.textContent ?? '').trim();
        return `${el.tagName.toLowerCase()} ${label.slice(0, 20)}`;
    });
}

/**
 * 같은 상태에서 포커스 여부만 다를 때, 앱이 새 포커스 표시를 그렸는지 본다.
 * - outline: 없음 또는 브라우저 기본 링(같은 실행에서 읽은 색, uaRingColor)만 허용
 * - box-shadow, 테두리(굵기·색): 포커스 전후가 같아야 함
 * 문제 목록을 돌려준다(없으면 빈 배열).
 */
export function focusProblems(focused: FocusStyle, blurred: FocusStyle, uaRing: string): string[] {
    const problems: string[] = [];
    const isUaRing = focused.outline.startsWith('auto ') && focused.outlineColor === uaRing;
    const same = focused.outline === blurred.outline && focused.outlineColor === blurred.outlineColor;
    if (focused.outline !== 'none' && !isUaRing && !same) {
        problems.push(`outline ${focused.outline} ${focused.outlineColor}`);
    }
    if (focused.boxShadow !== blurred.boxShadow) problems.push(`box-shadow ${blurred.boxShadow} -> ${focused.boxShadow}`);
    if (focused.border !== blurred.border) problems.push(`border ${blurred.border} -> ${focused.border}`);
    return problems;
}
