'use client';

import { DeepsDetailHeader } from './DeepsDetailHeader';
import { formatDurationLabel } from '@/utils/time';
import type { DeepsDetailModel } from '@/types/deeps';

interface CreatorDeepsDetailProps {
    deeps: DeepsDetailModel;
    onExpire: () => void;
    studyId: string;
    leftContent: React.ReactNode;
    otherAnswerCards: React.ReactNode;
}

export function CreatorDeepsDetail({
    deeps,
    onExpire,
    studyId,
    leftContent,
    otherAnswerCards,
}: CreatorDeepsDetailProps) {
    const { title, durationSeconds, expiredAt } = deeps;
    const timeLimitLabel = formatDurationLabel(durationSeconds);
    const expiredAtMs = new Date(expiredAt).getTime();

    return (
        <div className="flex flex-col bg-white">
            <DeepsDetailHeader
                studyId={studyId}
                title={title}
                timeLimitLabel={timeLimitLabel}
                expiredAtMs={expiredAtMs}
                onExpire={onExpire}
            />
            <main className="flex gap-12 px-16 py-8 items-start">
                <div className="flex flex-col gap-12 flex-1 min-w-0">
                    {leftContent}
                </div>
                <div className="sticky top-8 flex-1 min-w-0">
                    <section className="flex flex-col gap-3">
                        <h2 className="text-base font-semibold text-gray-600">
                            다른 멤버들의 답변
                        </h2>
                        <div className="flex flex-col gap-6">
                            {otherAnswerCards}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
