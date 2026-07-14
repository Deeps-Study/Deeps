import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { isValidNickname } from '@/utils/validateNickname';
import { API_URL } from '@/constants/api';

interface NicknameCheckResult {
    isAvailable: boolean | null;
    isChecking: boolean;
}

export function useNicknameCheck(
    nickname: string,
    accessToken: string | null,
): NicknameCheckResult {
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const isValid = isValidNickname(nickname);
    const debouncedNickname = useDebounce(nickname, 600);

    useEffect(() => {
        if (!isValid || !accessToken) return;

        let isStale = false;
        async function checkNickname() {
            setIsChecking(true);
            try {
                const res = await fetch(
                    `${API_URL}/auth/nickname/check?nickname=${encodeURIComponent(debouncedNickname)}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } },
                );
                if (!res.ok) {
                    if (!isStale) setIsAvailable(null);
                    return;
                }
                const data = await res.json();
                if (!isStale) setIsAvailable(data.available);
            } catch {
                if (!isStale) setIsAvailable(null);
            } finally {
                if (!isStale) setIsChecking(false);
            }
        }
        checkNickname();

        return () => {
            isStale = true;
        };
    }, [debouncedNickname, isValid, accessToken]);

    return { isAvailable, isChecking };
}
