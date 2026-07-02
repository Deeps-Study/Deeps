'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon/Icon';

function BackButton() {
    const router = useRouter();
    return (
        <button
            type="button"
            onClick={() => router.back()}
            className="text-main-100 hover:text-main-200 transition-colors"
        >
            <Icon name="leftArrow" className="w-6 h-6" />
        </button>
    );
}

export default memo(BackButton);
