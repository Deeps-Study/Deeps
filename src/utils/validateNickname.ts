const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]+$/;
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 12;

export const NICKNAME_GUIDE =
    '닉네임은 공백을 제외한 2~12자, 한글/영문/숫자만 입력 가능합니다.';

export type NicknameError = 'format' | 'length';

/* 빈 값이나 규칙에 맞는 값이면 null. 허용하지 않는 글자가 있으면 길이보다 먼저 형식 오류로 본다. */
export function getNicknameError(nickname: string): NicknameError | null {
    if (nickname === '') return null;
    if (!NICKNAME_PATTERN.test(nickname)) return 'format';
    if (
        nickname.length < NICKNAME_MIN_LENGTH ||
        nickname.length > NICKNAME_MAX_LENGTH
    ) {
        return 'length';
    }
    return null;
}

export function isValidNickname(nickname: string): boolean {
    return nickname !== '' && getNicknameError(nickname) === null;
}
