import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/constants/api';
import type { CurrentUserModel } from '@/types/user';

interface UseCurrentUserResult {
    currentUser: CurrentUserModel | null;
    isLoading: boolean;
    isUnauthorized: boolean;
    refetch: () => void;
}

export function useCurrentUser(
    accessToken: string | null,
): UseCurrentUserResult {
    const [currentUser, setCurrentUser] = useState<CurrentUserModel | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [refetchKey, setRefetchKey] = useState(0);

    useEffect(() => {
        if (!accessToken) return;

        let isStale = false;
        async function fetchCurrentUser() {
            setIsLoading(true);
            try {
                const res = await fetch(`${API_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.status === 401) {
                    if (!isStale) setIsUnauthorized(true);
                    return;
                }
                if (!res.ok) return;
                const data: CurrentUserModel = await res.json();
                if (!isStale) setCurrentUser(data);
            } finally {
                if (!isStale) setIsLoading(false);
            }
        }
        fetchCurrentUser();

        return () => {
            isStale = true;
        };
    }, [accessToken, refetchKey]);

    const refetch = useCallback(() => setRefetchKey((key) => key + 1), []);

    return { currentUser, isLoading, isUnauthorized, refetch };
}
