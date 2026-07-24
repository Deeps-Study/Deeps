'use client';

import { useState } from 'react';
import Image from 'next/image';
import cn from 'classnames';
import Icon from '@/ui/Icon/Icon';
import { sanitizeHtml } from '@/utils/editor';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { ExpandableBox } from './ExpandableBox';

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
                        {image ? (
                            <Image
                                src={image}
                                alt={author}
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
            <ExpandableBox
                heightClassName="min-h-40 max-h-70"
                className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-5 text-sm font-medium text-gray-500 leading-relaxed"
            >
                <div
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                />
            </ExpandableBox>
        </div>
    );
}
