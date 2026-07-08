import { useEffect, useRef, useState } from 'react';

interface UseTimerOptions {
    initialSeconds: number;
    onExpire?: () => void;
}

export function useTimer({ initialSeconds, onExpire }: UseTimerOptions): number {
    const [remaining, setRemaining] = useState(initialSeconds);
    const onExpireRef = useRef(onExpire);
    const expiredRef = useRef(false);

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        if (initialSeconds <= 0) return;
        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    expiredRef.current = true;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (remaining === 0 && expiredRef.current) onExpireRef.current?.();
    }, [remaining]);

    return remaining;
}
