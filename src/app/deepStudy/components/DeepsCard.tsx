'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Icon from '@/ui/Icon/Icon';
import { DeepsModel } from '@/types/study';

interface DeepsCardProps {
    deeps: DeepsModel;
}

function formatTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DeepsCard({ deeps }: DeepsCardProps) {
    const {
        title,
        creator,
        solvedCount,
        totalCount,
        isMyAnswered,
        createdAt,
        timeLimit,
    } = deeps;

    const getInitialRemainingSeconds = () => {
        const createdTime = new Date(createdAt).getTime();
        const limitTime = timeLimit * 1000;
        const endTime = createdTime + limitTime;
        const now = new Date().getTime();

        const differenceSeconds = Math.floor((endTime - now) / 1000);
        return differenceSeconds > 0 ? differenceSeconds : 0;
    };

    const [remaining, setRemaining] = useState(getInitialRemainingSeconds);

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

    const isTimeEnded = remaining <= 0;

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-main-20 bg-white px-3 py-2 shadow-sm hover:shadow-mint hover:cursor-pointer transition-all">
            <div className="border-b border-main-20 py-2">
                <div className="flex items-start gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-main-20 bg-white text-base font-bold">
                        {creator.image ? (
                            <Image
                                src={creator.image}
                                alt={creator.nickname}
                                width={36}
                                height={36}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span>{creator.fallbackEmoji}</span>
                        )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 px-1.5">
                        <p className="text-base font-bold text-gray-600">
                            {title}
                        </p>
                        <div className="flex items-center gap-1">
                            <Icon
                                name="user"
                                className="h-3 w-3 text-main-200 stroke-2"
                            />
                            <span className="text-xs font-medium text-gray-600">
                                {creator.nickname}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-1.5 py-2">
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <Icon name="clock" className="h-4 w-4 text-main-200" />
                        <span className="text-xs font-medium text-gray-600">
                            {formatTime(remaining)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon
                            name="users"
                            className="h-4 w-4 stroke-2 text-main-200"
                        />
                        <span className="text-xs font-medium text-gray-600">
                            {solvedCount} / {totalCount}
                        </span>
                    </div>
                </div>

                {!isTimeEnded && (
                    <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-md ${isMyAnswered ? 'bg-main-10' : 'bg-red-10'}`}
                    >
                        <Icon
                            name={isMyAnswered ? 'doubleCheck' : 'circleAlert'}
                            className={`h-3.5 w-3.5 stroke-2 ${isMyAnswered ? 'text-main-100' : 'text-red-200'}`}
                        />
                        <span
                            className={`text-xs font-medium ${isMyAnswered ? 'text-main-100' : 'text-red-200'}`}
                        >
                            {isMyAnswered ? '답변 완료' : '답변 필요'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
