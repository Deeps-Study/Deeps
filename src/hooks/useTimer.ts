import { useEffect, useRef, useState } from 'react';

interface UseTimerOptions {
    expiredAtMs: number;
    onExpire?: () => void;
}

function getRemaining(expiredAtMs: number): number {
    return Math.max(0, Math.ceil((expiredAtMs - Date.now()) / 1000));
}

export function useTimer({ expiredAtMs, onExpire }: UseTimerOptions): number {
    const [remaining, setRemaining] = useState(() => getRemaining(expiredAtMs));
    const onExpireRef = useRef(onExpire);
    const expiredRef = useRef(false);

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        function tick() {
            const next = getRemaining(expiredAtMs);
            setRemaining(next);
            if (next <= 0 && !expiredRef.current) {
                expiredRef.current = true;
                clearInterval(interval);
                onExpireRef.current?.();
            }
        }

        const interval = setInterval(tick, 1000);
        tick();
        return () => clearInterval(interval);
    }, [expiredAtMs]);

    return remaining;
}
