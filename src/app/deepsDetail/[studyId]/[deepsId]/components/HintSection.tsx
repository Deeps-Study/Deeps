'use client';

import { useState } from 'react';
import cn from 'classnames';
import { sanitizeHtml } from '@/utils/editor';

interface HintSectionProps {
    isExpired: boolean;
    hint: string | null;
    explanation: string | null;
}

export function HintSection({
    isExpired,
    hint,
    explanation,
}: HintSectionProps) {
    const [isVisible, setIsVisible] = useState(false);
    const isBlurred = !isExpired && !isVisible;

    const boxClassName = cn(
        'min-h-30 max-h-50 overflow-y-auto border border-main-20 bg-main-10 rounded-lg px-4.5 py-3.5',
        'text-sm font-medium text-gray-500 leading-relaxed whitespace-pre-line',
        'transition-all duration-200 select-none',
        isBlurred && 'blur-[3px]',
    );

    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-600">
                    {isExpired ? '출제자 설명' : '힌트'}
                </h2>
                {!isExpired && (
                    <button
                        type="button"
                        onClick={() => setIsVisible((prev) => !prev)}
                        className="px-2.5 py-1 text-xs font-medium bg-gray-50 border border-gray-200 rounded text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                        {isVisible ? '닫기' : '보기'}
                    </button>
                )}
            </div>
            {isExpired ? (
                <div
                    className={boxClassName}
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(explanation ?? ''),
                    }}
                />
            ) : (
                <div className={boxClassName}>{hint}</div>
            )}
        </section>
    );
}
