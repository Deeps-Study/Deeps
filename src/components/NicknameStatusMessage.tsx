import { NICKNAME_GUIDE } from '@/utils/validateNickname';

interface NicknameStatusMessageProps {
    isValid: boolean;
    isChecking: boolean;
    isAvailable: boolean | null;
    submitError: string;
    nickname: string;
}

export function NicknameStatusMessage({
    isValid,
    isChecking,
    isAvailable,
    submitError,
    nickname,
}: NicknameStatusMessageProps) {
    if (submitError) {
        return (
            <p className="text-sm font-medium text-red-100">{submitError}</p>
        );
    }
    if (nickname !== '' && !isValid) {
        return (
            <p className="text-sm font-medium text-red-100">{NICKNAME_GUIDE}</p>
        );
    }
    if (!isValid || isChecking || isAvailable === null) return null;

    return isAvailable ? (
        <p className="text-sm font-medium text-main-100">
            사용 가능한 닉네임 입니다.
        </p>
    ) : (
        <p className="text-sm font-medium text-red-100">
            이미 존재하는 닉네임 입니다.
        </p>
    );
}
