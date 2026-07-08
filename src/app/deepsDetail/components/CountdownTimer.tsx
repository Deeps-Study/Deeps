'use client';

import Tag from '@/components/Tag';
import { useTimer } from '@/hooks/useTimer';

interface CountdownTimerProps {
    initialSeconds: number;
    onExpire?: () => void;
}

function formatTime(totalSeconds: number): string {
    const clamped = Math.max(0, totalSeconds);
    const h = Math.floor(clamped / 3600);
    const m = Math.floor((clamped % 3600) / 60);
    const s = clamped % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CountdownTimer({ initialSeconds, onExpire }: CountdownTimerProps) {
    const remaining = useTimer({ initialSeconds, onExpire });
    return <Tag variant="red">{formatTime(remaining)}</Tag>;
}
