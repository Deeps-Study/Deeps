'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon/Icon';
import SquareButton from '@/components/SquareButton';
import { DeepsDetailHeader } from './DeepsDetailHeader';
import { formatDurationLabel } from '@/utils/time';
import type { DeepsDetailModel } from '@/types/deeps';

interface CreatorDeepsDetailProps {
    deeps: DeepsDetailModel;
    isExpired: boolean;
    onExpire: () => void;
    studyId: string;
    deepsId: string;
    leftContent: React.ReactNode;
    otherAnswerCards: React.ReactNode;
}

export function CreatorDeepsDetail({
    deeps,
    isExpired,
    onExpire,
    studyId,
    deepsId,
    leftContent,
    otherAnswerCards,
}: CreatorDeepsDetailProps) {
    const router = useRouter();
    const { title, durationSeconds, expiredAt, hasAnswers } = deeps;
    const timeLimitLabel = formatDurationLabel(durationSeconds);
    const expiredAtMs = new Date(expiredAt).getTime();
    const canEdit = !isExpired && !hasAnswers;

    return (
        <div className="flex flex-col bg-white">
            <DeepsDetailHeader
                studyId={studyId}
                title={title}
                timeLimitLabel={timeLimitLabel}
                expiredAtMs={expiredAtMs}
                onExpire={onExpire}
                action={
                    canEdit && (
                        <div className="w-fit shrink-0">
                            <SquareButton
                                variant="edit"
                                className="!px-3 !py-1.5 !gap-1 !text-sm !font-medium"
                                onClick={() =>
                                    router.push(
                                        `/deepsCreator/${studyId}/${deepsId}`,
                                    )
                                }
                            >
                                <Icon
                                    name="pencil"
                                    className="w-4 h-4 stroke-2 stroke-main-100"
                                />
                                수정하기
                            </SquareButton>
                        </div>
                    )
                }
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
