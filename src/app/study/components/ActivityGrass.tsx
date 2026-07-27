'use client';

import { useEffect, useRef } from 'react';
import { StudyMemberResponse } from '@/types/study';
import Image from 'next/image';
import Icon from '@/ui/Icon/Icon';

interface ActivityGrassProps {
    members: StudyMemberResponse[];
    startDate: string;
    endDate: string;
}

// 스터디 기간(startDate ~ endDate) 내의 모든 YYYY-MM-DD 날짜 배열 생성
const getStudyDateRange = (startStr: string, endStr: string): string[] => {
    const dates: string[] = [];
    const current = new Date(startStr);
    const last = new Date(endStr);

    while (current <= last) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
};

export default function ActivityGrass({
    members,
    startDate,
    endDate,
}: ActivityGrassProps) {
    const dates = getStudyDateRange(startDate, endDate);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 컴포넌트 마운트 시 스크롤을 가장 오른쪽(오늘/최신 날짜)으로 이동
    useEffect(() => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayIndex = dates.indexOf(todayStr);

        // 스터디 기간 내에 오늘 날짜가 포함된 경우
        if (todayIndex !== -1) {
            // 셀 1개의 너비 (w-5 = 20px) + gap-1.5 (6px) = 26px
            const CELL_WIDTH = 20;
            const GAP = 6;
            const CELL_TOTAL_WIDTH = CELL_WIDTH + GAP;

            // 프로필 고정 영역의 너비 (w-5(20px) + pr-3(12px) + gap-4(16px) ≈ 약 48px)
            // 정확한 프로필 sticky 레이아웃 offset을 반영합니다.
            const PROFILE_OFFSET = 48;

            // 오늘 날짜 셀의 X축 시작 지점
            const todayCellLeft =
                PROFILE_OFFSET + todayIndex * CELL_TOTAL_WIDTH;

            // 컨테이너 중앙 위치 계산
            const containerWidth = container.clientWidth;
            const targetScrollLeft =
                todayCellLeft - containerWidth / 2 + CELL_WIDTH / 2;

            container.scrollLeft = Math.max(0, targetScrollLeft);
        } else {
            // 스터디가 이미 종료되었거나 아직 시작 전인 경우 예외 처리
            const firstDate = dates[0];
            const lastDate = dates[dates.length - 1];

            if (todayStr > lastDate) {
                // 이미 끝난 스터디면 맨 오른쪽(종료일)으로 스크롤
                container.scrollLeft = container.scrollWidth;
            } else if (todayStr < firstDate) {
                // 시작 예정인 스터디면 맨 왼쪽(시작일)으로 스크롤
                container.scrollLeft = 0;
            }
        }
    }, [startDate, endDate, dates]);

    const getGrassColorClass = (score: number): string => {
        if (score === 0) return 'bg-gray-100';
        if (score === 1) return 'bg-main-20';
        if (score === 2) return 'bg-main-40';
        return 'bg-main-50';
    };

    return (
        <div className="flex flex-col w-full">
            <div className="w-full rounded-2xl border border-main-20 p-5 bg-white shadow-mint flex flex-col gap-2 overflow-hidden">
                <div
                    ref={scrollContainerRef}
                    className="w-full overflow-x-auto scroll-smooth pb-2 thin-scrollbar-on-hover"
                >
                    <div className="flex flex-col gap-2 min-w-max">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-4"
                            >
                                {/* 프로필 아바타 (고정 영역) */}
                                <div className="sticky left-0 z-20 flex items-center pr-3 bg-white shrink-0">
                                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-gray-50 border border-main-20 text-[10px] overflow-hidden sticky left-0 z-10">
                                        {member.profileImageUrl ? (
                                            <Image
                                                src={member.profileImageUrl}
                                                alt={`${member.nickname} 프로필`}
                                                width={20}
                                                height={20}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full p-0.5">
                                                <Icon
                                                    name="user"
                                                    className="w-3 h-3 text-main-100 stroke-2 fill-current"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* 잔디밭 매트릭스 라인 (날짜 개수만큼 가로 배열) */}
                                <div className="flex gap-1.5 shrink-0">
                                    {dates.map((dateStr) => {
                                        const log = member.activityLogs.find(
                                            (l) => l.date === dateStr,
                                        );

                                        const score = log
                                            ? log.deepsCreatedCount +
                                              log.answersSolvedCount
                                            : 0;

                                        return (
                                            <div
                                                key={dateStr}
                                                title={`${dateStr}: ${score}회 활동`}
                                                className={`h-5 w-5 rounded-sm shrink-0 transition-colors ${getGrassColorClass(
                                                    score,
                                                )}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 잔디밭 범례 가이드 */}
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
