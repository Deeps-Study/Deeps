'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';

interface DeepsFormProps {
    studyId: string;
}

export function DeepsForm({ studyId }: DeepsFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
    const [hint, setHint] = useState('');
    const [solution, setSolution] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const router = useRouter();

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
            const res = await fetch(`/api/studies/${studyId}/deeps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description,
                    durationSeconds,
                    hint: hint.trim() || undefined,
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
                        '딥스 생성에 실패했습니다. 다시 시도해 주세요.',
                );
                return;
            }
            const data: { id: string } = await res.json();
            router.replace(`/deepsDetail/${studyId}/${data.id}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-1 gap-12 px-19 py-3 overflow-hidden">
            <LeftPanel
                title={title}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
            />
            <RightPanel
                onTimeChange={setDurationSeconds}
                hint={hint}
                onHintChange={setHint}
                onSolutionChange={setSolution}
                isFormValid={isFormValid}
                isSubmitting={isSubmitting}
                submitError={submitError}
                onCancel={() => router.back()}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
