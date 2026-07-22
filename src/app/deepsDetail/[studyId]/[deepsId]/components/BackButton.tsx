'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon/Icon';

interface BackButtonProps {
    studyId: string;
}

export default function BackButton({ studyId }: BackButtonProps) {
    const router = useRouter();
    return (
        <button
            type="button"
            onClick={() => router.push(`/study/${studyId}`)}
            className="text-main-100 hover:text-main-200 transition-colors"
        >
            <Icon name="leftArrow" className="w-6 h-6" />
        </button>
    );
}
