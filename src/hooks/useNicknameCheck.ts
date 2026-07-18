import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { isValidNickname } from '@/utils/validateNickname';

interface NicknameCheckResult {
    isAvailable: boolean | null;
    isChecking: boolean;
}

export function useNicknameCheck(nickname: string): NicknameCheckResult {
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const isValid = isValidNickname(nickname);
    const debouncedNickname = useDebounce(nickname, 600);

    useEffect(() => {
        if (!isValid) return;

        let isStale = false;
        async function checkNickname() {
            setIsChecking(true);
            try {
                const res = await fetch(
                    `/api/users/me/nickname/check?nickname=${encodeURIComponent(debouncedNickname)}`,
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
    }, [debouncedNickname, isValid]);

    return { isAvailable, isChecking };
}
