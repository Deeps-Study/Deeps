'use client';

import { memo, useEffect, useRef, useState } from 'react';
import Icon from '@/ui/Icon/Icon';
import { SolutionEditor } from './SolutionEditor';
import { isHtmlEmpty, sanitizeHtml } from '@/utils/editor';

interface MySolutionProps {
    isExpired: boolean;
    studyId: string;
    deepsId: string;
    initialAnswer: string | null;
}

export const MySolution = memo(function MySolution({
    isExpired,
    studyId,
    deepsId,
    initialAnswer,
}: MySolutionProps) {
    const [isEditing, setIsEditing] = useState(initialAnswer === null);
    const [content, setContent] = useState(initialAnswer ?? '');
    const [hasSubmittedOnce, setHasSubmittedOnce] = useState(
        initialAnswer !== null,
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const draftRef = useRef(content);

    const showEditor = isEditing && !isExpired;
    const isEmpty = isHtmlEmpty(content);

    useEffect(() => {
        if (!isExpired || !isEditing) return;
        const draft = draftRef.current;
        if (isHtmlEmpty(draft)) {
            setIsEditing(false);
            return;
        }
        handleSubmit(draft);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpired]);

    async function handleSubmit(html: string) {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setSubmitError('');
        try {
            const url = hasSubmittedOnce
                ? `/api/studies/${studyId}/deeps/${deepsId}/answers/me`
                : `/api/studies/${studyId}/deeps/${deepsId}/answers`;
            const res = await fetch(url, {
                method: hasSubmittedOnce ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: html }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setSubmitError(
                    data?.message ??
                        '답변 제출에 실패했습니다. 다시 시도해 주세요.',
                );
                return;
            }
            setContent(html);
            setHasSubmittedOnce(true);
            setIsEditing(false);
        } finally {
            setIsSubmitting(false);
        }
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
                <>
                    <SolutionEditor
                        initialContent={content}
                        onSubmit={handleSubmit}
                        onContentChange={(html) => {
                            draftRef.current = html;
                        }}
                    />
                    {submitError && (
                        <p className="text-sm font-medium text-red-100">
                            {submitError}
                        </p>
                    )}
                </>
            ) : isEmpty ? (
                <div className="min-h-107.5 max-h-107.5 border border-gray-300 rounded-lg px-4.5 py-3.5 flex items-center justify-center">
                    <p className="text-sm font-medium text-gray-300 text-center">
                        문제를 풀지 못했어요 😢 <br />
                        다른 멤버는 어떻게 풀었는지 확인하고 같이 공부해 볼까요?
                    </p>
                </div>
            ) : (
                <div
                    className="min-h-107.5 max-h-107.5 overflow-y-auto border border-main-100 rounded-lg px-4.5 py-3.5 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                />
            )}
        </section>
    );
});
