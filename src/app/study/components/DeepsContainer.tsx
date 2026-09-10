'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon/Icon';
import SquareButton from '@/components/SquareButton';
import DeepsCard from './DeepsCard';
import type { DeepsItemResponse } from '@/types/deeps';
import { triggerAlertModal } from '@/utils/alertModalStore';

interface DeepsContainerProps {
    deepsList: DeepsItemResponse[];
    studyId?: string;
    totalMemberCount: number;
    studyStatus: 'BEFORE_START' | 'IN_PROGRESS' | 'ENDED';
}

export default function DeepsContainer({
    deepsList = [],
    studyId,
    totalMemberCount,
    studyStatus,
}: DeepsContainerProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'progress' | 'completed'>(
        'progress',
    );

    // 1초마다 업데이트되는 현재 시간 State
    const [now, setNow] = useState<number>(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const isStudyInProgress = studyStatus === 'IN_PROGRESS';

    const handleCreateDeeps = () => {
        if (!isStudyInProgress) {
            triggerAlertModal({
                title: '딥스 생성 불가',
                message:
                    studyStatus === 'BEFORE_START'
                        ? '스터디 시작 전에는 딥스를 생성할 수 없습니다.'
                        : '종료된 스터디에서는 딥스를 생성할 수 없습니다.',
            });
            return;
        }
        if (studyId) {
            router.push(`/deepsCreator/${studyId}`);
        }
    };

    // 만료 여부로 필터링
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
            <div className="flex items-center justify-between border-b border-main-20">
                <div className="flex gap-6 text-base font-bold">
                    <button
                        onClick={() => setActiveTab('progress')}
                        className={`pb-3 border-b-2 cursor-pointer transition-all -mb-[1px] ${
                            activeTab === 'progress'
                                ? 'border-b-main-100 text-main-100'
                                : 'border-b-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        진행중
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`pb-3 border-b-2 cursor-pointer transition-all -mb-[1px] ${
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
                    disabled={!isStudyInProgress}
                    className={`mb-2 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                        isStudyInProgress
                            ? ' border-main-20 bg-white  text-main-100 hover:bg-main-10 cursor-pointer'
                            : 'border-gray-200 bg-gray-100 text-gray-400 '
                    }`}
                >
                    <Icon name="plus" className="h-3.5 w-3.5 stroke-3" />
                    딥스 만들기
                </button>
            </div>

            {/* 목록 영역: 빈 상태 및 카드 목록 렌더링 분기 */}
            {displayDeeps.length === 0 ? (
                activeTab === 'progress' ? (
                    // 진행 중 딥스가 없을 때: 만들기 유도 버튼 표시
                    isStudyInProgress ? (
                        <SquareButton onClick={handleCreateDeeps}>
                            <Icon
                                name="plus"
                                className="h-3.5 w-3.5 stroke-3"
                            />
                            딥스 만들기
                        </SquareButton>
                    ) : (
                        <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-gray-50 text-sm font-medium text-gray-400">
                            {studyStatus === 'BEFORE_START'
                                ? '스터디 시작 전에는 딥스를 생성할 수 없습니다.'
                                : '진행 중인 딥스가 없습니다.'}
                        </div>
                    )
                ) : (
                    // 완료된 딥스가 없을 때: 회색 안내 문구 표시
                    <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-gray-50 text-sm font-medium text-gray-400">
                        완료된 딥스가 없습니다.
                    </div>
                )
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
