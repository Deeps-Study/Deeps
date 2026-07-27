'use client';

import { useState } from 'react';
import cn from 'classnames';
import { sanitizeHtml } from '@/utils/editor';
import { ExpandableBox } from './ExpandableBox';

interface HintSectionProps {
    isExpired: boolean;
    isCreatedByMe: boolean;
    hint: string | null;
    explanation: string | null;
}

export function HintSection({
    isExpired,
    isCreatedByMe,
    hint,
    explanation,
}: HintSectionProps) {
    const [isVisible, setIsVisible] = useState(false);
    const hasHint = Boolean(hint);
    const showExplanation = isExpired || isCreatedByMe;
    const isBlurred = !showExplanation && !isVisible && hasHint;

    const boxClassName = cn(
        'border border-main-20 bg-main-10 rounded-lg pt-3 px-4.5 pb-4.5',
        'text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-line',
        'transition-all duration-200 select-none',
        '[&>div>:first-child]:mt-0 [&>div>:last-child]:mb-0',
        isBlurred && 'blur-[3px]',
    );

    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-600">
                    {showExplanation ? '출제자 설명' : '힌트'}
                </h2>
                {!showExplanation && hasHint && (
                    <button
                        type="button"
                        onClick={() => setIsVisible((prev) => !prev)}
                        className="px-2.5 py-1 text-xs font-medium bg-gray-50 border border-gray-200 rounded text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                        {isVisible ? '닫기' : '보기'}
                    </button>
                )}
            </div>
            {showExplanation ? (
                <ExpandableBox
                    heightClassName="min-h-30 max-h-50"
                    className={boxClassName}
                >
                    <div
                        dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(explanation ?? ''),
                        }}
                    />
                </ExpandableBox>
            ) : (
                <ExpandableBox
                    heightClassName="min-h-30 max-h-50"
                    className={boxClassName}
                >
                    {hasHint ? hint : <p>힌트가 없습니다 😢</p>}
                </ExpandableBox>
            )}
        </section>
    );
}
