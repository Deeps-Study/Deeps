const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]+$/;
const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 10;

export function isValidNickname(nickname: string): boolean {
    return (
        nickname.length >= NICKNAME_MIN_LENGTH &&
        nickname.length <= NICKNAME_MAX_LENGTH &&
        NICKNAME_PATTERN.test(nickname)
    );
}
