'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
    initialSeconds: number;
}

function formatTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CountdownTimer({ initialSeconds }: CountdownTimerProps) {
    const [remaining, setRemaining] = useState(initialSeconds);

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span className="py-1 px-2.5 text-xs font-medium rounded-[20px] border border-red-20 bg-red-10 text-red-200">
            {formatTime(remaining)}
        </span>
    );
}
