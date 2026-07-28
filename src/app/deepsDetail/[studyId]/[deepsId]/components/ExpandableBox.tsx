'use client';

import { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import Icon from '@/ui/Icon/Icon';

interface ExpandableBoxProps {
    children: React.ReactNode;
    heightClassName: string;
    className?: string;
}

export function ExpandableBox({
    children,
    heightClassName,
    className,
}: ExpandableBoxProps) {
    const boxRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);

    useEffect(() => {
        const box = boxRef.current;
        if (!box) return;

        const measure = () => {
            setCanExpand(box.scrollHeight > box.clientHeight);
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(box);

        return () => {
            observer.disconnect();
        };
    }, [children]);

    return (
        <div className="flex flex-col">
            <div
                ref={boxRef}
                className={cn(
                    'overflow-hidden',
                    !isExpanded && heightClassName,
                    className,
                )}
            >
                {children}
            </div>
            {canExpand && (
                <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="flex items-center justify-center py-1 text-main-100 hover:text-main-60 transition-colors cursor-pointer"
                >
                    <Icon
                        name="chevronDown"
                        className={cn(
                            'w-4 h-4 stroke-3 transition-transform',
                            isExpanded && 'rotate-180',
                        )}
                    />
                </button>
            )}
        </div>
    );
}
