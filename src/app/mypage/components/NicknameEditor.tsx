'use client';

import { useState } from 'react';
import { NicknameEditForm } from './NicknameEditForm';

interface NicknameEditorProps {
    nickname: string;
    onNicknameChanged: () => void;
}

export function NicknameEditor({
    nickname,
    onNicknameChanged,
}: NicknameEditorProps) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <NicknameEditForm
                nickname={nickname}
                onCancel={() => setIsEditing(false)}
                onSaved={() => {
                    setIsEditing(false);
                    onNicknameChanged();
                }}
            />
        );
    }

    return (
        <div className="border border-main-20 rounded-lg flex items-center justify-between px-4 py-2.5">
            <span className="text-sm font-medium text-gray-600">
                {nickname}
            </span>
            <button
                type="button"
                className="text-sm font-medium text-main-30 px-2 cursor-pointer"
                onClick={() => setIsEditing(true)}
            >
                변경
            </button>
        </div>
    );
}
