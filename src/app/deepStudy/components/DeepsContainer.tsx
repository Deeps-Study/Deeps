'use client';

import { useState } from 'react';
import Icon from '@/ui/Icon/Icon';
import SquareButton from '@/components/SquareButton';
import DeepsCard from './DeepsCard';
import { DeepsModel } from '@/types/study';

export default function DeepsContainer() {
    const [activeTab, setActiveTab] = useState<'progress' | 'completed'>(
        'progress',
    );

    const [deepsList] = useState<DeepsModel[]>(() => {
        const now = Date.now();

        return [
            {
                id: '1',
                studyId: 'study-1',
                title: '피그마로 로티는 어떻게 구현할까요?',
                content: '상세 설명 생략',
                creator: { nickname: '정딥스', fallbackEmoji: '🦖' },
                timeLimit: 28800, // DB 명세: 퀴즈 제한 시간 (8시간 = 28800초)
                createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전에 생성된 퀴즈로 시뮬레이션
                solvedCount: 5,
                totalCount: 6,
                isMyAnswered: false,
                isTimeEnded: false,
            },
            {
                id: '2',
                studyId: 'study-1',
                title: 'React의 가상 돔과 성능 최적화 기법에 대해 설명하시오.',
                content: '상세 설명 생략',
                creator: { nickname: '김딥스', fallbackEmoji: '✈️' },
                timeLimit: 7200, // 2시간 제한
                createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15분 전에 생성됨
                solvedCount: 6,
                totalCount: 6,
                isMyAnswered: true,
                isTimeEnded: false,
            },
            {
                id: '3',
                studyId: 'study-1',
                title: 'Tailwind CSS로 복잡한 레이아웃을 잡을 때 장단점은?',
                content: '상세 설명 생략',
                creator: { nickname: '박딥스', fallbackEmoji: '🦀' },
                timeLimit: 3600, // 1시간 제한
                createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2시간 전에 생성되어 이미 마감됨
                solvedCount: 5,
                totalCount: 6,
                isMyAnswered: false,
                isTimeEnded: true,
            },
        ];
    });

    const progressDeeps = deepsList.filter((deep) => !deep.isTimeEnded);
    const completedDeeps = deepsList.filter((deep) => deep.isTimeEnded);
    const displayDeeps =
        activeTab === 'progress' ? progressDeeps : completedDeeps;

    return (
        <div className="flex flex-col gap-5">
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
                <div className="flex flex-col gap-3.5">
                    {displayDeeps.map((deep) => (
                        <DeepsCard key={deep.id} deeps={deep} />
                    ))}
                </div>
            )}
        </div>
    );
}
