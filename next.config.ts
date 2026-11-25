import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
        ],
    },
    // 이전 주소로 저장된 링크를 새 주소로 보낸다. 쿼리는 그대로 전달된다.
    async redirects() {
        return [
            { source: '/home', destination: '/', permanent: false },
            { source: '/nickname', destination: '/onboarding', permanent: false },
        ];
    },
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
    },
};
export default nextConfig;
