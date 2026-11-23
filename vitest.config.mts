import { defineConfig } from 'vitest/config';

export default defineConfig({
    // 센서 테스트에는 앱의 .env와 PostCSS 설정이 필요 없다.
    envDir: false,
    css: { postcss: {} },
    test: {
        include: ['scripts/**/*.test.mjs'],
        testTimeout: 30_000,
    },
});
