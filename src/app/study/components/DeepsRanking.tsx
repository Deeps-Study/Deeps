'use client';

import Image from 'next/image';
import type { StudyMemberResponse } from '@/types/study';
import Icon from '@/ui/Icon/Icon';

interface DeepsRankingProps {
    members: StudyMemberResponse[];
}

export default function DeepsRanking({ members }: DeepsRankingProps) {
    const sortedMembers = [...members].sort(
        (a, b) => b.totalLikesReceived - a.totalLikesReceived,
    );

    return (
        <div className="flex flex-col gap-5">
            <h3 className="text-base font-semibold text-gray-600 tracking-tight">
                딥스 순위
            </h3>
            <div className="h-px w-full bg-main-20 -mt-1" />

            <div className="flex flex-col gap-2.5 mt-2">
                {sortedMembers.map((item, index) => {
                    const rank = index + 1;
                    return (
                        <div
                            key={item.id}
                            className="flex items-center justify-between rounded-xl bg-gray-50/50 px-4 py-3 border border-transparent hover:border-gray-100 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <span
                                    className={`text-sm font-semibold w-6 ${
                                        rank <= 3
                                            ? 'text-main-50'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {rank}
                                    <span className="text-gray-600">위</span>
                                </span>

                                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-main-20 bg-white text-sm overflow-hidden select-none">
                                    {item.profileImageUrl ? (
                                        <Image
                                            src={item.profileImageUrl}
                                            alt={`${item.nickname} 프로필`}
                                            width={28}
                                            height={28}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Icon
                                            name="user"
                                            className="w-4 h-4 text-main-100 stroke-2 fill-current"
                                        />
                                    )}
                                </div>

                                <span className="text-sm font-semibold text-gray-600">
                                    {item.nickname}
                                </span>
                            </div>

                            <span className="text-sm font-semibold text-main-50">
                                {item.totalLikesReceived}{' '}
                                <span className="text-gray-400 font-semibold ml-0.5">
                                    Likes
                                </span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
