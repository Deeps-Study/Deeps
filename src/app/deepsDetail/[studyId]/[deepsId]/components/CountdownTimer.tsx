'use client';

import Tag from '@/components/Tag';
import { formatTime } from '@/utils/time';
import { useTimer } from '@/hooks/useTimer';

interface CountdownTimerProps {
    expiredAtMs: number;
    onExpire?: () => void;
}

export function CountdownTimer({ expiredAtMs, onExpire }: CountdownTimerProps) {
    const remaining = useTimer({ expiredAtMs, onExpire });
    return <Tag variant="red">{formatTime(remaining)}</Tag>;
}
