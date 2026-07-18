'use client';

import RoundButton from '@/components/RoundButton';
import Tag from '@/components/Tag';
import Icon from '@/ui/Icon/Icon';
import { StudyResponse, mapServerStatusToUI } from '@/types/study';

interface StudyCardProps {
    study: StudyResponse;
    onCardClick: () => void;
    onEnterClick: () => void;
}

function StudyCard({ study, onCardClick, onEnterClick }: StudyCardProps) {
    const uiStatus = mapServerStatusToUI(study.status);

    const statusConfig = {
        before: { text: '시작전', icon: '🌱', tagElement: <Tag>시작전</Tag> },
        ing: {
            text: '진행중',
            icon: '🍀',
            tagElement: <Tag className="bg-main-20 border-main-60">진행중</Tag>,
        },
        end: {
            text: '종료됨',
            icon: '🥀',
            tagElement: <Tag className="bg-main-60 text-white">종료됨</Tag>,
        },
    };

    return (
        <div
            onClick={onCardClick}
            className="w-60 h-96 flex flex-col justify-between rounded-[30px] shadow-mint bg-white border border-main-20 hover:cursor-pointer hover:shadow-green"
        >
            <header className="w-full h-11 flex justify-between items-center px-6 pt-3">
                {statusConfig[uiStatus].tagElement}
                <div className="flex gap-2 text-xs font-medium text-main-200">
                    <Icon
                        name="users"
                        className="w-3.5 h-3.5 stroke-main-200 stroke-2"
                    />
                    {study.currentMemberCount}명 참여
                </div>
            </header>
            <main className="w-full h-full flex flex-col items-center justify-center px-6 py-6 ">
                <span className="text-[50px]">
                    {statusConfig[uiStatus].icon}
                </span>
                <div className="flex flex-col gap-2 h-36.5 ">
                    <div className="flex items-center h-20.5 w-full text-xl text-main-200 text-center font-bold">
                        {study.title}
                    </div>
                    <div className="flex flex-wrap px-2 py-1.5 gap-x-1.5 gap-y-1 justify-center bg-gray-50 rounded-[10px] max-h-20 overflow-y-auto no-scrollbar">
                        {study.tags.slice(0, 6).map((tag, i) => (
                            <span
                                key={i}
                                className="text-[11px] text-main-200 whitespace-nowrap"
                            >
                                # {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="py-2.5"></div>
                <RoundButton
                    isFull
                    onClick={(e) => {
                        e.stopPropagation();
                        onEnterClick();
                    }}
                >
                    입장하기
                </RoundButton>
            </main>
        </div>
    );
}

export default StudyCard;
