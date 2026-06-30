'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';

export function DeepsForm() {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState<string | null>(null);
    const [hint, setHint] = useState('');
    const router = useRouter();

    const isFormValid = title.trim().length > 0 && time !== null;

    return (
        <div className="flex flex-1 gap-12 px-19 py-3 overflow-hidden">
            <LeftPanel title={title} onTitleChange={setTitle} />
            <RightPanel
                onTimeChange={setTime}
                hint={hint}
                onHintChange={setHint}
                isFormValid={isFormValid}
                onCancel={() => router.back()}
            />
        </div>
    );
}
