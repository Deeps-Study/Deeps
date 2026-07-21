'use client';

import Tag from '@/components/Tag';
import { formatTime } from '@/utils/time';
import { useTimer } from '@/hooks/useTimer';

interface CountdownTimerProps {
    initialSeconds: number;
    onExpire?: () => void;
}

export function CountdownTimer({
    initialSeconds,
    onExpire,
}: CountdownTimerProps) {
    const remaining = useTimer({ initialSeconds, onExpire });
    return <Tag variant="red">{formatTime(remaining)}</Tag>;
}
