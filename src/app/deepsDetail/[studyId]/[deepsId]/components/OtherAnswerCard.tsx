'use client';

import { useState } from 'react';
import cn from 'classnames';
import Icon from '@/ui/Icon/Icon';
import { sanitizeHtml } from '@/utils/editor';

export interface OtherAnswerCardProps {
    studyId: string;
    deepsId: string;
    answerId: string;
    author: string;
    image?: string;
    content: string;
    recommendCount: number;
    recommended: boolean;
}

export function OtherAnswerCard({
    studyId,
    deepsId,
    answerId,
    author,
    image,
    content,
    recommendCount,
    recommended: initialRecommended,
}: OtherAnswerCardProps) {
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
        if (!res.ok) setState(previous);
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <span className="w-6 h-6 rounded-full border border-main-100 flex items-center justify-center text-base leading-none shrink-0">
                        {image ?? '🐱'}
                    </span>
                    {author}
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
            <div
                className="min-h-40 max-h-70 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg px-6 py-5 text-sm font-medium text-gray-500 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
            />
        </div>
    );
}
