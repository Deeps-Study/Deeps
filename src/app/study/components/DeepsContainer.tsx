'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon/Icon';
import SquareButton from '@/components/SquareButton';
import DeepsCard from './DeepsCard';
import type { DeepsItemResponse } from '@/types/study';

interface DeepsContainerProps {
    deepsList: DeepsItemResponse[];
    studyId?: string;
    totalMemberCount: number;
}

export default function DeepsContainer({
    deepsList = [],
    studyId,
    totalMemberCount,
}: DeepsContainerProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'progress' | 'completed'>(
        'progress',
    );

    // 1초마다 업데이트되는 현재 시간 State
    const [now, setNow] = useState<number>(() => Date.now());

    useEffect(() => {
        // 1초마다 now 상태를 갱신하여 타이머 만료 시 자동으로 리렌더링을 유발
        const timer = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleCreateDeeps = () => {
        if (studyId) {
            router.push(`/deepsCreator/${studyId}`);
        }
    };

    // now가 1초마다 바뀌므로 progress / completed 목록이 자동으로 재계산
    const progressDeeps = deepsList.filter(
        (deep) => new Date(deep.expiredAt).getTime() > now,
    );
    const completedDeeps = deepsList.filter(
        (deep) => new Date(deep.expiredAt).getTime() <= now,
    );

    const displayDeeps =
        activeTab === 'progress' ? progressDeeps : completedDeeps;

    return (
        <div className="flex flex-col gap-5">
            {/* 탭 헤더 영역 */}
            <div className="flex items-center justify-between border-b border-main-20 pb-3">
                <div className="flex gap-4 text-base font-bold">
                    <button
                        onClick={() => setActiveTab('progress')}
                        className={`pb-3 -mb-3.25 border-b-2 cursor-pointer transition-all ${
                            activeTab === 'progress'
                                ? 'border-b-main-100 text-main-100'
                                : 'border-b-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        진행중
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`pb-3 -mb-3.25 border-b-2 cursor-pointer transition-all ${
                            activeTab === 'completed'
                                ? 'border-b-main-100 text-main-100'
                                : 'border-b-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        완료됨
                    </button>
                </div>

                <button
                    onClick={handleCreateDeeps}
                    className="flex items-center gap-1.5 rounded-lg border border-main-20 bg-white px-3 py-1.5 text-xs font-bold text-main-100 hover:bg-main-10 transition-colors cursor-pointer"
                >
                    <Icon name="plus" className="h-3.5 w-3.5 stroke-3" />
                    딥스 만들기
                </button>
            </div>

            {/* 목록 카드 노출 */}
            {displayDeeps.length === 0 ? (
                <SquareButton onClick={handleCreateDeeps}>
                    <Icon name="plus" className="h-3.5 w-3.5 stroke-3" />
                    딥스 만들기
                </SquareButton>
            ) : (
                <div className="flex flex-col gap-3.5">
                    {displayDeeps.map((deep) => (
                        <DeepsCard
                            key={deep.id}
                            deeps={deep}
                            studyId={studyId ?? ''}
                            totalMemberCount={totalMemberCount}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
