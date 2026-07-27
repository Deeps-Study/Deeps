'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon/Icon';
import type { DeepsItemResponse } from '@/types/deeps';
import { formatTime } from '@/utils/time';

interface DeepsCardProps {
    deeps: DeepsItemResponse;
    studyId: string;
    totalMemberCount: number;
}

export default function DeepsCard({
    deeps,
    studyId,
    totalMemberCount,
}: DeepsCardProps) {
    const router = useRouter();
    const {
        id,
        title,
        creator,
        expiredAt,
        isSubmitted,
        isCreator,
        submittedCount,
    } = deeps;

    // 만료 일시(expiredAt) 기반으로 현재 남아있는 초 연산
    const getRemainingSeconds = () => {
        const endTime = new Date(expiredAt).getTime();
        const now = new Date().getTime();
        const differenceSeconds = Math.floor((endTime - now) / 1000);
        return differenceSeconds > 0 ? differenceSeconds : 0;
    };

    const remaining = getRemainingSeconds();
    const currentIsTimeEnded = remaining <= 0;
    const targetMemberCount = totalMemberCount - 1;

    // 답변 상태 배지
    const renderAnswerStatus = () => {
        if (isCreator || currentIsTimeEnded) return null;

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
        <div
            onClick={() => router.push(`/deepsDetail/${studyId}/${id}`)}
            className="flex flex-col gap-2 rounded-lg border border-main-20 bg-white px-3 py-3 shadow-sm hover:shadow-mint hover:cursor-pointer transition-all"
        >
            <div className="flex items-center gap-2.5 border-b border-main-20 pb-3">
                {/* 작성자 프로필사진 */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-main-20 bg-white text-base font-bold overflow-hidden select-none">
                    {creator?.image ? (
                        <Image
                            src={creator.image}
                            alt={creator.nickname ?? '작성자 프로필'}
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <Icon
                            name="user"
                            className="w-4 h-4 text-main-100 stroke-2 fill-current"
                        />
                    )}
                </div>
                {/* 딥스 제목 */}
                <div className="flex flex-1 px-1.5">
                    <p className="text-base font-bold text-gray-600">{title}</p>
                </div>
            </div>

            <div className="flex items-center justify-between px-1.5 py-2">
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1">
                        <Icon
                            name="user"
                            className="h-3 w-3 text-main-200 stroke-2"
                        />
                        <span className="text-xs font-medium text-gray-600">
                            {creator?.nickname ?? '탈퇴한 사용자'}
                        </span>
                    </div>
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
                            {submittedCount} / {targetMemberCount}
                        </span>
                    </div>
                </div>

                {renderAnswerStatus()}
            </div>
        </div>
    );
}
