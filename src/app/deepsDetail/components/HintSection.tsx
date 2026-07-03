'use client';

import { useState } from 'react';
import cn from 'classnames';

interface HintSectionProps {
    hint: string;
}

export function HintSection({ hint }: HintSectionProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-600">힌트</h2>
                <button
                    type="button"
                    onClick={() => setIsVisible((prev) => !prev)}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-50 border border-gray-200 rounded text-gray-400 hover:bg-gray-100 transition-colors"
                >
                    {isVisible ? '닫기' : '보기'}
                </button>
            </div>
            <div
                className={cn(
                    'max-h-45 overflow-y-auto border border-main-20 bg-main-10 rounded-lg px-6 py-5',
                    'text-sm font-medium text-gray-500 leading-relaxed',
                    'transition-all duration-200 select-none',
                    !isVisible && 'blur-[3px]',
                )}
            >
                {hint}
            </div>
        </section>
    );
}
