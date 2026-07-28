'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import type { DeepsDetailModel } from '@/types/deeps';

interface DeepsFormProps {
    studyId: string;
    deepsId?: string;
}

export function DeepsForm({ studyId, deepsId }: DeepsFormProps) {
    const isEditMode = deepsId !== undefined;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [initialDescription, setInitialDescription] = useState<
        string | undefined
    >(undefined);
    const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
    const [initialSeconds, setInitialSeconds] = useState<number | undefined>(
        undefined,
    );
    const [hint, setHint] = useState('');
    const [solution, setSolution] = useState('');
    const [initialSolution, setInitialSolution] = useState<string | undefined>(
        undefined,
    );
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!isEditMode) return;
        let isStale = false;
        async function fetchDeeps() {
            const res = await fetch(`/api/studies/${studyId}/deeps/${deepsId}`);
            if (res.status === 401) {
                triggerSessionExpired();
                return;
            }
            if (!res.ok) return;
            const data: DeepsDetailModel = await res.json();
            if (isStale) return;
            setTitle(data.title);
            setDescription(data.description);
            setInitialDescription(data.description);
            setDurationSeconds(data.durationSeconds);
            setInitialSeconds(data.durationSeconds);
            setHint(data.hint ?? '');
            setSolution(data.explanation ?? '');
            setInitialSolution(data.explanation ?? '');
            setIsLoading(false);
        }
        fetchDeeps();
        return () => {
            isStale = true;
        };
    }, [isEditMode, studyId, deepsId]);

    const isFormValid =
        title.trim().length > 0 &&
        description.trim().length > 0 &&
        durationSeconds !== null &&
        solution.trim().length > 0;

    const handleSubmit = async () => {
        if (!isFormValid || isSubmitting) return;
        setIsSubmitting(true);
        setSubmitError('');
        try {
            const url = isEditMode
                ? `/api/studies/${studyId}/deeps/${deepsId}`
                : `/api/studies/${studyId}/deeps`;
            const res = await fetch(url, {
                method: isEditMode ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description,
                    durationSeconds,
                    hint: hint.trim(),
                    solution,
                }),
            });
            if (res.status === 401) {
                triggerSessionExpired();
                return;
            }
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setSubmitError(
                    data?.message ??
                        (isEditMode
                            ? '딥스 수정에 실패했습니다. 다시 시도해 주세요.'
                            : '딥스 생성에 실패했습니다. 다시 시도해 주세요.'),
                );
                return;
            }
            const data: { id: string } = await res.json();
            router.replace(`/deepsDetail/${studyId}/${data.id}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return null;

    return (
        <div className="flex flex-1 gap-12 px-19 py-3 overflow-hidden">
            <LeftPanel
                studyId={studyId}
                title={title}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                initialDescription={initialDescription}
            />
            <RightPanel
                studyId={studyId}
                onTimeChange={setDurationSeconds}
                initialSeconds={initialSeconds}
                hint={hint}
                onHintChange={setHint}
                onSolutionChange={setSolution}
                initialSolution={initialSolution}
                isFormValid={isFormValid}
                isSubmitting={isSubmitting}
                submitError={submitError}
                onCancel={() => router.back()}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
