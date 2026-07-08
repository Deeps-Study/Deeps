'use client';

import Tag from '@/components/Tag';
import { useEffect, useRef, useState } from 'react';

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

export function CountdownTimer({
    initialSeconds,
    onExpire,
}: CountdownTimerProps) {
    const [remaining, setRemaining] = useState(initialSeconds);
    const onExpireRef = useRef(onExpire);

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        if (initialSeconds <= 0) return;
        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onExpireRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <Tag variant="red">{formatTime(remaining)}</Tag>;
}
