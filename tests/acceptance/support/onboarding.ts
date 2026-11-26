import type { Page } from '@playwright/test';
import { expect } from './browser';

/** 이슈 #152 5단계 온보딩 화면의 요소(문구는 완료 조건 그대로) */
export const onboarding = {
    input: (page: Page) => page.getByRole('textbox', { name: '닉네임', exact: true }),
    check: (page: Page) => page.getByRole('button', { name: '중복 확인', exact: true }),
    start: (page: Page) => page.getByRole('button', { name: 'Deeps 시작하기', exact: true }),
    available: '사용할 수 있는 닉네임이에요.',
};

/** 닉네임을 넣고 중복 확인을 통과한 뒤 "Deeps 시작하기"를 누른다. */
export async function completeOnboarding(page: Page, nickname = 'tester') {
    const input = onboarding.input(page);
    await expect(input).toBeVisible();
    await input.fill(nickname);
    await onboarding.check(page).click();
    await expect(
        page.getByText(onboarding.available, { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();
    await onboarding.start(page).click();
}
