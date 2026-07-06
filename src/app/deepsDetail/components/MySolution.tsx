'use client';

import { memo, useEffect, useRef, useState } from 'react';
import Icon from '@/ui/Icon/Icon';
import { SolutionEditor } from './SolutionEditor';

interface MySolutionProps {
    isExpired: boolean;
}

export const MySolution = memo(function MySolution({
    isExpired,
}: MySolutionProps) {
    const [isEditing, setIsEditing] = useState(true);
    const [content, setContent] = useState('');
    const latestContentRef = useRef('');

    const showEditor = isEditing && !isExpired;
    const isEmpty = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length === 0;

    useEffect(() => {
        if (!isExpired) return;
        setContent(latestContentRef.current);
        setIsEditing(false);
    }, [isExpired]);

    function handleSubmit(html: string) {
        setContent(html);
        setIsEditing(false);
    }

    return (
        <section className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-1">
                <h2 className="text-base font-semibold text-gray-600">
                    {showEditor ? '나의 풀이' : '나의 답변'}
                </h2>
                {!isEditing && !isExpired && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        <Icon
                            name="pencil"
                            className="w-5 h-5 stroke-2 stroke-main-50"
                        />
                    </button>
                )}
            </div>
            {showEditor ? (
                <SolutionEditor
                    onSubmit={handleSubmit}
                    onContentChange={(html) => {
                        latestContentRef.current = html;
                    }}
                />
            ) : isEmpty ? (
                <div className="min-h-[430px] max-h-[430px] border border-gray-300 rounded-lg px-6 py-5 flex items-center justify-center">
                    <p className="text-sm font-medium text-gray-300 text-center">
                        문제를 풀지 못했어요 😢 <br />
                        다른 멤버는 어떻게 풀었는지 확인하고 같이 공부해 볼까요?
                    </p>
                </div>
            ) : (
                <div
                    className="min-h-[430px] max-h-[430px] overflow-y-auto border border-main-100 rounded-lg px-6 py-5 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            )}
        </section>
    );
});
