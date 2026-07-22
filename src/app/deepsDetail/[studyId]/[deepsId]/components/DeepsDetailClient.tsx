'use client';

import { DeepsDetailHeader } from './DeepsDetailHeader';
import { MySolution } from './MySolution';
import { TimeAlert } from './TimeAlert';

interface DeepsDetailClientProps {
    title: string;
    timeLimitLabel: string;
    expiredAtMs: number;
    hasSubmitted: boolean;
    isExpired: boolean;
    onExpire: () => void;
    studyId: string;
    deepsId: string;
    initialAnswer: string | null;
    leftContent: React.ReactNode;
    otherAnswerCards: React.ReactNode;
}

export function DeepsDetailClient({
    title,
    timeLimitLabel,
    expiredAtMs,
    hasSubmitted,
    isExpired,
    onExpire,
    studyId,
    deepsId,
    initialAnswer,
    leftContent,
    otherAnswerCards,
}: DeepsDetailClientProps) {
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
