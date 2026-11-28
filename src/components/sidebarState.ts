/*
 * 넓은 폭 사이드바 접힘 상태(docs/decisions.md 2026-11-28).
 * 서버 레이아웃이 쿠키를 읽어 첫 HTML부터 맞는 폭을 그리고, 브라우저는 접기/펼치기 때 쿠키를 갱신한다.
 * 처음 방문(쿠키 없음)은 펼침. 쿠키가 막히면 화면 안 상태만 바뀐다(AppShell의 메모리 값).
 */

export const SIDEBAR_COOKIE = 'sidebar_collapsed';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function parseSidebarCollapsed(value: string | undefined): boolean {
    return value === '1';
}

/** 브라우저 쿠키에서 읽는다. 서버에서는 null. */
export function readSidebarCollapsedCookie(): boolean | null {
    if (typeof document === 'undefined') return null;
    const entry = document.cookie
        .split('; ')
        .find((c) => c.startsWith(`${SIDEBAR_COOKIE}=`));
    return parseSidebarCollapsed(entry?.slice(SIDEBAR_COOKIE.length + 1));
}

/** 만료 시각이 있는 쿠키로 저장한다(브라우저를 닫았다 열어도 유지). */
export function writeSidebarCollapsedCookie(collapsed: boolean) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? '1' : '0'}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure}`;
}
