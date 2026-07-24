'use client';

import { useEffect, useState } from 'react';
import { DeepsDetailClient } from './DeepsDetailClient';
import { DeepsDescription } from './DeepsDescription';
import { HintSection } from './HintSection';
import { OtherAnswerCard } from './OtherAnswerCard';
import { formatDurationLabel } from '@/utils/time';
import type { DeepsDetailModel } from '@/types/deeps';
import type { MyAnswerModel, OtherAnswerModel } from '@/types/deepsAnswerModel';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { DeepsDetailSkeleton } from './DeepsDetailSkeleton';

interface DeepsDetailContainerProps {
    studyId: string;
    deepsId: string;
}

const REVEAL_LEAD_MS = 30_000;

export function DeepsDetailContainer({
    studyId,
    deepsId,
}: DeepsDetailContainerProps) {
    const [deeps, setDeeps] = useState<DeepsDetailModel | null>(null);
    const [initialAnswer, setInitialAnswer] = useState<string | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const [otherAnswers, setOtherAnswers] = useState<OtherAnswerModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSkeleton, setShowSkeleton] = useState(false);

    useEffect(() => {
        if (!isLoading) return;

        const timer = setTimeout(() => {
            setShowSkeleton(true);
        }, 200);

        return () => {
            clearTimeout(timer);
            setShowSkeleton(false);
        };
    }, [isLoading]);

    const isSkeletonVisible = isLoading && showSkeleton;

    useEffect(() => {
        let isStale = false;
        async function fetchDetail() {
            setIsLoading(true);
            try {
                const res = await fetch(
                    `/api/studies/${studyId}/deeps/${deepsId}`,
                );
                if (res.status === 401) {
                    triggerSessionExpired();
                    return;
                }
                if (!res.ok) return;
                const data: DeepsDetailModel = await res.json();
                if (isStale) return;
                setDeeps(data);
                setIsExpired(Date.now() >= new Date(data.expiredAt).getTime());

                if (data.myAnswerStatus === 'SUBMITTED') {
                    const answerRes = await fetch(
                        `/api/studies/${studyId}/deeps/${deepsId}/answers/me`,
                    );
                    if (answerRes.ok) {
                        const answerData: MyAnswerModel =
                            await answerRes.json();
                        if (!isStale) setInitialAnswer(answerData.content);
                    }
                }
            } finally {
                if (!isStale) setIsLoading(false);
            }
        }
        fetchDetail();
        return () => {
            isStale = true;
        };
    }, [deepsId, studyId]);

    useEffect(() => {
        if (!deeps) return;
        let isStale = false;
        const expiredAtMs = new Date(deeps.expiredAt).getTime();
        const delay = Math.max(0, expiredAtMs - REVEAL_LEAD_MS - Date.now());

        const timer = setTimeout(async () => {
            const [detailRes, answersRes] = await Promise.all([
                fetch(
                    `/api/studies/${studyId}/deeps/${deepsId}?awaitReveal=true`,
                ),
                fetch(`/api/studies/${studyId}/deeps/${deepsId}/answers`),
            ]);
            if (isStale) return;
            if (detailRes.ok) {
                const data: DeepsDetailModel = await detailRes.json();
                if (!isStale) setDeeps(data);
            }
            if (answersRes.ok) {
                const data: OtherAnswerModel[] = await answersRes.json();
                if (!isStale) setOtherAnswers(data);
            }
            if (!isStale) setIsExpired(true);
        }, delay);

        return () => {
            isStale = true;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deeps?.expiredAt, studyId, deepsId]);

    function handleExpire() {
        setIsExpired(true);
    }

    if (isLoading || !deeps) {
        if (isSkeletonVisible) {
            return <DeepsDetailSkeleton />;
        }
        return null; // 200ms 미만의 빠른 응답 시 아무것도 그리지 않고 대기 (깜빡임 완벽 방지)
    }

    return (
        <DeepsDetailClient
            title={deeps.title}
            timeLimitLabel={formatDurationLabel(deeps.durationSeconds)}
            expiredAtMs={new Date(deeps.expiredAt).getTime()}
            hasSubmitted={deeps.myAnswerStatus === 'SUBMITTED'}
            isExpired={isExpired}
            onExpire={handleExpire}
            studyId={studyId}
            deepsId={deepsId}
            initialAnswer={initialAnswer}
            leftContent={
                <>
                    <DeepsDescription
                        author={deeps.creator?.nickname ?? '알 수 없음'}
                        image={deeps.creator?.profileImageUrl}
                        description={deeps.description}
                    />
                    <HintSection
                        isExpired={isExpired}
                        hint={deeps.hint}
                        explanation={deeps.explanation}
                    />
                </>
            }
            otherAnswerCards={
                <>
                    {otherAnswers.map((answer) => (
                        <OtherAnswerCard
                            key={answer.answerId}
                            studyId={studyId}
                            deepsId={deepsId}
                            answerId={answer.answerId}
                            author={answer.author.nickname}
                            image={answer.author.image}
                            content={answer.content}
                            recommendCount={answer.recommendCount}
                            recommended={answer.recommended}
                        />
                    ))}
                </>
            }
        />
    );
}
