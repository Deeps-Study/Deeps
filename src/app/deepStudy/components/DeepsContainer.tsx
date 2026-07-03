'use client';

import { useState } from 'react';
import Icon from '@/ui/Icon/Icon';
import SquareButton from '@/components/SquareButton';
import DeepsCard from './DeepsCard';
import type { Deeps } from '@/types/study';

// NOTE: 샘플 딥스 데이터 (실제로는 API에서 받아올 데이터)
const sampleDeeps: Deeps[] = [
    {
        id: '1',
        title: '피그마로 로티는 어떻게 구현할까요?',
        creator: '정딥스',
        emoji: '🦖',
        timeLeft: '07:30:06',
        solvedCount: 5,
        totalCount: 6,
        isAnswered: false,
        isTimeEnded: false,
    },
    {
        id: '2',
        title: '피그마로 로티는 어떻게 구현할까요?',
        creator: '김딥스',
        emoji: '✈️',
        timeLeft: '01:12:09',
        solvedCount: 6,
        totalCount: 6,
        isAnswered: true,
        isTimeEnded: false,
    },
    {
        id: '3',
        title: '피그마로 로티는 어떻게 구현할까요?',
        creator: '박딥스',
        emoji: '🦀',
        timeLeft: '00:00:00',
        solvedCount: 5,
        totalCount: 6,
        isAnswered: false,
        isTimeEnded: true,
    },
];

export default function DeepsContainer() {
    const [activeTab, setActiveTab] = useState<'progress' | 'completed'>(
        'progress',
    );

    // NOTE: 제한 시간 종료 여부에 따라 진행중/완료됨 탭에 자동으로 분류
    const progressDeeps = sampleDeeps.filter((deep) => !deep.isTimeEnded);
    const completedDeeps = sampleDeeps.filter((deep) => deep.isTimeEnded);

    const displayDeeps =
        activeTab === 'progress' ? progressDeeps : completedDeeps;

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-main-20 pb-3">
                <div className="flex gap-4 text-base font-medium">
                    <button
                        onClick={() => setActiveTab('progress')}
                        className={`pb-3 -mb-3.25 cursor-pointer transition-all ${
                            activeTab === 'progress'
                                ? 'text-main-100'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        진행중
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`pb-3 -mb-3.25 cursor-pointer transition-all ${
                            activeTab === 'completed'
                                ? 'text-main-100'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        완료됨
                    </button>
                </div>

                <button className="flex items-center gap-1.5 rounded-lg border border-main-20 bg-white px-3 py-1.5 text-xs font-bold text-main-100 hover:bg-main-10 transition-colors cursor-pointer">
                    <Icon name="plus" className="h-3.5 w-3.5 stroke-3" />
                    딥스 만들기
                </button>
            </div>

            {displayDeeps.length === 0 ? (
                <SquareButton>
                    <Icon name="plus" className="h-3.5 w-3.5 stroke-3" />
                    딥스 만들기
                </SquareButton>
            ) : (
                <div className="flex flex-col gap-3">
                    {displayDeeps.map((deep) => (
                        <DeepsCard
                            key={deep.id}
                            title={deep.title}
                            creator={deep.creator}
                            emoji={deep.emoji}
                            timeLeft={deep.timeLeft}
                            solvedCount={deep.solvedCount}
                            totalCount={deep.totalCount}
                            state={deep.isAnswered ? 'answered' : 'unanswered'}
                            isTimeEnded={deep.isTimeEnded}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
