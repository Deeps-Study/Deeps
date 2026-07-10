'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon/Icon';

export function MyPageHeader() {
    const router = useRouter();
    return (
        <header className="bg-white border-b border-gray-100 flex items-center gap-4 h-16.5 px-8 shrink-0">
            <button
                type="button"
                onClick={() => router.back()}
                className="text-main-100 hover:text-main-200 transition-colors"
            >
                <Icon name="leftArrow" className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-main-100">프로필 및 설정</h1>
        </header>
    );
}
