import { test as base } from '@playwright/test';
import { BACKEND_URL, BROWSER_URL } from './env';

const allowedOrigins = [BACKEND_URL, BROWSER_URL];

/** 외부 요청을 막고, 막은 주소를 기록하는 브라우저 테스트 */
export const test = base.extend<{ blockedUrls: string[] }>({
    blockedUrls: [
        async ({ context }, use) => {
            const blocked: string[] = [];
            await context.route(
                (url) => !allowedOrigins.includes(url.origin),
                (route) => {
                    blocked.push(route.request().url());
                    return route.abort('blockedbyclient');
                },
            );
            await use(blocked);
        },
        { auto: true },
    ],
});

export { expect } from '@playwright/test';
