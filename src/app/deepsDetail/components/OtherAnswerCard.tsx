'use client';

import { useState } from 'react';
import cn from 'classnames';
import Icon from '@/ui/Icon/Icon';

export interface OtherAnswerCardProps {
    author: string;
    image: string;
    content: string;
    recommendCount: number;
}

export function OtherAnswerCard({
    author,
    image,
    content,
    recommendCount,
}: OtherAnswerCardProps) {
    const [recommended, setRecommended] = useState(false);
    const [count, setCount] = useState(recommendCount);

    function handleRecommend() {
        setCount((prev) => (recommended ? prev - 1 : prev + 1));
        setRecommended((prev) => !prev);
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <span className="w-6 h-6 rounded-full border border-main-100 flex items-center justify-center text-base leading-none shrink-0">
                        {image}
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
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
    );
}
