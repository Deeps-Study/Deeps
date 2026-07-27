'use client';

import { DeepsDetailHeader } from './DeepsDetailHeader';
import { MySolution } from './MySolution';
import { TimeAlert } from './TimeAlert';
import { formatDurationLabel } from '@/utils/time';
import type { DeepsDetailModel } from '@/types/deeps';

interface SolverDeepsDetailProps {
    deeps: DeepsDetailModel;
    isExpired: boolean;
    onExpire: () => void;
    studyId: string;
    deepsId: string;
    initialAnswer: string | null;
    leftContent: React.ReactNode;
    otherAnswerCards: React.ReactNode;
}

export function SolverDeepsDetail({
    deeps,
    isExpired,
    onExpire,
    studyId,
    deepsId,
    initialAnswer,
    leftContent,
    otherAnswerCards,
}: SolverDeepsDetailProps) {
    const { title, durationSeconds, expiredAt, myAnswerStatus } = deeps;
    const timeLimitLabel = formatDurationLabel(durationSeconds);
    const expiredAtMs = new Date(expiredAt).getTime();
    const hasSubmitted = myAnswerStatus === 'SUBMITTED';

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
                    {isExpired && (
                        <section className="flex flex-col gap-6 pt-6 border-t border-gray-100">
                            <h2 className="text-base font-semibold text-gray-600">
                                다른 멤버들의 답변
                            </h2>
                            <div className="flex flex-col gap-6">
                                {otherAnswerCards}
                            </div>
                        </section>
                    )}
                </div>
                <div className="sticky top-8 flex-1 min-w-0">
                    <MySolution
                        isExpired={isExpired}
                        studyId={studyId}
                        deepsId={deepsId}
                        initialAnswer={initialAnswer}
                    />
                </div>
            </main>
            <TimeAlert
                key={String(isExpired)}
                show={hasSubmitted || isExpired}
                isExpired={isExpired}
            />
        </div>
    );
}
