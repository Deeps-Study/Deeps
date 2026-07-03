'use client';

import Image from 'next/image';
import { StudyDetailModel } from '@/types/study';

interface ActivityGrassProps {
    members: StudyDetailModel['members'];
}

export default function ActivityGrass({ members }: ActivityGrassProps) {
    return (
        <div className="flex flex-col w-full">
            <div className="w-full rounded-2xl border border-main-20 p-5 bg-white shadow-mint flex flex-col gap-2">
                {members.map((member, memberIndex) => (
                    <div
                        key={memberIndex}
                        className="flex items-center gap-4 w-full"
                    >
                        <div className="h-5 w-5 shrink-0 flex items-center justify-center rounded-full bg-gray-50 border border-main-20 text-[10px] overflow-hidden">
                            {member.image ? (
                                <Image
                                    src={member.image}
                                    alt={`${member.nickname} 프로필`}
                                    width={20}
                                    height={20}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span>{member.fallbackEmoji}</span>
                            )}
                        </div>

                        <div className="flex-1 grid grid-cols-14 gap-1.5">
                            {Array.from({ length: 14 }).map((_, colIndex) => {
                                // 임시 색상 분기를 위한 조건 (실제 데이터 연동 시 step별 색상 클래스 적용 가능)
                                const isColored =
                                    (memberIndex + colIndex) % 4 === 0;
                                const isDeepColored =
                                    (memberIndex * colIndex) % 7 === 0;

                                return (
                                    <div
                                        key={colIndex}
                                        className={`aspect-square w-full rounded-sm transition-colors ${
                                            isDeepColored
                                                ? 'bg-main-50'
                                                : isColored
                                                  ? 'bg-main-40'
                                                  : 'bg-gray-100'
                                        } `}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex w-full justify-between items-center mt-3 text-xs font-medium text-gray-300 px-1">
                <span>딥스 생성 / 풀기를 할 수록 잔디가 짙어져요</span>
                <div className="flex items-center gap-1.5">
                    <span>4 steps</span>
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-xs bg-gray-100" />
                        <div className="w-2.5 h-2.5 rounded-xs bg-main-20" />
                        <div className="w-2.5 h-2.5 rounded-xs bg-main-40" />
                        <div className="w-2.5 h-2.5 rounded-xs bg-main-50" />
                    </div>
                </div>
            </div>
        </div>
    );
}
