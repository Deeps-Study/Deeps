'use client';
import Input from '@/components/Input';
import RoundButton from '@/components/RoundButton';
import { useNicknameCheck } from '@/hooks/useNicknameCheck';
import { NicknameStatusMessage } from '@/components/NicknameStatusMessage';
import { isValidNickname } from '@/utils/validateNickname';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const inputConfig = {
    id: 'nickname',
    name: 'nickname',
    placeholder: '닉네임을 입력해주세요.',
};

export function NicknameForm() {
    const [nickname, setNickname] = useState('');
    const [submitError, setSubmitError] = useState('');
    const isValid = isValidNickname(nickname.trim());
    const { isAvailable, isChecking } = useNicknameCheck(nickname.trim());
    const router = useRouter();

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setSubmitError('');
        const res = await fetch('/api/users/me/nickname', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: nickname.trim() }),
        });

        if (res.status === 409) {
            setSubmitError('이미 사용 중인 닉네임입니다.');
            return;
        }
        if (!res.ok) {
            setSubmitError('닉네임 저장에 실패했습니다. 다시 시도해 주세요.');
            return;
        }

        const match = document.cookie.match(/(?:^|; )auth_redirect=([^;]*)/);
        const redirectUrl = match ? decodeURIComponent(match[1]) : '/home';

        document.cookie = 'auth_redirect=; path=/; max-age=0;';

        router.push(redirectUrl);
    };

    return (
        <>
            <div className="w-125 min-h-78.5 pt-11 pb-14 px-12 border border-main-10 shadow-mint rounded-[40px] bg-white">
                <form
                    className="flex flex-col h-full justify-between gap-6"
                    onSubmit={handleSubmit}
                >
                    <span className="text-main-100 text-xl font-bold text-center">
                        안녕하세요! 닉네임을 알려주세요
                    </span>

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3">
                            <p className="text-gray-600 text-base font-bold text-left">
                                닉네임 입력
                            </p>
                            <Input
                                {...inputConfig}
                                maxLength={10}
                                className={`transition-all duration-100 ${isValid ? `shadow-mint` : `shadow-none`}`}
                                value={nickname}
                                onChange={(e) => {
                                    setNickname(e.target.value);
                                    setSubmitError('');
                                }}
                            />
                        </div>

                        <div className="h-3">
                            <NicknameStatusMessage
                                isValid={isValid}
                                isChecking={isChecking}
                                isAvailable={isAvailable}
                                submitError={submitError}
                                nickname={nickname}
                            />
                        </div>
                    </div>
                    <RoundButton
                        variant="complete"
                        isFull
                        type="submit"
                        disabled={!isValid || isAvailable !== true}
                    >
                        완료
                    </RoundButton>
                </form>
            </div>
        </>
    );
}
