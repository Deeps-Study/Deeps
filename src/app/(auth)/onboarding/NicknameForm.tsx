'use client';
import cn from 'classnames';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useNicknameCheckButton } from '@/hooks/useNicknameCheckButton';
import { resolveRedirectPath, safeDecode } from '@/utils/redirectPath';
import { getNicknameError } from '@/utils/validateNickname';

const INPUT_ID = 'nickname';
const STATUS_ID = 'nickname-status';

type SaveError = 'conflict' | 'failed' | null;
type Tone = 'muted' | 'error' | 'success';

const toneClass: Record<Tone, string> = {
    muted: 'text-foreground-muted',
    error: 'text-error',
    success: 'text-success',
};

export function NicknameForm() {
    const [nickname, setNickname] = useState('');
    const [saveError, setSaveError] = useState<SaveError>(null);
    const [isSaving, setIsSaving] = useState(false);
    const savingRef = useRef(false);
    const router = useRouter();

    const value = nickname.trim();
    const error = getNicknameError(value);
    const isValid = value !== '' && error === null;
    const { status, check, reset } = useNicknameCheckButton(value);

    const isConflict = saveError === 'conflict';
    const canCheck = isValid && status !== 'checking' && !isSaving;
    const canSave = isValid && status === 'available' && !isConflict && !isSaving;

    const message: { text: string; tone: Tone } = (() => {
        if (isConflict) return { text: '이미 사용 중인 닉네임입니다.', tone: 'error' };
        if (error === 'format') return { text: '한글, 영문, 숫자만 사용할 수 있어요.', tone: 'error' };
        if (error === 'length') return { text: '2~12자로 입력해주세요.', tone: 'error' };
        if (value === '') return { text: '한글, 영문, 숫자만 사용할 수 있어요.', tone: 'muted' };
        switch (status) {
            case 'checking':
                return { text: '중복 확인 중이에요.', tone: 'muted' };
            case 'available':
                return { text: '사용할 수 있는 닉네임이에요.', tone: 'success' };
            case 'taken':
                return { text: '이미 존재하는 닉네임 입니다.', tone: 'error' };
            case 'failed':
                return { text: '확인하지 못했어요. 다시 시도해주세요.', tone: 'error' };
            default:
                return { text: '중복 확인을 해주세요.', tone: 'muted' };
        }
    })();

    const isInvalid = error !== null || status === 'taken' || isConflict;
    const isAvailable = !isInvalid && status === 'available';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (savingRef.current) return;
        setNickname(e.target.value);
        setSaveError(null);
        reset();
    };

    const handleCheck = () => {
        if (!canCheck) return;
        setSaveError(null);
        void check();
    };

    // 확인을 통과한 값만 저장한다(확인 전 Enter는 저장하지 않음). 저장은 한 번만 보낸다.
    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!canSave || savingRef.current) return;
        savingRef.current = true;
        setIsSaving(true);
        setSaveError(null);

        let res: Response | null = null;
        try {
            res = await fetch('/api/users/me/nickname', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: value }),
            });
        } catch {
            res = null;
        }

        if (!res || !res.ok) {
            setSaveError(res?.status === 409 ? 'conflict' : 'failed');
            savingRef.current = false;
            setIsSaving(false);
            return;
        }

        const match = document.cookie.match(/(?:^|; )auth_redirect=([^;]*)/);
        const redirectUrl = resolveRedirectPath(match && safeDecode(match[1]));

        document.cookie = 'auth_redirect=; path=/; max-age=0;';

        router.push(redirectUrl);
    };

    return (
        <form className="mt-8 flex flex-col" onSubmit={handleSubmit} noValidate>
            <label
                htmlFor={INPUT_ID}
                className="text-sm leading-5 font-semibold text-foreground"
            >
                닉네임
            </label>
            <div className="mt-2 flex flex-col gap-2 min-[360px]:flex-row">
                <input
                    id={INPUT_ID}
                    name="nickname"
                    type="text"
                    placeholder="2~12자 닉네임"
                    autoComplete="off"
                    spellCheck={false}
                    value={nickname}
                    onChange={handleChange}
                    readOnly={isSaving}
                    aria-invalid={isInvalid || undefined}
                    aria-describedby={STATUS_ID}
                    className={cn(
                        'h-12 w-full min-w-0 rounded-xl border bg-surface px-4 text-base text-foreground placeholder:text-foreground-muted focus:outline-none min-[360px]:flex-1',
                        isInvalid
                            ? 'border-error'
                            : isAvailable
                              ? 'border-success'
                              : 'border-border-input',
                    )}
                />
                <button
                    type="button"
                    onClick={handleCheck}
                    disabled={!canCheck}
                    className="h-12 shrink-0 cursor-pointer rounded-md border border-border-input bg-surface px-4 text-[15px] leading-5.5 font-semibold text-primary-strong enabled:hover:bg-primary-subtle disabled:cursor-default disabled:border-border disabled:bg-border disabled:text-foreground-muted"
                >
                    중복 확인
                </button>
            </div>
            <p
                id={STATUS_ID}
                aria-live="polite"
                className={cn('mt-2 min-h-5 text-[13px] leading-5', toneClass[message.tone])}
            >
                {message.text}
            </p>
            <button
                type="submit"
                disabled={!canSave}
                className="mt-6 h-12 w-full cursor-pointer rounded-md bg-primary-strong px-4 text-[15px] leading-5.5 font-semibold text-surface enabled:hover:bg-primary-hover disabled:cursor-default disabled:bg-border disabled:text-foreground-muted"
            >
                Deeps 시작하기
            </button>
            {saveError === 'failed' && (
                <p role="alert" className="mt-3 text-[13px] leading-5 text-error">
                    닉네임 저장에 실패했습니다. 다시 시도해 주세요.
                </p>
            )}
        </form>
    );
}
