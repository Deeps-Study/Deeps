const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]+$/;
const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 10;

export const NICKNAME_GUIDE =
    '닉네임은 공백을 제외한 2~10자, 한글/영문/숫자만 입력 가능합니다.';

export function isValidNickname(nickname: string): boolean {
    return (
        nickname.length >= NICKNAME_MIN_LENGTH &&
        nickname.length <= NICKNAME_MAX_LENGTH &&
        NICKNAME_PATTERN.test(nickname)
    );
}
