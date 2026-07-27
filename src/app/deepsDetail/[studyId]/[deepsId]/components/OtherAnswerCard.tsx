'use client';

import { useState } from 'react';
import Image from 'next/image';
import cn from 'classnames';
import Icon from '@/ui/Icon/Icon';
import { sanitizeHtml } from '@/utils/editor';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { ExpandableBox } from './ExpandableBox';
import type { OtherAnswerModel } from '@/types/deepsAnswerModel';

export interface OtherAnswerCardProps {
    studyId: string;
    deepsId: string;
    answer: OtherAnswerModel;
}

export function OtherAnswerCard({
    studyId,
    deepsId,
    answer,
}: OtherAnswerCardProps) {
    const {
        answerId,
        author,
        content,
        recommendCount,
        recommended: initialRecommended,
    } = answer;
    const [{ recommended, count }, setState] = useState({
        recommended: initialRecommended,
        count: recommendCount,
    });

    async function handleRecommend() {
        const previous = { recommended, count };
        setState((prev) => ({
            recommended: !prev.recommended,
            count: prev.recommended ? prev.count - 1 : prev.count + 1,
        }));

        const res = await fetch(
            `/api/studies/${studyId}/deeps/${deepsId}/answers/${answerId}/like`,
            { method: 'POST' },
        );
        if (res.status === 401) {
            setState(previous);
            triggerSessionExpired();
            return;
        }
        if (!res.ok) setState(previous);
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <span className="relative w-6 h-6 rounded-full border border-main-100 flex items-center justify-center overflow-hidden shrink-0">
                        {author.image ? (
                            <Image
                                src={author.image}
                                alt={author.nickname}
                                fill
                                sizes="24px"
                                className="object-cover"
                            />
                        ) : (
                            <Icon
                                name="user"
                                className="w-4 h-4 text-main-100"
                            />
                        )}
                    </span>
                    {author.nickname}
                </p>
                <button
                    type="button"
                    onClick={handleRecommend}
                    className={cn(
                        'flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium text-main-200 transition-colors',
                        recommended && 'border-main-20 bg-main-10',
                    )}
                >
                    <Icon name="thumbsUp" className="w-3.5 h-3.5" />
                    {count}
                </button>
            </div>
            <ExpandableBox
                heightClassName="min-h-40 max-h-70"
                className="bg-gray-50 border border-gray-200 rounded-lg pt-3 px-4.5 pb-4.5 text-sm font-medium text-gray-500 leading-relaxed"
            >
                <div
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                />
            </ExpandableBox>
        </div>
    );
}
