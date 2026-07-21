'use client';

import Image from 'next/image';
import type { StudyMemberResponse } from '@/types/study';
import Icon from '@/ui/Icon/Icon';

interface DeepsRankingProps {
    members: StudyMemberResponse[];
}

export default function DeepsRanking({ members = [] }: DeepsRankingProps) {
    // 1. 좋아요 수 내림차순 정렬
    const sortedMembers = [...members].sort(
        (a, b) => (b.totalLikesReceived ?? 0) - (a.totalLikesReceived ?? 0),
    );

    // 2. 동순위 계산 (React Compiler 에러 없는 reduce 방식)
    const rankedMembers = sortedMembers.reduce<
        Array<StudyMemberResponse & { rank: number }>
    >((acc, member, index) => {
        const likes = member.totalLikesReceived ?? 0;

        if (index === 0) {
            acc.push({ ...member, rank: 1 });
        } else {
            const prev = acc[index - 1];
            const prevLikes = prev.totalLikesReceived ?? 0;
            // 이전 멤버와 좋아요 수가 같으면 동순위, 다르면 (index + 1)위
            const rank = likes === prevLikes ? prev.rank : index + 1;
            acc.push({ ...member, rank });
        }

        return acc;
    }, []);

    return (
        <div className="flex flex-col gap-5">
            <h3 className="text-base font-semibold text-gray-600 tracking-tight">
                딥스 순위
            </h3>
            <div className="h-px w-full bg-main-20 -mt-1" />

            <div className="flex flex-col gap-2.5 mt-2">
                {rankedMembers.map((item, index) => {
                    // 이전 멤버와 순위가 같으면 순위 텍스트를 숨김
                    const isSameRankAsPrev =
                        index > 0 &&
                        rankedMembers[index - 1].rank === item.rank;

                    return (
                        <div
                            key={item.id}
                            className="flex items-center justify-between rounded-xl bg-gray-50/50 px-4 py-3 border border-transparent hover:border-gray-100 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <span
                                    className={`text-sm font-semibold w-6 ${
                                        item.rank <= 3
                                            ? 'text-main-50'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {/* 동순위일 때는 빈 문자열 처리하여 첫 번째 유저만 'N위' 표시 */}
                                    {!isSameRankAsPrev && (
                                        <>
                                            {item.rank}
                                            <span className="text-gray-600">
                                                위
                                            </span>
                                        </>
                                    )}
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
                                {item.totalLikesReceived ?? 0}{' '}
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
