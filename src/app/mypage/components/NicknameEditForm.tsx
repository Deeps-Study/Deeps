'use client';

import { useState } from 'react';
import { NicknameStatusMessage } from '@/components/NicknameStatusMessage';
import { useAuth } from '@/components/AuthProvider';
import { useNicknameCheck } from '@/hooks/useNicknameCheck';
import { isValidNickname } from '@/utils/validateNickname';
import { API_URL } from '@/constants/api';

interface NicknameEditFormProps {
    nickname: string;
    onCancel: () => void;
    onSaved: () => void;
}
export function NicknameEditForm({
    nickname,
    onCancel,
    onSaved,
}: NicknameEditFormProps) {
    const [draft, setDraft] = useState(nickname);
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { accessToken } = useAuth();
    const isValid = isValidNickname(draft.trim());
    const { isAvailable, isChecking } = useNicknameCheck(
        draft.trim(),
        accessToken,
    );

    const handleSave = async () => {
        if (!accessToken || !isValid || isAvailable !== true) return;
        setIsSubmitting(true);
        setSubmitError('');
        try {
            const res = await fetch(`${API_URL}/users/me/nickname`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ nickname: draft.trim() }),
            });
            if (res.status === 409) {
                setSubmitError('이미 사용 중인 닉네임입니다.');
                return;
            }
            if (!res.ok) {
                setSubmitError(
                    '닉네임 변경에 실패했습니다. 다시 시도해 주세요.',
                );
                return;
            }
            onSaved();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="border border-main-20 rounded-lg flex items-center gap-2 px-4 py-2.5">
                <input
                    type="text"
                    value={draft}
                    maxLength={10}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        setSubmitError('');
                    }}
                    className="flex-1 min-w-0 text-sm font-medium text-gray-600 outline-none bg-transparent"
                />
                <button
                    type="button"
                    className="text-sm font-medium text-main-30 px-2 cursor-pointer disabled:text-gray-300 disabled:cursor-default shrink-0"
                    onClick={handleSave}
                    disabled={!isValid || isAvailable !== true || isSubmitting}
                >
                    저장
                </button>
                <button
                    type="button"
                    className="text-sm font-medium text-gray-400 px-2 cursor-pointer shrink-0"
                    onClick={onCancel}
                >
                    취소
                </button>
            </div>
            <NicknameStatusMessage
                isValid={isValid}
                isChecking={isChecking}
                isAvailable={isAvailable}
                submitError={submitError}
            />
        </div>
    );
}
