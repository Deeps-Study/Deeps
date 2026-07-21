'use client';

import Image from 'next/image';
import Icon from '@/ui/Icon/Icon';
import type { DeepsItemResponse } from '@/types/study';
import { formatTime } from '@/utils/time';

interface DeepsCardProps {
    deeps: DeepsItemResponse;
}

export default function DeepsCard({ deeps }: DeepsCardProps) {
    const { title, creator, expiredAt, isSubmitted, submittedCount } = deeps;

    // 만료 일시(expiredAt) 기반으로 현재 남아있는 초 연산
    const getRemainingSeconds = () => {
        const endTime = new Date(expiredAt).getTime();
        const now = new Date().getTime();
        const differenceSeconds = Math.floor((endTime - now) / 1000);
        return differenceSeconds > 0 ? differenceSeconds : 0;
    };

    const remaining = getRemainingSeconds();
    const currentIsTimeEnded = remaining <= 0;

    // 답변 상태 배지
    const renderAnswerStatus = () => {
        if (currentIsTimeEnded) return null;

        if (isSubmitted) {
            return (
                <div className="flex items-center gap-1 px-1.5">
                    <Icon
                        name="doubleCheck"
                        className="h-4 w-4 text-main-100 stroke-2"
                    />
                    <span className="text-xs font-medium text-main-100">
                        답변 완료
                    </span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1 px-1.5">
                <Icon name="circleAlert" className="h-4 w-4 text-red-200" />
                <span className="text-xs font-medium text-red-200">
                    답변 필요
                </span>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-main-20 bg-white px-3 py-2 shadow-sm hover:shadow-mint hover:cursor-pointer transition-all">
            <div className="border-b border-main-20 py-2">
                <div className="flex items-start gap-2.5">
                    {/* 작성자 아바타 */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-main-20 bg-white text-base font-bold overflow-hidden select-none">
                        {creator.image ? (
                            <Image
                                src={creator.image}
                                alt={creator.nickname}
                                width={36}
                                height={36}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span>🐱</span>
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
                    {/* 카운트다운 타이머 */}
                    <div className="flex items-center gap-2">
                        <Icon name="clock" className="h-4 w-4 text-main-200" />
                        <span className="text-xs font-medium text-gray-600 tabular-nums">
                            {formatTime(remaining)}
                        </span>
                    </div>

                    {/* 제출 인원 수 */}
                    <div className="flex items-center gap-2">
                        <Icon
                            name="users"
                            className="h-4 w-4 stroke-2 text-main-200"
                        />
                        <span className="text-xs font-medium text-gray-600">
                            {submittedCount}명 제출
                        </span>
                    </div>
                </div>

                {renderAnswerStatus()}
            </div>
        </div>
    );
}
